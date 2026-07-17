const crypto = require('crypto');
const mongoose = require('mongoose');
const PlanDetails = require('../models/PlanDetails');
const User = require('../models/User');
const Payment = require('../models/Payment');

const RAZORPAY_BASE = 'https://api.razorpay.com/v1';

function razorpayAuthHeader() {
  const token = Buffer
    .from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`)
    .toString('base64');
  return `Basic ${token}`;
}

function keysConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

// @desc    Create a Razorpay order for a plan
// @route   POST /api/payments/create-order
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({ success: false, message: 'A valid planId is required' });
    }

    if (!keysConfigured()) {
      return res.status(500).json({ success: false, message: 'Payment gateway is not configured' });
    }

    const plan = await PlanDetails.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const amountPaise = Math.round(Number(plan.amount) * 100);
    if (!amountPaise || amountPaise < 100) {
      return res.status(400).json({ success: false, message: 'Invalid plan amount' });
    }

    // Razorpay receipt must be <= 40 chars.
    const receipt = `rcpt_${req.user.id.toString().slice(-6)}_${Date.now()}`;

    const rzpRes = await fetch(`${RAZORPAY_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: razorpayAuthHeader(),
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt,
        notes: { userId: req.user.id.toString(), planId: planId.toString() },
      }),
    });

    const order = await rzpRes.json();

    if (!rzpRes.ok || !order.id) {
      return res.status(502).json({
        success: false,
        message: order?.error?.description || 'Failed to create payment order',
      });
    }

    // Record a pending payment for audit/reconciliation.
    await Payment.create({
      user: req.user.id,
      plan: plan._id,
      orderId: order.id,
      amount: amountPaise,
      currency: 'INR',
      status: 'created',
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: amountPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
};

// @desc    Verify a Razorpay payment signature and activate the subscription
// @route   POST /api/payments/verify-payment
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const { planId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!planId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'planId, razorpay_order_id, razorpay_payment_id and razorpay_signature are required',
      });
    }

    if (!keysConfigured()) {
      return res.status(500).json({ success: false, message: 'Payment gateway is not configured' });
    }

    const plan = await PlanDetails.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Verify signature: HMAC-SHA256(order_id|payment_id, key_secret)
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const signaturesMatch =
      expectedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));

    if (!signaturesMatch) {
      await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: 'failed', paymentId: razorpay_payment_id }
      );
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Signature valid — activate / extend the subscription.
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const now = new Date();
    const base = (user.subscriptionExpiresAt && user.subscriptionExpiresAt > now)
      ? new Date(user.subscriptionExpiresAt)   // extend an already-active subscription
      : now;

    const expiry = new Date(base);
    if (plan.frequency === 'yearly') {
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
      expiry.setMonth(expiry.getMonth() + 1); // default: monthly
    }

    user.activePlan = plan._id;
    user.subscriptionStatus = 'active';
    user.subscriptionExpiresAt = expiry;
    user.lastPaymentId = razorpay_payment_id;
    user.subscription = true;
    await user.save();

    await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      { status: 'paid', paymentId: razorpay_payment_id, signature: razorpay_signature }
    );

    res.status(200).json({
      success: true,
      message: 'Subscription activated!',
      data: {
        expiryDate: expiry,
        plan: plan.planName,
        subscriptionStatus: 'active',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to verify payment', error: error.message });
  }
};

const crypto = require('crypto');
const mongoose = require('mongoose');
const PlanDetails = require('../models/PlanDetails');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const notifyUser = require('../utils/notifyUser');

// PlanDetails (userType + planType) -> Subscription.plan enum.
function subscriptionPlanKey(plan) {
  if (plan.userType === 'vendor') {
    return plan.planType === 'premium' ? 'vendor_premium' : 'vendor_basic';
  }
  return 'worker';
}

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

    // Admin panel's revenue/subscription views read from the Subscription
    // collection — record one here so a real payment actually shows up there.
    const subscription = await Subscription.create({
      user: user._id,
      plan: subscriptionPlanKey(plan),
      status: 'active',
      startDate: now,
      endDate: expiry,
      amount: plan.amount,
    });

    user.activePlan = plan._id;
    user.subscriptionId = subscription._id;
    user.subscriptionStatus = 'active';
    user.subscriptionExpiresAt = expiry;
    user.lastPaymentId = razorpay_payment_id;
    user.subscription = true;
    await user.save();

    await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      { status: 'paid', paymentId: razorpay_payment_id, signature: razorpay_signature }
    );

    notifyUser(user._id, {
      type: 'subscription_activated',
      title: 'Subscription Activated',
      body: `Your ${plan.planName} plan is now active, valid till ${expiry.toDateString()}.`,
      data: { planId: plan._id.toString(), expiryDate: expiry.toISOString() },
    }).catch((e) => console.error('[verifyPayment] notifyUser failed:', e.message));

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

// ═══════════════════════════════════════════════════════════════════
//  AUTO-PAYMENT (Razorpay Subscriptions)
// ═══════════════════════════════════════════════════════════════════
// One-time payment (upar wala createOrder/verifyPayment) se ye alag
// flow hai. Yahan Razorpay har cycle par khud charge karta hai:
//
//   1. Razorpay par ek Plan hona chahiye  -> ensureRazorpayPlan()
//   2. User ke liye Subscription banao    -> createSubscription
//   3. App checkout kholti hai (subscription_id ke saath), user mandate
//      authorize karta hai (UPI Autopay / card / e-mandate)
//   4. Pehla charge hote hi verify        -> verifySubscription
//   5. Aage ke charges Razorpay khud karta hai -> WEBHOOK batata hai
//   6. User kabhi bhi band kar sakta hai  -> cancelSubscription
//
// Step 5 ke bina system adhoora hai: backend ko renewals ka pata hi
// nahi chalega aur plan hamare DB me expire ho jayega jabki Razorpay
// paise kaat raha hoga. Isliye webhook zaroori hai, optional nahi.

/// Ek cycle aage ki date. verifyPayment bhi yahi hisaab karta hai.
function addCycle(from, frequency) {
  const d = new Date(from);
  if (frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

/// Frequency -> Razorpay ka period/interval.
function razorpayPeriod(frequency) {
  return frequency === 'yearly'
    ? { period: 'yearly', interval: 1 }
    : { period: 'monthly', interval: 1 };
}

/// Plan ka Razorpay Plan id — na ho to bana ke save kar deta hai.
///
/// Ye jaan-boojh kar lazy hai: admin ko Razorpay dashboard par jaake
/// manually plan banane aur id copy karne ki zaroorat nahi.
///
/// NOTE: Razorpay par plan ka amount edit nahi hota. Admin panel se
/// amount/frequency badalne par purana plan id galat ho jaata hai —
/// isliye editPlanAmount wahan razorpayPlanId null kar deta hai, aur
/// agli subscribe par naya plan ban jaata hai.
async function ensureRazorpayPlan(plan) {
  if (plan.razorpayPlanId) return plan.razorpayPlanId;

  const { period, interval } = razorpayPeriod(plan.frequency);
  const res = await fetch(`${RAZORPAY_BASE}/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: razorpayAuthHeader(),
    },
    body: JSON.stringify({
      period,
      interval,
      item: {
        name: plan.planName,
        amount: Math.round(Number(plan.amount) * 100),
        currency: 'INR',
        description: `SiteLink ${plan.planName}`,
      },
      notes: { planId: plan._id.toString() },
    }),
  });

  const body = await res.json();
  if (!res.ok || !body.id) {
    throw new Error(body?.error?.description || 'Failed to create Razorpay plan');
  }

  plan.razorpayPlanId = body.id;
  await plan.save();
  return body.id;
}

// @desc    Auto-payment ke liye Razorpay subscription banao
// @route   POST /api/payments/create-subscription
// @access  Private
exports.createSubscription = async (req, res) => {
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

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Pehle se auto-pay chal raha ho to dobara na banao — warna user ke
    // do mandate ban jaate hain aur dono se paise katte hain.
    if (user.razorpaySubscriptionId && user.autoRenew) {
      return res.status(409).json({
        success: false,
        code: 'AUTOPAY_ALREADY_ACTIVE',
        message: 'Auto-payment is already active on your account',
      });
    }

    const razorpayPlanId = await ensureRazorpayPlan(plan);

    // `total_count` Razorpay ke liye zaroori hai — kitne cycles chalega.
    // Bada rakhte hain (monthly ~10 saal) taaki practically "jab tak
    // user cancel na kare" jaisa behave kare.
    const totalCount = plan.frequency === 'yearly' ? 10 : 120;

    const rzpRes = await fetch(`${RAZORPAY_BASE}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: razorpayAuthHeader(),
      },
      body: JSON.stringify({
        plan_id: razorpayPlanId,
        total_count: totalCount,
        quantity: 1,
        customer_notify: 1,
        notes: {
          userId: user._id.toString(),
          planId: plan._id.toString(),
        },
      }),
    });

    const sub = await rzpRes.json();
    if (!rzpRes.ok || !sub.id) {
      // Subscriptions Razorpay account par ALAG SE enable hota hai — na
      // ho to yahi error aata hai. Isliye Razorpay ka message pass-
      // through karte hain; generic text se wajah pata hi nahi chalti.
      return res.status(502).json({
        success: false,
        message: sub?.error?.description || 'Failed to create subscription',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        subscriptionId: sub.id,
        planName: plan.planName,
        amount: Math.round(Number(plan.amount) * 100),
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Checkout ke baad mandate verify karke auto-pay activate karo
// @route   POST /api/payments/verify-subscription
// @access  Private
exports.verifySubscription = async (req, res) => {
  try {
    const { planId, razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'razorpay_payment_id, razorpay_subscription_id and razorpay_signature are required',
      });
    }
    if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({ success: false, message: 'A valid planId is required' });
    }

    // NOTE: subscription ka signature order se ULTA banta hai —
    // payment_id pehle, subscription_id baad me. Order me
    // order_id + payment_id hota hai. Ulta karne par signature kabhi
    // match nahi hoga.
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const plan = await PlanDetails.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const expiry = addCycle(new Date(), plan.frequency);

    const subscription = await Subscription.create({
      user: user._id,
      plan: subscriptionPlanKey(plan),
      status: 'active',
      startDate: new Date(),
      endDate: expiry,
      amount: plan.amount,
      isRecurring: true,
      razorpaySubscriptionId: razorpay_subscription_id,
    });

    user.activePlan = plan._id;
    user.subscriptionId = subscription._id;
    user.subscriptionStatus = 'active';
    user.subscriptionExpiresAt = expiry;
    user.lastPaymentId = razorpay_payment_id;
    user.subscription = true;
    user.razorpaySubscriptionId = razorpay_subscription_id;
    user.autoRenew = true;
    await user.save();

    notifyUser(user._id, {
      type: 'subscription_activated',
      title: 'Auto-payment Active',
      body: `Your ${plan.planName} plan is active till ${expiry.toDateString()}. It will renew automatically.`,
      data: { planId: plan._id.toString(), expiryDate: expiry.toISOString() },
    }).catch((e) => console.error('[verifySubscription] notifyUser failed:', e.message));

    res.status(200).json({
      success: true,
      message: 'Auto-payment activated!',
      data: {
        expiryDate: expiry,
        plan: plan.planName,
        autoRenew: true,
        subscriptionStatus: 'active',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auto-payment band karo (user kabhi bhi kar sakta hai)
// @route   POST /api/payments/cancel-subscription
// @access  Private
//
// Razorpay par `cancel_at_cycle_end: 1` bhejte hain — mandate turant
// nahi tootta, balki current cycle poora hone par band hota hai. User ne
// jis period ka paisa de diya hai wo use milta rehta hai; bas aage paise
// nahi katenge. Turant band karne se user ka diya hua paisa maara jaata.
exports.cancelSubscription = async (req, res) => {
  try {
    if (!keysConfigured()) {
      return res.status(500).json({ success: false, message: 'Payment gateway is not configured' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.razorpaySubscriptionId) {
      return res.status(400).json({
        success: false,
        code: 'NO_AUTOPAY',
        message: 'Auto-payment is not active on your account',
      });
    }

    const rzpRes = await fetch(
      `${RAZORPAY_BASE}/subscriptions/${user.razorpaySubscriptionId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: razorpayAuthHeader(),
        },
        body: JSON.stringify({ cancel_at_cycle_end: 1 }),
      }
    );

    const body = await rzpRes.json();
    // Razorpay par pehle se cancelled ho (webhook se, ya dashboard se)
    // to use bhi success maano — ab kaam sirf local state sync karna hai.
    const alreadyGone = rzpRes.status === 400 &&
      /already|cancel/i.test(body?.error?.description || '');

    if (!rzpRes.ok && !alreadyGone) {
      return res.status(502).json({
        success: false,
        message: body?.error?.description || 'Failed to cancel auto-payment',
      });
    }

    user.autoRenew = false;
    await user.save();

    if (user.subscriptionId) {
      await Subscription.findByIdAndUpdate(user.subscriptionId, {
        autoRenewCancelledAt: new Date(),
      });
    }

    notifyUser(user._id, {
      type: 'autopay_cancelled',
      title: 'Auto-payment Cancelled',
      body: user.subscriptionExpiresAt
        ? `Your plan stays active till ${new Date(user.subscriptionExpiresAt).toDateString()}. No further payments will be taken.`
        : 'No further payments will be taken.',
      data: {},
    }).catch((e) => console.error('[cancelSubscription] notifyUser failed:', e.message));

    res.status(200).json({
      success: true,
      message: 'Auto-payment cancelled',
      data: {
        autoRenew: false,
        // Plan abhi band nahi hua — cycle ke end tak chalega.
        activeTill: user.subscriptionExpiresAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Razorpay webhook — recurring charges ka pata isi se chalta hai
// @route   POST /api/payments/webhook
// @access  Public (signature se verify hota hai, token se nahi)
//
// Ye endpoint auto-payment ka DIL hai. Pehla charge app se verify hota
// hai, par aage ke saare charges Razorpay apne server se karta hai —
// app tab khuli bhi nahi hoti. Bina webhook ke backend ko renewals ka
// pata hi nahi chalega aur plan hamare DB me expire ho jayega jabki
// Razorpay paise kaat raha hoga.
//
// Signature RAW body par banti hai — isliye server.js me express.json()
// ka `verify` hook raw buffer ko `req.rawBody` me rakh deta hai. Parsed
// JSON ko dobara stringify karke verify karna kaam nahi karta (key order
// aur whitespace badal jaate hain).
exports.razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('[webhook] RAZORPAY_WEBHOOK_SECRET not set — ignoring event');
      return res.status(500).json({ success: false, message: 'Webhook not configured' });
    }

    const signature = req.headers['x-razorpay-signature'];
    const raw = req.rawBody;
    if (!signature || !raw) {
      return res.status(400).json({ success: false, message: 'Missing signature or body' });
    }

    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    if (expected !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body?.event;
    const subEntity = req.body?.payload?.subscription?.entity;
    const rzpSubId = subEntity?.id;

    // Razorpay same event dobara bhi bhej sakta hai (retry). Har handler
    // idempotent hai — wahi value dobara set hoti hai, kuch tootta nahi.
    if (!rzpSubId) {
      // Subscription se related event nahi (payment.captured waghairah).
      // 200 dena zaroori hai, warna Razorpay retry karta rehta hai.
      return res.status(200).json({ success: true, ignored: event });
    }

    const user = await User.findOne({ razorpaySubscriptionId: rzpSubId });
    if (!user) {
      console.warn(`[webhook] ${event}: koi user nahi mila for ${rzpSubId}`);
      return res.status(200).json({ success: true, ignored: 'user not found' });
    }

    const plan = user.activePlan ? await PlanDetails.findById(user.activePlan) : null;

    switch (event) {
      // Har successful auto-charge — yahi renewal hai.
      case 'subscription.charged': {
        const expiry = addCycle(new Date(), plan?.frequency || 'monthly');
        user.subscriptionStatus = 'active';
        user.subscriptionExpiresAt = expiry;
        user.subscription = true;
        await user.save();

        if (user.subscriptionId) {
          await Subscription.findByIdAndUpdate(user.subscriptionId, {
            status: 'active',
            endDate: expiry,
          });
        }

        notifyUser(user._id, {
          type: 'subscription_renewed',
          title: 'Plan Renewed',
          body: `Your plan has been renewed till ${expiry.toDateString()}.`,
          data: { expiryDate: expiry.toISOString() },
        }).catch(() => {});
        break;
      }

      // Cycle end par cancel ho gaya (user ne band kiya tha), ya
      // Razorpay/dashboard se cancel hua.
      case 'subscription.cancelled':
      case 'subscription.completed': {
        user.autoRenew = false;
        user.razorpaySubscriptionId = null;
        await user.save();

        if (user.subscriptionId) {
          await Subscription.findByIdAndUpdate(user.subscriptionId, {
            status: 'cancelled',
          });
        }
        break;
      }

      // Payment baar-baar fail hua (bank/mandate issue) — Razorpay ne
      // subscription rok diya. Plan band nahi karte: expiry tak chalne
      // dete hain, bas user ko batate hain taaki wo theek kar sake.
      case 'subscription.halted':
      case 'subscription.pending': {
        user.autoRenew = false;
        await user.save();

        notifyUser(user._id, {
          type: 'autopay_failed',
          title: 'Auto-payment Failed',
          body: 'We could not take your subscription payment. Please renew manually to keep your plan active.',
          data: {},
        }).catch(() => {});
        break;
      }

      default:
        // Baaki events (activated, authenticated...) — kuch karna nahi,
        // par 200 dena zaroori hai warna Razorpay retry karta rehta hai.
        break;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    // 500 par Razorpay retry karega — jo theek hai, event kho na jaaye.
    console.error('[webhook] error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

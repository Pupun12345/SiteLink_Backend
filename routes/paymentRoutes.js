const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  createSubscription,
  verifySubscription,
  cancelSubscription,
  razorpayWebhook,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// ── One-time payment (purana flow, waisa hi hai) ──────────────────
router.post('/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);

// ── Auto-payment (Razorpay Subscriptions) ─────────────────────────
router.post('/create-subscription', protect, createSubscription);
router.post('/verify-subscription', protect, verifySubscription);
router.post('/cancel-subscription', protect, cancelSubscription);

// Webhook par `protect` NAHI hai — ye Razorpay ke server se aata hai,
// uske paas hamara JWT nahi hota. Auth signature se hoti hai
// (x-razorpay-signature), controller me verify kiya jaata hai.
router.post('/webhook', razorpayWebhook);

module.exports = router;

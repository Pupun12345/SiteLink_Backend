const mongoose = require('mongoose');

const planDetailsSchema = new mongoose.Schema({
    planName: {
        type: String,
        required: true,
        trim: true,
    },
    userType: {
        type: String,
        enum: ['vendor', 'worker'],
        required: true,
    },
    planType: {
        type: String,
        enum: ['basic', 'premium'],
        required: true,
        default: 'basic',
    },
    frequency: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly',
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    features: {
        type: [String],
        default: [],
    },
    // Total workers a vendor on this plan can post across ALL their jobs.
    // Admin-managed / dynamic. 0 = limit not configured (worker-count cap
    // off; only the active-subscription gate applies).
    maxWorkers: {
        type: Number,
        default: 0,
        min: 0,
    },
    // Pehle mahine/saal ki offer price (jaise ₹5). 0 = koi offer nahi.
    // Auto-pay me user abhi ye deta hai, aur ek cycle baad se Razorpay
    // har cycle poora `amount` kaatta hai. Har user ko sirf ek baar.
    introAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    // Razorpay ka Plan id (auto-payment ke liye). Razorpay par
    // subscription banane se pehle wahan ek Plan hona zaroori hai.
    // Pehli baar auto-pay subscribe hone par backend khud bana ke yahan
    // save kar deta hai — admin ko manually kuch nahi karna.
    razorpayPlanId: {
        type: String,
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('PlanDetails', planDetailsSchema);
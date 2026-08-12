const planDetails = require('../models/PlanDetails');
const Subscription = require('../models/Subscription');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Plans list ke saath user ki apni subscription ki state bhi jaati hai,
// taaki app "ye plan active hai, itni tareekh tak" dikha sake bina ek
// aur round-trip ke. Source of truth User ke fields hain — wahi
// verifyPayment set karta hai aur jobs ka quota gate bhi wahi padhta hai.
async function currentSubscription(user) {
    const now = new Date();
    const expiresAt = user.subscriptionExpiresAt
        ? new Date(user.subscriptionExpiresAt)
        : null;

    // `subscriptionStatus` stale ho sakta hai (expiry par koi cron ise
    // 'expired' nahi karta), isliye date hi final faisla karti hai.
    const isActive = user.subscriptionStatus === 'active'
        && !!expiresAt
        && expiresAt > now;

    const planId = user.activePlan ? user.activePlan.toString() : null;

    if (!isActive) {
        return {
            active: false,
            // Kabhi liya tha par ab khatam — app "expired on <date>"
            // dikha kar renew karwa sakti hai.
            status: expiresAt ? 'expired' : 'none',
            planId,
            expiresAt: expiresAt ? expiresAt.toISOString() : null,
        };
    }

    const plan = planId
        ? await planDetails.findById(planId).select('planName frequency amount').lean()
        : null;

    // Started-at Subscription record se — User par sirf expiry rakhi jaati hai.
    let startedAt = null;
    if (user.subscriptionId) {
        const sub = await Subscription.findById(user.subscriptionId).select('startDate').lean();
        startedAt = sub?.startDate ? new Date(sub.startDate).toISOString() : null;
    }

    // Ceil taaki aaj expire hone wale plan par bhi "1 day left" dikhe, "0" nahi.
    const daysRemaining = Math.max(0, Math.ceil((expiresAt - now) / MS_PER_DAY));

    return {
        active: true,
        status: 'active',
        planId,
        planName: plan?.planName || null,
        frequency: plan?.frequency || null,
        amount: plan?.amount ?? null,
        startedAt,
        expiresAt: expiresAt.toISOString(),
        daysRemaining,
        // 7 din ya kam bache to app amber "renew soon" state dikhati hai.
        expiringSoon: daysRemaining <= 7,
    };
}

exports.getPlans = async (req, res) => {
    try {
        let plans = await planDetails.find().sort({ createdAt: 1 }).lean();
        const userType = req.user.userType;
        if (userType) {
            plans = plans.filter(plan => plan.userType === userType);
        }

        const subscription = await currentSubscription(req.user);

        // Har plan par flag — app ko naam/price match nahi karna padta,
        // seedha usi card par "ACTIVE" badge lag jaata hai.
        const data = plans.map(plan => ({
            ...plan,
            isCurrentPlan: subscription.active
                && subscription.planId === plan._id.toString(),
        }));

        return res.status(200).json({ success: true, data, subscription });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};


exports.createPlan = async (req, res) => {
    try {
        const { planName, userType, planType, frequency, amount, features } = req.body;
        if (!planName || !userType || !planType || !frequency || amount === undefined) {
            return res.status(400).json({ success: false, message: 'planName, userType, planType, frequency and amount are required' });
        }
        const plan = await planDetails.create({
            planName: planName.trim(),
            userType,
            planType,
            frequency,
            amount: parseFloat(amount),
            features: Array.isArray(features) ? features.filter(f => f.trim()) : [],
            isActive: true,
        });
        return res.status(201).json({ success: true, message: 'Plan created successfully', data: plan });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

exports.editPlanAmount = async (req, res) => {
    try {
        const { id } = req.params;
        const { planName, userType, planType, frequency, amount, features } = req.body;

        const plan = await planDetails.findById(id);
        if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

        if (planName !== undefined) plan.planName = planName.trim();
        if (userType !== undefined) plan.userType = userType;
        if (planType !== undefined) plan.planType = planType;
        if (frequency !== undefined) plan.frequency = frequency;
        if (amount !== undefined) plan.amount = parseFloat(amount);
        if (features !== undefined) plan.features = Array.isArray(features) ? features.filter(f => f.trim()) : [];

        await plan.save();
        return res.status(200).json({ success: true, message: 'Plan updated successfully', data: plan });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

exports.deletePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await planDetails.findByIdAndDelete(id);
        if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
        return res.status(200).json({ success: true, message: 'Plan deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

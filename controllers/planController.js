const planDetails = require('../models/PlanDetails');



exports.getPlans = async (req, res) => {
    try {
        let plans = await planDetails.find().sort({ createdAt: 1 });
        if(!plans){
            return res.status(404).json({
                success:false,
                message:"Plans not Found"
            })
        }
        return res.status(200).json({ success: true, data: plans });
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

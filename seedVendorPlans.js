// ═══════════════════════════════════════════════════════════════════
//  SEED / UPDATE VENDOR PLANS
// ═══════════════════════════════════════════════════════════════════
// Vendor ke do plans set karta hai — worker quota MAHINE ka hota hai
// (har mahine ki 1 taarikh ko reset).
//
//   Basic     ₹2,999/month   25 workers/month
//   Standard  ₹4,999/month   50 workers/month
//
// Idempotent hai: plan pehle se ho to uska amount/maxWorkers update kar
// deta hai, duplicate nahi banata. Isliye rates badalne par bhi yahi
// script dobara chala sakte hain.
//
// Chalane ka tareeka (backend folder se):
//   node seedVendorPlans.js

require('dotenv').config();
const mongoose = require('mongoose');
const PlanDetails = require('./models/PlanDetails');

const PLANS = [
  {
    planName: 'Basic Plan',
    userType: 'vendor',
    planType: 'basic',
    frequency: 'monthly',
    amount: 2999,
    maxWorkers: 25,
    features: [
      'Post up to 25 workers per month',
      'Access to verified employees',
      'Applicant ratings & profiles',
      'Standard support',
    ],
    isActive: true,
  },
  {
    planName: 'Standard Plan',
    userType: 'vendor',
    planType: 'premium',
    frequency: 'monthly',
    amount: 4999,
    maxWorkers: 50,
    features: [
      'Post up to 50 workers per month',
      'Access to verified & skilled employees',
      'Priority applicant shortlisting',
      'Emergency replacement support',
      'Dedicated support',
    ],
    isActive: true,
  },
];

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing — .env check karo.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected\n');

  for (const p of PLANS) {
    // planType + userType par match karte hain, naam par nahi — naam
    // badal sakta hai, planType backend ka enum hai aur stable hai.
    const existing = await PlanDetails.findOne({
      userType: p.userType,
      planType: p.planType,
    });

    if (existing) {
      existing.planName = p.planName;
      existing.frequency = p.frequency;
      existing.amount = p.amount;
      existing.maxWorkers = p.maxWorkers;
      existing.features = p.features;
      existing.isActive = true;
      await existing.save();
      console.log(`updated  ${p.planName.padEnd(16)} ₹${p.amount}  ${p.maxWorkers} workers/month`);
    } else {
      await PlanDetails.create(p);
      console.log(`created  ${p.planName.padEnd(16)} ₹${p.amount}  ${p.maxWorkers} workers/month`);
    }
  }

  console.log('\nCurrent vendor plans:');
  const all = await PlanDetails.find({ userType: 'vendor' })
    .select('planName planType amount maxWorkers frequency isActive')
    .lean();
  console.table(all.map((x) => ({
    plan: x.planName,
    type: x.planType,
    amount: x.amount,
    maxWorkers: x.maxWorkers,
    frequency: x.frequency,
    active: x.isActive,
  })));

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});

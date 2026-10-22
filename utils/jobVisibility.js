const User = require('../models/User');
const { hasActiveSubscription } = require('./subscription');

// ═══════════════════════════════════════════════════════════════════
//  JOB VISIBILITY — worker ko job kab tak dikhegi
// ═══════════════════════════════════════════════════════════════════
// Rule: job post hone ke baad ZYADA SE ZYADA 30 din dikhti hai, aur utne
// din bhi tabhi tak jab tak vendor ka plan chal raha hai. Jo pehle khatam
// ho, job wahin worker ke liye band.
//
//   Plan 1 taarikh ko liya (1 mahina), job 15 ko post ki:
//     • renew nahi kiya → job ~1 taarikh (agle mahine) tak, plan ke saath band
//     • renew kar liya  → job 30 din poore (15 taarikh agle mahine) tak
//
// Expiry ki koi alag date job par save NAHI karte — vendor renew kare to
// job apne aap wapas dikhne lagti hai (30 din ke andar), aur cron ki
// zaroorat nahi. Admin ki post ki hui jobs par plan ka rule nahi lagta,
// sirf 30 din wala.

const JOB_VISIBLE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/// Is waqt se pehle post hui jobs ab kisi ko nahi dikhti.
function oldestLivePostDate(now = new Date()) {
  return new Date(now.getTime() - JOB_VISIBLE_DAYS * DAY_MS);
}

/// Wo users jinki jobs abhi dikh sakti hain: admin, aur active plan wale
/// vendors. Job list ke Mongo filter me `postedBy: { $in: ... }` ke liye.
async function liveJobPosterIds(now = new Date()) {
  return User.find({
    $or: [
      { userType: 'admin' },
      {
        userType: 'vendor',
        subscriptionStatus: 'active',
        subscriptionExpiresAt: { $gt: now },
      },
    ],
  }).distinct('_id');
}

/// Worker feed ka base filter (approved + active + 30 din + plan).
async function liveJobFilter(now = new Date()) {
  return {
    approvalStatus: 'approved',
    isActive: { $ne: false },
    createdAt: { $gte: oldestLivePostDate(now) },
    postedBy: { $in: await liveJobPosterIds(now) },
  };
}

/// Ek job worker ko kab tak dikhegi. [poster] = job ka postedBy user
/// (userType, subscriptionStatus, subscriptionExpiresAt chahiye).
function jobVisibleUntil(job, poster, now = new Date()) {
  const maxDate = new Date(new Date(job.createdAt).getTime() + JOB_VISIBLE_DAYS * DAY_MS);
  if (poster?.userType === 'admin') return maxDate;
  // Plan active nahi (status inactive/expired) to expiry date jo bhi ho,
  // job abhi se band — list ke filter se match rakhne ke liye.
  const planEnd = hasActiveSubscription(poster)
    ? new Date(poster.subscriptionExpiresAt)
    : new Date(Math.min(now.getTime(), new Date(poster?.subscriptionExpiresAt || 0).getTime()));
  return planEnd < maxDate ? planEnd : maxDate;
}

/// Job abhi workers ko dikh rahi hai?
function isJobLive(job, poster, now = new Date()) {
  if (!job || job.approvalStatus !== 'approved' || job.isActive === false) return false;
  return jobVisibleUntil(job, poster, now) > now;
}

/// Vendor ko dikhane ke liye poori tasveer: kab tak dikhegi, abhi live
/// hai ya nahi, aur band hai to KYUN — app usi hisaab se label aur
/// "Renew plan" button dikhata hai.
///   hiddenReason: null | 'expired' (30 din poore) | 'plan_ended'
///   (approval pending/rejected ya deactivated jobs par null — unka apna
///   badge pehle se hai.)
function jobVisibility(job, poster, now = new Date()) {
  const visibleUntil = jobVisibleUntil(job, poster, now);
  const isLive = isJobLive(job, poster, now);
  let hiddenReason = null;
  if (!isLive && job.approvalStatus === 'approved' && job.isActive !== false) {
    const maxDate = new Date(new Date(job.createdAt).getTime() + JOB_VISIBLE_DAYS * DAY_MS);
    hiddenReason = maxDate <= now ? 'expired' : 'plan_ended';
  }
  return { visibleUntil, isLive, hiddenReason };
}

/// postedBy user ki sirf wahi fields jo upar ke check ke liye chahiye.
const POSTER_FIELDS = 'userType subscriptionStatus subscriptionExpiresAt';

module.exports = {
  JOB_VISIBLE_DAYS,
  POSTER_FIELDS,
  liveJobFilter,
  jobVisibleUntil,
  isJobLive,
  jobVisibility,
};

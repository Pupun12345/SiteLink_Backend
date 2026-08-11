const Application = require('../models/Application');
const User = require('../models/User');

// ═══════════════════════════════════════════════════════════════════
//  WORKER RATING — automatic, kaam ke outcomes se
// ═══════════════════════════════════════════════════════════════════
// Koi bhi manually rating nahi deta. Vendor sirf FACT mark karta hai ki
// hire kiye worker ne kaam poora kiya, beech me chhoda, ya aaya hi nahi.
// Rating unhi outcomes se nikalti hai.
//
// Har outcome ka score (0..1):
//   completed   1.00  — kaam poora kiya
//   left_early  0.40  — aaya, kaam kiya, par poora nahi
//   no_show     0.00  — vendor ka din barbaad, sabse bura
//
// ── Ek naya worker 5.0 kyun nahi ban jaata ──────────────────────────
// Sirf average lete to pehli hi completed job par worker ko 5.0 mil
// jaata, aur wo 50 job wale 4.7 star worker se upar dikhta — jo galat
// hai, kyunki ek job se kuch sabit nahi hota.
//
// Isliye Bayesian smoothing: shuru me har worker ke "khaate" me 3
// kaalpanik average jobs (0.6 = 3★) maan lete hain. Jaise-jaise asli
// jobs badhti hain, unka asar khatam hota jaata hai aur rating asli
// performance par aa jaati hai.
//
//   1 completed   → 3.5★     (achha, par abhi sabit nahi)
//   5 completed   → 4.3★
//   20 completed  → 4.7★
//   50 completed  → 4.9★
//   1 no_show     → 2.3★
//   10 completed + 2 no_show → 3.9★
const OUTCOME_SCORE = {
  completed: 1.0,
  left_early: 0.4,
  no_show: 0.0,
};

const PRIOR_SCORE = 0.6; // 3★ — neutral shuruaat
const PRIOR_WEIGHT = 3;  // itni "kaalpanik" jobs ke barabar

// Verified worker ko halka sa edge — ID verify karana bhi bharose ka
// signal hai. Jaan-bujh kar bahut chhota rakha hai taaki ye asli kaam
// ke performance ko dabaa na de.
const VERIFIED_BONUS = 0.02;

/**
 * Outcome counts se 0–5 rating nikalta hai.
 * Pure function — test karna aasan, DB ki zaroorat nahi.
 *
 * @param {{completed:number, left_early:number, no_show:number}} counts
 * @param {{isVerified?: boolean}} [opts]
 * @returns {number} 0.0–5.0, ek decimal tak
 */
function computeRating(counts, opts = {}) {
  const completed = Number(counts.completed) || 0;
  const leftEarly = Number(counts.left_early) || 0;
  const noShow = Number(counts.no_show) || 0;
  const total = completed + leftEarly + noShow;

  // Naya worker — abhi koi kaam hua hi nahi. 0 ka matlab "kharaab" nahi,
  // "abhi rating nahi" hai; UI ise "New" dikhata hai.
  if (total === 0) return 0;

  const earned =
    completed * OUTCOME_SCORE.completed +
    leftEarly * OUTCOME_SCORE.left_early +
    noShow * OUTCOME_SCORE.no_show;

  const smoothed =
    (earned + PRIOR_SCORE * PRIOR_WEIGHT) / (total + PRIOR_WEIGHT);

  const withBonus = smoothed + (opts.isVerified ? VERIFIED_BONUS : 0);
  const stars = Math.max(0, Math.min(5, withBonus * 5));

  return Math.round(stars * 10) / 10; // ek decimal — 4.3 jaisa
}

/**
 * Ek worker ke saare outcomes padh kar uski rating dobara calculate
 * karta hai aur User par save karta hai (denormalized).
 *
 * Jab bhi kisi application ka outcome set/badle tab call karo.
 * Fail ho jaaye to throw nahi karta — rating update na hona itna
 * important nahi ki poora request fail ho jaaye.
 *
 * @returns {Promise<{rating:number, jobsCompleted:number, ratedJobsCount:number}|null>}
 */
async function recalculateWorkerRating(workerId) {
  try {
    const rows = await Application.aggregate([
      {
        $match: {
          applicant: typeof workerId === 'string'
            ? new (require('mongoose').Types.ObjectId)(workerId)
            : workerId,
          outcome: { $ne: null },
        },
      },
      { $group: { _id: '$outcome', n: { $sum: 1 } } },
    ]);

    const counts = { completed: 0, left_early: 0, no_show: 0 };
    for (const r of rows) {
      if (r._id in counts) counts[r._id] = r.n;
    }

    const user = await User.findById(workerId).select('isVerified');
    const rating = computeRating(counts, { isVerified: !!user?.isVerified });
    const ratedJobsCount =
      counts.completed + counts.left_early + counts.no_show;

    await User.findByIdAndUpdate(workerId, {
      rating,
      jobsCompleted: counts.completed,
      ratedJobsCount,
      ratingUpdatedAt: new Date(),
    });

    return { rating, jobsCompleted: counts.completed, ratedJobsCount };
  } catch (error) {
    console.error('[workerRating] recalculate failed:', error.message);
    return null;
  }
}

module.exports = {
  computeRating,
  recalculateWorkerRating,
  OUTCOME_SCORE,
};

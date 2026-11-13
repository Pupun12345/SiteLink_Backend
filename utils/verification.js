// Worker verified hai? Admin approve karne par dono set hote hain
// (isVerified + verificationStatus 'verified'); purane accounts me kabhi
// sirf ek hota hai — isliye dono me se koi bhi chalega. Reject par
// isVerified false + status 'rejected' ho jaata hai.
function isVerifiedWorker(user) {
  if (!user) return false;
  if (user.verificationStatus === 'rejected') return false;
  return user.isVerified === true || user.verificationStatus === 'verified';
}

// Bina verification ke worker job apply / plan nahi le sakta.
const NOT_VERIFIED = {
  success: false,
  code: 'NOT_VERIFIED',
  message: 'Your profile is not verified yet. You can apply to jobs and buy a plan after your Government ID is verified.',
};

module.exports = { isVerifiedWorker, NOT_VERIFIED };

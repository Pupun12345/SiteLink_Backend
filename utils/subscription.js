// ═══════════════════════════════════════════════════════════════════
//  SUBSCRIPTION — "is user ka plan abhi chal raha hai?" ka ek hi jawab
// ═══════════════════════════════════════════════════════════════════
// Ye check ab kai jagah lagti hai (vendor job post, worker job apply,
// contact support, plans screen). Alag-alag jagah copy karne se ek din
// ek jagah rehne wali hai — isliye ek hi helper.
//
// `subscriptionStatus` par akele bharosa nahi karte: expiry par koi cron
// use 'expired' nahi karta, isliye wo stale ho sakta hai. Date hi final
// faisla hai.

/// User ka plan abhi active hai?
function hasActiveSubscription(user) {
  if (!user) return false;
  const expiresAt = user.subscriptionExpiresAt
    ? new Date(user.subscriptionExpiresAt)
    : null;
  return user.subscriptionStatus === 'active'
    && !!expiresAt
    && expiresAt > new Date();
}

/// Standard 403 body jab plan zaroori ho. `code` isliye ki app message
/// ka text parse kiye bina seedha Plans screen khol sake.
function subscriptionRequired(message) {
  return {
    success: false,
    code: 'SUBSCRIPTION_REQUIRED',
    message,
  };
}

module.exports = { hasActiveSubscription, subscriptionRequired };

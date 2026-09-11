// ═══════════════════════════════════════════════════════════════════
//  OTP SMS DELIVERY — MSG91
// ═══════════════════════════════════════════════════════════════════
// Yahan sirf DELIVERY hai. OTP banana aur verify karna hamare paas hi
// rehta hai (utils/otpUtils.js + User model ke otp/otpExpire/otpAttempts)
// — wo logic already sahi hai: expiry, attempt-count aur rate limiting
// sab handle karta hai. MSG91 ko hum apna banaya hua OTP dete hain aur
// wo bas SMS pahuncha deta hai.
//
// Isse do fayde hain:
//   • authkey kabhi app tak nahi jaata — sirf server ke paas rehta hai
//   • verify hamare DB se hota hai, to MSG91 down hone par bhi pehle se
//     bheja hua OTP kaam karta rehta hai
//
// MSG91 ka JavaScript widget (widgetId + tokenAuth wala) jaan-boojh kar
// use NAHI kiya — wo browser ka widget hai, Flutter me chalane ke liye
// WebView chahiye hoti aur poora OTP flow app-side chala jaata. Uski
// koi zaroorat nahi jab app ke apne OTP screens pehle se kaam kar rahe
// hain.

const MSG91_BASE = 'https://control.msg91.com/api/v5/otp';

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/// Sirf authkey zaroori hai.
///
/// `MSG91_TEMPLATE_ID` optional hai: is account ke OTP Widget me
/// Channels → SMS par "Use Default Configuration" chuna hua hai (dashboard
/// me verify kiya gaya), yani koi custom template use nahi ho raha aur
/// MSG91 default template se bhejta hai. Set karne par hi override hoga.
function msg91Configured() {
  return !!process.env.MSG91_AUTH_KEY;
}

/// OTP SMS bhejo.
///
/// Returns `{ sent: boolean, message: string }` — throw nahi karta,
/// taaki caller khud decide kar sake ki fail hone par kya karna hai.
///
/// Development me kuch nahi bheja jaata: OTP `123456` fix hai aur API
/// response me hi aa jaata hai, isliye SMS credits jalane ka matlab
/// nahi. Ye chup-chaap `sent: true` lautata hai.
async function sendOtpSms(phone, otp) {
  if (!isProduction()) {
    console.log(`[DEV ONLY] OTP for +91${phone}: ${otp} (SMS skipped)`);
    return { sent: true, message: 'dev mode — SMS skipped' };
  }

  if (!msg91Configured()) {
    console.error(
      '[sendOtpSms] MSG91_AUTH_KEY set nahi hai — OTP SMS nahi ja raha. ' +
      'Production me ye login poori tarah todta hai.'
    );
    return { sent: false, message: 'SMS service is not configured' };
  }

  // Sirf 10-digit Indian number expected hai (routes par validate hota
  // hai), par defensively saaf kar lete hain — space/dash/+91 aa jaye to
  // MSG91 number reject kar deta hai.
  const mobile = `91${String(phone).replace(/\D/g, '').slice(-10)}`;

  const params = new URLSearchParams({
    mobile,
    otp: String(otp),
    // Hamare DB ki expiry 10 min hai (getOTPExpiry) — dono ek jaisi
    // rakhna zaroori hai, warna user ko SMS me kuch aur likha dikhega.
    otp_expiry: '10',
    authkey: process.env.MSG91_AUTH_KEY,
  });

  // Sirf tab bhejo jab explicitly set ho — warna MSG91 widget ki default
  // SMS configuration use karta hai, jo is account par chuna hua hai.
  if (process.env.MSG91_TEMPLATE_ID) {
    params.set('template_id', process.env.MSG91_TEMPLATE_ID);
  }

  try {
    const res = await fetch(`${MSG91_BASE}?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const body = await res.json().catch(() => ({}));

    // SAAVDHAAN: is endpoint ka "success" bharosemand NAHI hai. Ye
    // request queue karke turant `{"type":"success"}` de deta hai —
    // testing me ye jaanboojhkar GALAT authkey par bhi success laut
    // aaya. Yani yahan se ye pata nahi chalta ki SMS gaya ya nahi.
    //
    // Asli failures (galat/na-approved template, IP whitelist block,
    // credits khatam, operator ka drop) sirf MSG91 dashboard ke
    // delivery logs me dikhte hain. "OTP nahi aaya" ki shikayat par
    // wahi dekhna hoga — yahan ka log kaafi nahi hai.
    //
    // Check phir bhi rakha hai: network/HTTP-level gadbad ye pakad
    // leta hai, bas iske paas hone ka matlab "deliver ho gaya" nahi.
    if (!res.ok || body.type === 'error') {
      const reason = body.message || `HTTP ${res.status}`;
      console.error(`[sendOtpSms] MSG91 failed for ${mobile}: ${reason}`);
      return { sent: false, message: 'Could not send OTP. Please try again.' };
    }

    return { sent: true, message: 'OTP sent' };
  } catch (error) {
    console.error(`[sendOtpSms] MSG91 request error: ${error.message}`);
    return { sent: false, message: 'Could not send OTP. Please try again.' };
  }
}

module.exports = { sendOtpSms, msg91Configured };

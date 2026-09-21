// OTP kitne digit ka hai — ye ek hi jagah tay hota hai.
//
// Pehle ye 6 par fix tha aur teen jagah alag-alag likha tha (generator,
// auth routes ki validation, profile routes ki validation). Length
// badalne par koi ek jagah chhoot jaati to generator 4-digit banata aur
// validator 6 maangta — har OTP "invalid" ho jaata. Isliye ab sab yahan
// se aata hai.
const OTP_LENGTH = 4;

const OTP_MIN = Math.pow(10, OTP_LENGTH - 1);        // 4 digit → 1000
const OTP_RANGE = OTP_MIN * 9;                        // 4 digit → 9000

// Dev me fix OTP — generate karne ki zaroorat nahi, aur SMS bhi nahi
// jaata. Length badle to ye bhi saath me badalta hai: 4 → "1234",
// 6 → "123456".
const DEV_OTP = '123456789'.slice(0, OTP_LENGTH);

const generateOTP = () => {
  return Math.floor(OTP_MIN + Math.random() * OTP_RANGE).toString();
};

// Get OTP expiration time (10 minutes from now)
const getOTPExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

module.exports = {
  OTP_LENGTH,
  DEV_OTP,
  generateOTP,
  getOTPExpiry,
};

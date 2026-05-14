const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const userData = {
    id: user._id,
    phone: user.phone,
    isPhoneVerified: user.isPhoneVerified,
    userType: user.userType,
    role: user.role,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage,
  };

  // Add worker-specific fields if profile already created
  if (user.userType === 'worker') {
    userData.primarySkill = user.primarySkill;
    userData.additionalSkills = user.skills;
    userData.totalExperience = user.experience;
    userData.city = user.city;
    userData.workState = user.workState;
    userData.preferredCity = user.city;
    userData.willingtoRelocate = user.willingtoRelocate;
    userData.salaryType = user.salaryType;
    userData.salary = user.salary;
  }

  // Add vendor-specific fields if profile already created
  if (user.userType === 'vendor') {
    userData.companyName = user.companyName;
    userData.companyLogo = user.companyLogo;
    userData.designation = user.designation;
    userData.workArea = user.workArea;
    userData.gstNumber = user.gstNumber;
    userData.whatsappNumber = user.whatsappNumber;
    userData.website = user.website;
    userData.city = user.city;
  }

  res.status(statusCode).json({
    success: true,
    token,
    user: userData,
  });
};

module.exports = { generateToken, sendTokenResponse };
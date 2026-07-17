const User = require('../models/User');
const Skill = require('../models/Skill');
const Post = require('../models/Post');
const { generateOTP, getOTPExpiry } = require('../utils/otpUtils');

const STATES = [
  { id: 1, name: 'Andhra Pradesh' },
  { id: 2, name: 'Arunachal Pradesh' },
  { id: 3, name: 'Assam' },
  { id: 4, name: 'Bihar' },
  { id: 5, name: 'Chhattisgarh' },
  { id: 6, name: 'Goa' },
  { id: 7, name: 'Gujarat' },
  { id: 8, name: 'Haryana' },
  { id: 9, name: 'Himachal Pradesh' },
  { id: 10, name: 'Jharkhand' },
  { id: 11, name: 'Karnataka' },
  { id: 12, name: 'Kerala' },
  { id: 13, name: 'Madhya Pradesh' },
  { id: 14, name: 'Maharashtra' },
  { id: 15, name: 'Manipur' },
  { id: 16, name: 'Meghalaya' },
  { id: 17, name: 'Mizoram' },
  { id: 18, name: 'Nagaland' },
  { id: 19, name: 'Odisha' },
  { id: 20, name: 'Punjab' },
  { id: 21, name: 'Rajasthan' },
  { id: 22, name: 'Sikkim' },
  { id: 23, name: 'Tamil Nadu' },
  { id: 24, name: 'Telangana' },
  { id: 25, name: 'Tripura' },
  { id: 26, name: 'Uttar Pradesh' },
  { id: 27, name: 'Uttarakhand' },
  { id: 28, name: 'West Bengal' },
  { id: 29, name: 'Delhi' },
  { id: 30, name: 'Jammu & Kashmir' },
];

const CITIES = {
  1: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Rajahmundry'],
  2: ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro'],
  3: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia'],
  4: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga'],
  5: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon'],
  6: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  7: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar'],
  8: ['Faridabad', 'Gurugram', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar'],
  9: ['Shimla', 'Manali', 'Dharamshala', 'Solan', 'Mandi', 'Kullu'],
  10: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh'],
  11: ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Davangere'],
  12: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha'],
  13: ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Rewa'],
  14: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Thane', 'Kolhapur'],
  15: ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Senapati'],
  16: ['Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Baghmara'],
  17: ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib'],
  18: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha'],
  19: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri'],
  20: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot'],
  21: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Alwar', 'Bharatpur'],
  22: ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo'],
  23: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Vellore'],
  24: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam'],
  25: ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar', 'Belonia'],
  26: ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Ghaziabad', 'Noida'],
  27: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Rishikesh'],
  28: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman'],
  29: ['New Delhi', 'Dwarka', 'Rohini', 'Janakpuri', 'Laxmi Nagar', 'Saket', 'Pitampura'],
  30: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore', 'Kathua'],
};

// @desc  Get all states
// @route GET /api/profile/states
exports.getStates = (req, res) => {
  res.status(200).json({ success: true, data: STATES });
};

// @desc  Get cities by state id
// @route GET /api/profile/cities/:stateId
exports.getCitiesByState = (req, res) => {
  const stateId = parseInt(req.params.stateId);
  if (isNaN(stateId)) return res.status(400).json({ success: false, message: 'Invalid state ID' });
  const state = STATES.find(s => s.id === stateId);

  if (!state) {
    return res.status(404).json({ success: false, message: 'State not found' });
  }

  const cities = (CITIES[stateId] || []).map((name, index) => ({ id: index + 1, name }));
  res.status(200).json({ success: true, state: state.name, data: cities });
};

function getLocationByIds(workStateID, workCityID) {
  const stateId = parseInt(workStateID);
  const cityId = parseInt(workCityID);

  const state = STATES.find(s => s.id === stateId);
  if (!state) return { workState: null, workCity: null };

  const cityName = (CITIES[stateId] || [])[cityId - 1];
  if (!cityName) return { workState: state.name, workCity: null };

  return { workState: state.name, workCity: cityName };
};

//Get Skills with number
exports.getSkills = async (req, res) => {
  try {
    const skills = await Skill.find();
    res.status(200).json({ success: true, data: skills });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

exports.languages = async (req, res) => {
  try {
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({
        success: false,
        message: "Language is required",
      });
    }

    const allowed = ['hindi', 'english'];
    const normalized = String(language).toLowerCase();
    if (!allowed.includes(normalized)) {
      return res.status(400).json({
        success: false,
        message: "Language must be one of: hindi, english",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { language: normalized },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Language updated successfully",
      data: { language: user.language },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const regularUser = await User.findById(req.user.id);

    if (!regularUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const Posts = await Post.find({ postedBy: regularUser._id }).sort({ createdAt: -1 });

    const user = regularUser.userType === 'worker'
      ? {
        id: regularUser._id,
        name: regularUser.name,
        email: regularUser.email,
        role: regularUser.role,
        profileImage: regularUser.profileImage,
        primarySkill: regularUser.primarySkill,
        skills: regularUser.skills,
        posts: Posts,
        workCity: regularUser.city,
        workState: regularUser.workState,
        userType: regularUser.userType,
        createdAt: regularUser.createdAt,
        location: regularUser.location,
        dateOfBirth: regularUser.dateOfBirth,
        experienceCertificate: regularUser.experienceCertificate,
        governmentID: regularUser.governmentID,
        workSamplesPhoto: regularUser.workSamplesPhoto,
        isPhoneVerified: regularUser.isPhoneVerified,
        isVerified: regularUser.isVerified,
        language: regularUser.language,
        verificationStatus: regularUser.verificationStatus,
        subscription: regularUser.subscription
      }
      : {
        id: regularUser._id,
        name: regularUser.name,
        email: regularUser.email,
        role: regularUser.role,
        profileImage: regularUser.profileImage,
        userType: regularUser.userType,
        createdAt: regularUser.createdAt,
        workCity: regularUser.city,
        workState: regularUser.workState,
        phone: regularUser.phone,
        gstNumber: regularUser.gstNumber,
        companyName: regularUser.companyName,
        companyLogo: regularUser.companyLogo,
        designation: regularUser.role,
        workArea: regularUser.workArea,
        whatsappNumber: regularUser.whatsappNumber,
        website: regularUser.website,
        panNumber: regularUser.panNumber,
        panCardImage: regularUser.panCardImage,
        gstCertificate: regularUser.gstCertificate,
        isPhoneVerified: regularUser.isPhoneVerified,
        isVerified: regularUser.isVerified,
        language: regularUser.language,
        verificationStatus: regularUser.verificationStatus,
        subscription: regularUser.subscription
      };

    return res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Create Profile - Worker
exports.createWorkerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.userType && user.userType !== 'worker') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { primarySkillId, secondarySkillId, otherSkill } = req.body;

    if (!primarySkillId) return res.status(400).json({ success: false, message: 'Primary skill is required' });

    const parsedPrimarySkillId = parseInt(primarySkillId);
    if (isNaN(parsedPrimarySkillId)) return res.status(400).json({ success: false, message: 'Invalid primary skill ID' });

    const primarySkillDoc = await Skill.findOne({ id: parsedPrimarySkillId });

    if (!primarySkillDoc) return res.status(404).json({ success: false, message: 'Primary skill not found' });

    const newSkills = [];

    let parsedSecondarySkillId = secondarySkillId;
    if (typeof secondarySkillId === 'string' && secondarySkillId.startsWith('[')) {
      try { parsedSecondarySkillId = JSON.parse(secondarySkillId); } catch { parsedSecondarySkillId = [secondarySkillId]; }
    }
    const secondaryIds = Array.isArray(parsedSecondarySkillId) ? parsedSecondarySkillId : (parsedSecondarySkillId != null ? [parsedSecondarySkillId] : []);
    const filteredSecondaryIds = secondaryIds.filter(id => id != null && id !== '' && id !== '0' && id !== 'none' && id !== 0);

    const uniqueSecondaryIds = [...new Set(
      filteredSecondaryIds.filter(
        id => parseInt(id) !== parsedPrimarySkillId
      )
    )];
    for (const secondary of uniqueSecondaryIds) {
      const parsedSecondaryId = parseInt(secondary);
      if (isNaN(parsedSecondaryId)) return res.status(400).json({ success: false, message: 'Invalid secondary skill ID' });
      const secondarySkillDoc = await Skill.findOne({ id: parsedSecondaryId });
      if (!secondarySkillDoc) return res.status(404).json({ success: false, message: 'Secondary skill not found' });
      newSkills.push({ skillId: secondarySkillDoc.id, skillName: secondarySkillDoc.name });
    }

    if (otherSkill && otherSkill.trim()) {
      newSkills.push({ skillId: 0, skillName: otherSkill.trim() });
    }

    user.skills = newSkills;


    const { workStateID, workCityID } = req.body;

    const { workState, workCity } = getLocationByIds(workStateID, workCityID);

    if ((workStateID && !workState) || (workCityID && !workCity)) {
      return res.status(404).json({ success: false, message: 'Invalid work state or city' });
    }

    if ((workStateID && !workCityID) || (!workStateID && workCityID)) {
      return res.status(400).json({
        success: false,
        message: "Both state and city are required"
      });
    }

    if (workState && workCity) {
      user.workState = workState;
      user.city = workCity;
    }

    const { name, dateOfBirth, gender, totalExperience, experienceDescription, willingtoRelocate, salaryType, salary, location } = req.body;

    if (dateOfBirth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateOfBirth)) {
        return res.status(400).json({ success: false, message: 'Date of birth should be in format YYYY-MM-DD (Example: 2002-09-23)' });
      }
      if (isNaN(new Date(dateOfBirth).getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date of birth' });
      }

      // Additional check to ensure DOB is not in the future
      const dob = new Date(dateOfBirth);
      if (
        isNaN(dob.getTime()) ||
        dob > new Date()
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid DOB"
        });
      }

      const age = new Date().getFullYear() - dob.getFullYear();

      if (age < 18) {
        return res.status(400).json({
          success: false,
          message: "Minimum age is 18"
        });
      }

      user.dateOfBirth = dob;
    }


    if (name) user.name = name.trim();

    if (gender) {
      const allowedGenders = ['male', 'female', 'other'];
      if (!allowedGenders.includes(gender.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: "Invalid gender"
        });
      }

      user.gender = gender;
    }

    if (totalExperience !== undefined) {
      const exp = Number(totalExperience);
      if (isNaN(exp) || exp < 0 || exp > 60) {
        return res.status(400).json({
          success: false,
          message: "Invalid experience"
        });
      }
      user.experience = exp;
    }

    if (experienceDescription) {
      if (experienceDescription.length > 1000) {
        return res.status(400).json({ success: false, message: "Experience description must be less than 1000 characters" });
      }
      user.experienceDescription = experienceDescription.trim();
    }
    if (willingtoRelocate !== undefined) user.willingtoRelocate = willingtoRelocate;
    if (salaryType) user.salaryType = salaryType.toLowerCase();

    if (salary !== undefined) {
      const parsedSalary = Number(salary);
      if (isNaN(parsedSalary) || parsedSalary < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid salary"
        });
      }
      user.salary = parsedSalary;
    }

    if (location) user.location = location.trim();

    user.primarySkill = primarySkillDoc.name;
    user.role = primarySkillDoc.name;
    user.userType = 'worker';
    user.isProfileCreated = true;

    if (!req.files || !req.files.governmentID) {
      return res.status(400).json({
        success: false,
        message: "Government ID is required."
      });
    }

    if (req.files.profileImage) {
      user.profileImage = req.files.profileImage[0].path;
    }

    if (req.files.workSamplesPhoto) {
      user.workSamplesPhoto = req.files.workSamplesPhoto.map(f => f.path);
    }

    if (req.files.experienceCertificate) {
      user.experienceCertificate = req.files.experienceCertificate[0].path;
    }

    // Mandatory field
    user.governmentID = req.files.governmentID[0].path;
    await user.save();

    res.json({
      success: true,
      message: 'Worker profile created successfully',
      user: { id: user._id, name: user.name, phone: user.phone, userType: user.userType, role: user.role, profileImage: user.profileImage, workCity: user.city, primarySkill: user.primarySkill, additionalSkills: user.skills, totalExperience: user.experience, workState: user.workState, willingtoRelocate: user.willingtoRelocate, salaryType: user.salaryType, salary: user.salary, governmentID: user.governmentID, workSamplesPhoto: user.workSamplesPhoto, experienceCertificate: user.experienceCertificate, language: user.language, isVerified: user.isVerified, verificationStatus: user.verificationStatus, isProfileCreated: user.isProfileCreated, subscription: user.subscription }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Edit Profile - Worker
exports.editWorkerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.userType !== 'worker') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { primarySkillId, secondarySkillId, otherSkill, name, dateOfBirth, gender, totalExperience, experienceDescription, willingtoRelocate, salaryType, salary, location, workStateID, workCityID } = req.body;

    if (primarySkillId) {
      const parsedPrimaryId = parseInt(primarySkillId);
      if (isNaN(parsedPrimaryId)) return res.status(400).json({ success: false, message: 'Invalid primary skill ID' });
      const primarySkillDoc = await Skill.findOne({ id: parsedPrimaryId });
      if (!primarySkillDoc) return res.status(404).json({ success: false, message: 'Primary skill not found' });

      let parsedSecondarySkillId = secondarySkillId;
      if (typeof secondarySkillId === 'string' && secondarySkillId.startsWith('[')) {
        try { parsedSecondarySkillId = JSON.parse(secondarySkillId); } catch { parsedSecondarySkillId = [secondarySkillId]; }
      }
      const secondaryIds = Array.isArray(parsedSecondarySkillId) ? parsedSecondarySkillId : (parsedSecondarySkillId != null ? [parsedSecondarySkillId] : []);
      const filteredSecondaryIds = secondaryIds.filter(id => id != null && id !== '' && id !== '0' && id !== 'none' && id !== 0);

      const uniqueSecondaryIds = [...new Set(
        filteredSecondaryIds.filter(
          id => parseInt(id) !== parsedPrimaryId
        )
      )];

      const newSkills = [];

      for (const secondary of uniqueSecondaryIds) {
        const parsedSecondaryId = parseInt(secondary);
        if (isNaN(parsedSecondaryId)) return res.status(400).json({ success: false, message: 'Invalid secondary skill ID' });
        const secondarySkillDoc = await Skill.findOne({ id: parsedSecondaryId });
        if (!secondarySkillDoc) return res.status(404).json({ success: false, message: 'Secondary skill not found' });
        newSkills.push({ skillId: secondarySkillDoc.id, skillName: secondarySkillDoc.name });
      }
      if (otherSkill && otherSkill.trim()) newSkills.push({ skillId: 0, skillName: otherSkill.trim() });

      user.skills = newSkills;
      user.markModified('skills');
      user.primarySkill = primarySkillDoc.name;
      user.role = primarySkillDoc.name;
    }

    if ((workStateID && !workCityID) || (!workStateID && workCityID)) {
      return res.status(400).json({
        success: false,
        message: "Both state and city are required"
      });
    }

    if (workStateID && workCityID) {
      const { workState, workCity } = getLocationByIds(workStateID, workCityID);
      if (workState) user.workState = workState;
      if (workCity) user.city = workCity;
    }

    if (name) user.name = name.trim();
    if (dateOfBirth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateOfBirth)) return res.status(400).json({ success: false, message: 'Date of birth should be in format YYYY-MM-DD (Example: 2002-09-23)' });
      if (isNaN(new Date(dateOfBirth).getTime())) return res.status(400).json({ success: false, message: 'Invalid date of birth' });

      // Additional check to ensure DOB is not in the future
      const dob = new Date(dateOfBirth);
      if (
        isNaN(dob.getTime()) ||
        dob > new Date()
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid DOB"
        });
      }

      const age = new Date().getFullYear() - dob.getFullYear();

      if (age < 18) {
        return res.status(400).json({
          success: false,
          message: "Minimum age is 18"
        });
      }

      user.dateOfBirth = dob;
    }

    if (gender) {
      const allowedGenders = ['male', 'female', 'other'];
      if (!allowedGenders.includes(gender.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: "Invalid gender"
        });
      }

      user.gender = gender;
    }

    if (totalExperience !== undefined) {
      const exp = Number(totalExperience);
      if (isNaN(exp) || exp < 0 || exp > 60) {
        return res.status(400).json({
          success: false,
          message: "Invalid experience"
        });
      }
      user.experience = exp;
    }

    if (experienceDescription) {
      if (experienceDescription.length > 1000) {
        return res.status(400).json({ success: false, message: "Experience description must be less than 1000 characters" });
      }
      user.experienceDescription = experienceDescription.trim();
    }

    if (willingtoRelocate !== undefined) user.willingtoRelocate = willingtoRelocate;
    if (salaryType) user.salaryType = salaryType;

    if (salary !== undefined) {
      const parsedSalary = Number(salary);
      if (isNaN(parsedSalary) || parsedSalary < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid salary"
        });
      }
      user.salary = parsedSalary;
    }

    if (location) user.location = location.trim();

    if (req.files) {
      if (req.files.profileImage) {
        user.profileImage = req.files.profileImage[0].path;
      }
      if (req.files.workSamplesPhoto) user.workSamplesPhoto = req.files.workSamplesPhoto.map(f => f.path);
      if (req.files.experienceCertificate) user.experienceCertificate = req.files.experienceCertificate[0].path;
      if (req.files.governmentID) user.governmentID = req.files.governmentID[0].path;
    }

    if (!user.governmentID) {
      return res.status(400).json({
        success: false,
        message: "Government ID is required."
      });
    }

    await user.save();
    const savedUser = await User.findById(user._id);

    res.json({
      success: true,
      message: 'Worker profile updated successfully',
      user: { id: savedUser._id, name: savedUser.name, phone: savedUser.phone, userType: savedUser.userType, role: savedUser.role, profileImage: savedUser.profileImage, workCity: savedUser.city, primarySkill: savedUser.primarySkill, additionalSkills: savedUser.skills, totalExperience: savedUser.experience, workState: savedUser.workState, willingtoRelocate: savedUser.willingtoRelocate, salaryType: savedUser.salaryType, salary: savedUser.salary, governmentID: savedUser.governmentID, workSamplesPhoto: savedUser.workSamplesPhoto, experienceCertificate: savedUser.experienceCertificate,language: user.language, isVerified: savedUser.isVerified, verificationStatus: savedUser.verificationStatus, isProfileCreated: savedUser.isProfileCreated, subscription: savedUser.subscription }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Create Profile - Vendor
exports.createVendorProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.userType && user.userType !== 'vendor') return res.status(403).json({ success: false, message: 'Access denied' });

    const { companyName, name, email, designation, workArea, gstNumber, whatsappNumber, website, workStateID, workCityID, panNumber } = req.body;

    if (!companyName) return res.status(400).json({ success: false, message: 'Company name is required' });
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    if (!designation) return res.status(400).json({ success: false, message: 'Designation is required' });
    if (!panNumber) return res.status(400).json({ success: false, message: 'PanNumber is required' });


    if ((workStateID && !workCityID) || (!workStateID && workCityID)) {
      return res.status(400).json({
        success: false,
        message: "Both state and city are required"
      });
    }

    if (workStateID && workCityID) {
      const { workState, workCity } = getLocationByIds(workStateID, workCityID);
      if (workState) user.workState = workState;
      if (workCity) user.city = workCity;
    }

    if (companyName) user.companyName = companyName.trim();
    if (name) user.name = name.trim();
    if (email) user.email = email;
    if (designation) user.role = designation.trim();
    if (workArea) user.workArea = workArea.trim();
    if (gstNumber) user.gstNumber = gstNumber;
    if (whatsappNumber) user.whatsappNumber = whatsappNumber;
    if (website) user.website = website.trim();
    if (panNumber) user.panNumber = panNumber;
    user.userType = 'vendor';
    user.isProfileCreated = true;

    if (req.files) {
      if (req.files.profileImage) user.profileImage = req.files.profileImage[0].path;
      if (req.files.companyLogo) user.companyLogo = req.files.companyLogo[0].path;
      if (req.files.panCardImage) user.panCardImage = req.files.panCardImage[0].path;
      if (req.files.gstCertificate) user.gstCertificate = req.files.gstCertificate[0].path;
    }

    if (!user.panCardImage) return res.status(400).json({ success: false, message: 'PanCard image is required' });
    if (!user.gstCertificate) return res.status(400).json({ success: false, message: 'GST Certificate image is required' });

    await user.save();
    const savedUser = await User.findById(user._id);

    res.json({
      success: true,
      message: 'Vendor profile created successfully',
      user: { id: savedUser._id, name: savedUser.name, phone: savedUser.phone, email: savedUser.email, userType: savedUser.userType, role: savedUser.role, profileImage: savedUser.profileImage, companyName: savedUser.companyName, companyLogo: savedUser.companyLogo, gstCertificate: savedUser.gstCertificate, panCardImage: savedUser.panCardImage, designation: savedUser.role, workCity: savedUser.city, workState: savedUser.workState, workArea: savedUser.workArea, gstNumber: savedUser.gstNumber, whatsappNumber: savedUser.whatsappNumber, website: savedUser.website, panNumber: savedUser.panNumber, language: savedUser.language, isVerified: savedUser.isVerified, verificationStatus: savedUser.verificationStatus, isProfileCreated: savedUser.isProfileCreated, subscription: savedUser.subscription }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Edit Profile - Vendor
exports.editVendorProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.userType !== 'vendor') return res.status(403).json({ success: false, message: 'Access denied' });

    const { companyName, name, email, designation, workArea, gstNumber, whatsappNumber, website, workStateID, workCityID, panNumber } = req.body;

    if ((workStateID && !workCityID) || (!workStateID && workCityID)) {
      return res.status(400).json({
        success: false,
        message: "Both state and city are required"
      });
    }

    if (workStateID && workCityID) {
      const { workState, workCity } = getLocationByIds(workStateID, workCityID);
      if (workState) user.workState = workState;
      if (workCity) user.city = workCity;
    }

    if (companyName) user.companyName = companyName.trim();
    if (name) user.name = name.trim();
    if (email) user.email = email;
    if (designation) { user.role = designation.trim(); }
    if (workArea) user.workArea = workArea.trim();
    if (gstNumber) user.gstNumber = gstNumber;
    if (whatsappNumber) user.whatsappNumber = whatsappNumber;
    if (website) user.website = website.trim();
    if (panNumber) user.panNumber = panNumber;

    if (req.files) {
      if (req.files.profileImage) user.profileImage = req.files.profileImage[0].path;
      if (req.files.companyLogo) user.companyLogo = req.files.companyLogo[0].path;
      if (req.files.panCardImage) user.panCardImage = req.files.panCardImage[0].path;
      if (req.files.gstCertificate) user.gstCertificate = req.files.gstCertificate[0].path;
    }

    // Note: PAN/GST images are required at profile CREATION (createVendorProfile),
    // not on every edit — a vendor editing e.g. just their name shouldn't be
    // blocked because those docs aren't being re-uploaded in this request.

    await user.save();
    const savedUser = await User.findById(req.user.id);

    res.json({
      success: true,
      message: 'Vendor profile updated successfully',
      user: { id: savedUser._id, name: savedUser.name, phone: savedUser.phone, email: savedUser.email, userType: savedUser.userType, role: savedUser.role, profileImage: savedUser.profileImage, companyName: savedUser.companyName, companyLogo: savedUser.companyLogo, gstCertificate: savedUser.gstCertificate, panCardImage: savedUser.panCardImage, designation: savedUser.role, workCity: savedUser.city, workState: savedUser.workState, workArea: savedUser.workArea, gstNumber: savedUser.gstNumber, whatsappNumber: savedUser.whatsappNumber, panNumber: savedUser.panNumber, website: savedUser.website, language: savedUser.language, isVerified: savedUser.isVerified, verificationStatus: savedUser.verificationStatus, isProfileCreated: savedUser.isProfileCreated, subscription: savedUser.subscription }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
//  CHANGE PHONE NUMBER — OTP-gated (any authenticated user/role)
// ═══════════════════════════════════════════════════════════════════
// `phone` is only overwritten once the OTP sent to the NEW number is
// verified — the new number is staged in `pendingPhone` until then.

// @desc    Send OTP to a new phone number to start a phone-change
// @route   POST /api/profile/phone/send-otp
// @access  Private
exports.sendPhoneChangeOtp = async (req, res) => {
  try {
    const { newPhone } = req.body;

    if (!newPhone || !/^[6-9]\d{9}$/.test(newPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.phone === newPhone) {
      return res.status(400).json({
        success: false,
        message: 'This is already your current phone number',
      });
    }

    const existing = await User.findOne({ phone: newPhone });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This phone number is already registered with another account',
      });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const otp = isProduction ? generateOTP() : '123456';

    user.pendingPhone = newPhone;
    user.otp = otp;
    user.otpExpire = getOTPExpiry();
    user.otpAttempts = 0;
    await user.save();

    if (!isProduction) console.log(`[DEV ONLY] Phone-change OTP for +91${newPhone}: ${otp}`);

    // TODO: send `otp` via a real SMS provider in production.
    res.status(200).json({
      success: true,
      message: 'OTP sent to +91' + newPhone,
      data: { newPhone, expiresIn: '10 minutes', ...(isProduction ? {} : { otp }) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP and apply the pending phone-number change
// @route   POST /api/profile/phone/verify-otp
// @access  Private
exports.verifyPhoneChangeOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'Please provide the OTP' });
    }

    const user = await User.findById(req.user.id)
      .select('+otp +otpExpire +otpAttempts +pendingPhone');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.pendingPhone) {
      return res.status(400).json({
        success: false,
        message: 'No phone number change in progress. Please request an OTP first.',
      });
    }

    if (user.otp !== otp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();

      if (user.otpAttempts >= 3) {
        user.otp = undefined;
        user.otpExpire = undefined;
        user.otpAttempts = 0;
        user.pendingPhone = undefined;
        await user.save();

        return res.status(400).json({
          success: false,
          message: 'Maximum OTP attempts reached. Please request a new OTP.',
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - user.otpAttempts} attempts remaining.`,
      });
    }

    if (!user.otpExpire || user.otpExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Re-check uniqueness right before committing — guards against a race
    // where someone else claimed the number during the OTP round-trip.
    const clash = await User.findOne({
      phone: user.pendingPhone,
      _id: { $ne: user._id },
    });
    if (clash) {
      user.pendingPhone = undefined;
      user.otp = undefined;
      user.otpExpire = undefined;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'This phone number is already registered with another account',
      });
    }

    user.phone = user.pendingPhone;
    user.isPhoneVerified = true;
    user.pendingPhone = undefined;
    user.otp = undefined;
    user.otpExpire = undefined;
    user.otpAttempts = 0;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Phone number updated successfully',
      data: { phone: user.phone },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
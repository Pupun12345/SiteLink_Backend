const User = require('../models/User');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const Skill = require('../models/Skill');

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
  const state = STATES.find(s => s.id === stateId);

  if (!state) {
    return res.status(404).json({ success: false, message: 'State not found' });
  }

  const cities = (CITIES[stateId] || []).map((name, index) => ({ id: index + 1, name }));
  res.status(200).json({ success: true, state: state.name, data: cities });
};

// @desc  Save workState and preferredCity to user by stateId and cityId
// @route POST `/api/profile/location/:stateId/:cityId`
exports.getLocationByIds = async (req, res) => {
  const stateId = parseInt(req.params.stateId);
  const cityId = parseInt(req.params.cityId);

  const state = STATES.find(s => s.id === stateId);
  if (!state) return res.status(404).json({ success: false, message: 'State not found' });

  const cityName = (CITIES[stateId] || [])[cityId - 1];
  if (!cityName) return res.status(404).json({ success: false, message: 'City not found' });

  await User.findByIdAndUpdate(req.user.id, { workState: state.name, city: cityName });

  res.status(200).json({ success: true, data: { workState: state.name, preferredCity: cityName } });
};

//get Skills with number
exports.getSkills = async (req, res) => {
  try {
    const skills = await Skill.find();
    res.status(200).json({ success: true, data: skills });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// @route POST /api/profile/skills
exports.updateWorkerSkills = async (req, res) => {
  try {
    const { primarySkillId, secondarySkillId, otherSkill } = req.query;
    const secondary = secondarySkillId && secondarySkillId !== '0' && secondarySkillId !== 'none' ? secondarySkillId : null;
    const other = otherSkill && otherSkill !== '0' && otherSkill !== 'none' ? otherSkill : null;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const primarySkillDoc = await Skill.findOne({ id: parseInt(primarySkillId) });
    if (!primarySkillDoc) return res.status(404).json({ success: false, message: 'Primary skill not found' });

    user.primarySkill = primarySkillDoc.name;
    user.role = primarySkillDoc.name;
    user.skills = [];

    if (secondary) {
      const secondarySkillDoc = await Skill.findOne({ id: parseInt(secondary) });
      if (!secondarySkillDoc) return res.status(404).json({ success: false, message: 'Secondary skill not found' });
      user.skills.push({ skillId: secondarySkillDoc.id, skillName: secondarySkillDoc.name });
    }

    if (other && other.trim()) {
      user.skills.push({ skillId: 0, skillName: other.trim() });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Skills updated successfully',
      data: { primarySkill: user.primarySkill, skills: user.skills },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const regularUser = await User.findById(req.user.id);

    if (!regularUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user: {
        id: regularUser._id,
        name: regularUser.name,
        email: regularUser.email,
        role: regularUser.role,
        profileImage: regularUser.profileImage,
        userType: regularUser.userType,
        createdAt: regularUser.createdAt
      }
    })

  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Create Profile - Worker
exports.createWorkerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Allow creation if userType is not set yet; block only if it's set to a different type
    if (user.userType && user.userType !== 'worker') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // const mandatoryDocuments = await PlatformSettings.getOrCreateSettings().then(settings => settings.verificationRules.worker);

    // const fieldMap = {
    //   idProof: () => req.files?.aadhaarFrontImage?.[0] && req.files?.aadhaarBackImage?.[0],
    //   age: () => req.body?.age && parseInt(req.body.age) > 0,
    //   medicalCertificate: () => req.files?.medicalCertificate?.[0]
    // };

    // const rule = Object.entries(mandatoryDocuments);

    // for (const [key, value] of rule) {
    //   if (value) {
    //     const validator = fieldMap[key];
    //     if (!validator) {
    //       console.warn(`No validator found for mandatory field: ${key}`);
    //       continue;
    //     }
    //     if (!validator()) {
    //       return res.status(400).json({
    //         success: false,
    //         message: `Missing or invalid mandatory document: ${key}`
    //       });
    //     }
    //   }
    // }

    const { name, dateOfBirth, gender, primarySkill, additionalSkills, totalExperience, experienceDescription, willingtoRelocate, salaryType, salary, workSamplesPhoto } = req.body;

    if (!primarySkill) {
      return res.status(400).json({ success: false, message: 'Primary skill is required' });
    }

    if (dateOfBirth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateOfBirth)) {
        return res.status(400).json({ success: false, message: "Date of birth should be in format YYYY-MM-DD (Example: 2002-09-23)" });
      }
      const parsedDate = new Date(dateOfBirth);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid date of birth" });
      }
    }

    if (name) user.name = name;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (gender) user.gender = gender;
    if (primarySkill) user.primarySkill = primarySkill;
    if (additionalSkills) user.skills = typeof additionalSkills === 'string' ? JSON.parse(additionalSkills) : additionalSkills;
    if (totalExperience) user.experience = totalExperience;
    if (experienceDescription) user.experienceDescription = experienceDescription;
    if (willingtoRelocate !== undefined) user.willingtoRelocate = willingtoRelocate;
    if (salaryType) user.salaryType = salaryType;
    if (salary) user.salary = salary;
    if (workSamplesPhoto) user.workSamplesPhoto = typeof workSamplesPhoto === 'string' ? JSON.parse(workSamplesPhoto) : workSamplesPhoto;
    user.role = primarySkill;
    user.userType = 'worker';

    if (req.files) {
      if (req.files.profileImage) user.profileImage = req.files.profileImage[0].path;
      if (req.files.workSamplesPhoto) user.workSamplesPhoto = req.files.workSamplesPhoto.map(f => f.path);
      if (req.files.experienceCertificate) user.experienceCertificate = req.files.experienceCertificate[0].path;
      if (req.files.governmentID) user.governmentID = req.files.governmentID[0].path;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Worker profile created successfully',
      user: { id: user._id, name: user.name, phone: user.phone, userType: user.userType, role: user.role, profileImage: user.profileImage, prefferedCity: user.city, primarySkill: user.primarySkill, additionalSkills: user.skills, totalExperience: user.experience, workState: user.workState, willingtoRelocate: user.willingtoRelocate, salaryType: user.salaryType, salary: user.salary }
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

    const { name, dateOfBirth, gender, primarySkill, additionalSkills, totalExperience, experienceDescription, willingtoRelocate, salaryType, salary, workSamplesPhoto } = req.body;

    if (!primarySkill) {
      return res.status(400).json({ success: false, message: 'Primary skill is required' });
    }

    if (dateOfBirth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateOfBirth)) {
        return res.status(400).json({ success: false, message: "Date of birth should be in format YYYY-MM-DD (Example: 2002-09-23)" });
      }
      const parsedDate = new Date(dateOfBirth);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid date of birth" });
      }
    }

    if (name) user.name = name;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (gender) user.gender = gender;
    if (primarySkill) { user.primarySkill = primarySkill; user.role = primarySkill; }
    if (additionalSkills) user.skills = typeof additionalSkills === 'string' ? JSON.parse(additionalSkills) : additionalSkills;
    if (totalExperience) user.experience = totalExperience;
    if (experienceDescription) user.experienceDescription = experienceDescription;
    if (willingtoRelocate !== undefined) user.willingtoRelocate = willingtoRelocate;
    if (salaryType) user.salaryType = salaryType;
    if (salary) user.salary = salary;
    if (workSamplesPhoto) user.workSamplesPhoto = typeof workSamplesPhoto === 'string' ? JSON.parse(workSamplesPhoto) : workSamplesPhoto;

    if (req.files) {
      if (req.files.profileImage) {
        if (user.profileImage) fs.unlink(user.profileImage, () => { });
        user.profileImage = req.files.profileImage[0].path;
      }
      if (req.files.workSamplesPhoto) {
        user.workSamplesPhoto = req.files.workSamplesPhoto.map(f => f.path);
      }
    }
    await user.save();

    res.json({
      success: true,
      message: 'Worker profile updated successfully',
      user: { id: user._id, name: user.name, phone: user.phone, userType: user.userType, role: user.role, profileImage: user.profileImage, prefferedCity: user.city, primarySkill: user.primarySkill, additionalSkills: user.skills, totalExperience: user.experience, workState: user.workState, willingtoRelocate: user.willingtoRelocate, salaryType: user.salaryType, salary: user.salary }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Create Profile - Vendor
exports.createVendorProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    // Allow creation if userType is not set yet; block only if it's set to a different type
    if (user.userType && user.userType !== 'vendor') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { companyName, name, email, designation, workArea, gstNumber, whatsappNumber, website } = req.body;

    if (!companyName) return res.status(400).json({ success: false, message: 'Company name is required' });
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    if (!designation) return res.status(400).json({ success: false, message: 'Designation is required' });

    if (companyName) user.companyName = companyName;
    if (name) user.name = name;
    if (email) user.email = email;
    if (designation) user.designation = designation;
    if (workArea) user.workArea = workArea;
    if (gstNumber) user.gstNumber = gstNumber;
    if (whatsappNumber) user.whatsappNumber = whatsappNumber;
    if (website) user.website = website;
    user.role = designation;
    user.userType = 'vendor';

    if (req.files) {
      if (req.files.profileImage) user.profileImage = req.files.profileImage[0].path;
      if (req.files.companyLogo) user.companyLogo = req.files.companyLogo[0].path;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Vendor profile created successfully',
      user: { id: user._id, name: user.name, phone: user.phone, email: user.email, userType: user.userType, role: user.role, profileImage: user.profileImage, companyName: user.companyName, companyLogo: user.companyLogo, designation: user.designation, city: user.city, workArea: user.workArea, gstNumber: user.gstNumber, whatsappNumber: user.whatsappNumber, website: user.website }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Edit Profile - Vendor
exports.editVendorProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.userType !== 'vendor') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { companyName, name, email, designation, workArea, gstNumber, whatsappNumber, website } = req.body;

    if (companyName) user.companyName = companyName;
    if (name) user.name = name;
    if (email) user.email = email;
    if (designation) { user.designation = designation; user.role = designation; }
    if (workArea) user.workArea = workArea;
    if (gstNumber) user.gstNumber = gstNumber;
    if (whatsappNumber) user.whatsappNumber = whatsappNumber;
    if (website) user.website = website;

    if (req.files) {
      if (req.files.profileImage) {
        if (user.profileImage) fs.unlink(user.profileImage, () => { });
        user.profileImage = req.files.profileImage[0].path;
      }
      if (req.files.companyLogo) {
        if (user.companyLogo) fs.unlink(user.companyLogo, () => { });
        user.companyLogo = req.files.companyLogo[0].path;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'Vendor profile updated successfully',
      user: { id: user._id, name: user.name, phone: user.phone, email: user.email, userType: user.userType, role: user.role, profileImage: user.profileImage, companyName: user.companyName, companyLogo: user.companyLogo, designation: user.designation, city: user.city, workArea: user.workArea, gstNumber: user.gstNumber, whatsappNumber: user.whatsappNumber, website: user.website }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
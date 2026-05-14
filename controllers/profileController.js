const User = require('../models/User');
const bcrypt = require('bcryptjs');
const fs = require('fs');

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

    const { name, dateOfBirth, gender, city, primarySkill, additionalSkills, totalExperience, experienceDescription, workState, preferredCity, willingtoRelocate, salaryType, salary, workSamplesPhoto } = req.body;

    if (!primarySkill) {
      return res.status(400).json({ success: false, message: 'Primary skill is required' });
    }

    if (dateOfBirth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      if (!dateRegex.test(dateOfBirth)) {
        return res.status(400).json({
          success: false,
          message: "Date of birth should be in format YYYY-MM-DD (Example: 2002-09-23)"
        });
      }

      //if it's a real valid date
      const parsedDate = new Date(dateOfBirth);

      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date of birth"
        });
      }
    }

    if (name) user.name = name;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (gender) user.gender = gender;
    if (city) user.city = city;
    if (primarySkill) user.primarySkill = primarySkill;
    if (additionalSkills) user.skills = typeof additionalSkills === 'string' ? JSON.parse(additionalSkills) : additionalSkills;
    if (totalExperience) user.experience = totalExperience;
    if (experienceDescription) user.experienceDescription = experienceDescription;
    if (workState) user.workState = workState;
    if (preferredCity) user.city = preferredCity;
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

    const { name, dateOfBirth, gender, city, primarySkill, additionalSkills, totalExperience, experienceDescription, workState, preferredCity, willingtoRelocate, salaryType, salary, workSamplesPhoto } = req.body;
    let documentsUpdated = false;


    if (!primarySkill) {
      return res.status(400).json({ success: false, message: 'Primary skill is required' });
    }

    if (dateOfBirth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      if (!dateRegex.test(dateOfBirth)) {
        return res.status(400).json({
          success: false,
          message: "Date of birth should be in format YYYY-MM-DD (Example: 2002-09-23)"
        });
      }

      //if it's a real valid date
      const parsedDate = new Date(dateOfBirth);

      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date of birth"
        });
      }
    }

    if (name) user.name = name;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (gender) user.gender = gender;
    if (city) user.city = city;
    if (primarySkill) { user.primarySkill = primarySkill; user.role = primarySkill; }
    if (additionalSkills) user.skills = typeof additionalSkills === 'string' ? JSON.parse(additionalSkills) : additionalSkills;
    if (totalExperience) user.experience = totalExperience;
    if (experienceDescription) user.experienceDescription = experienceDescription;
    if (workState) user.workState = workState;
    if (preferredCity) user.city = preferredCity;
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

    const { companyName, name, email, designation, city, workArea, gstNumber, whatsappNumber, website } = req.body;

    if (!companyName) return res.status(400).json({ success: false, message: 'Company name is required' });
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    if (!designation) return res.status(400).json({ success: false, message: 'Designation is required' });

    if (companyName) user.companyName = companyName;
    if (name) user.name = name;
    if (email) user.email = email;
    if (designation) user.designation = designation;
    if (city) user.city = city;
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

    const { companyName, name, email, designation, city, workArea, gstNumber, whatsappNumber, website } = req.body;

    if (companyName) user.companyName = companyName;
    if (name) user.name = name;
    if (email) user.email = email;
    if (designation) { user.designation = designation; user.role = designation; }
    if (city) user.city = city;
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
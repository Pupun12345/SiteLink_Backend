const Legal = require('../models/Legal');

// Get Privacy Policy
exports.getPrivacyPolicy = async (req, res) => {
  try {
    const privacyPolicy = await Legal.findOne({ 
      type: 'privacy-policy', 
      isActive: true 
    }).select('-__v');

    if (!privacyPolicy) {
      return res.status(404).json({
        success: false,
        message: 'Privacy Policy not found',
      });
    }

    res.status(200).json({
      success: true,
      data: privacyPolicy,
    });
  } catch (error) {
    console.error('Get Privacy Policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching Privacy Policy',
      error: error.message,
    });
  }
};

// Get Terms and Conditions
exports.getTermsConditions = async (req, res) => {
  try {
    const termsConditions = await Legal.findOne({ 
      type: 'terms-conditions', 
      isActive: true 
    }).select('-__v');

    if (!termsConditions) {
      return res.status(404).json({
        success: false,
        message: 'Terms and Conditions not found',
      });
    }

    res.status(200).json({
      success: true,
      data: termsConditions,
    });
  } catch (error) {
    console.error('Get Terms and Conditions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching Terms and Conditions',
      error: error.message,
    });
  }
};

// Get all legal documents (Admin only)
exports.getAllLegalDocuments = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }

    const documents = await Legal.find()
      .populate('lastUpdatedBy', 'name email')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    console.error('Get all legal documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching legal documents',
      error: error.message,
    });
  }
};

// Create or Update Legal Document (Admin only)
exports.createOrUpdateLegalDocument = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }

    const { type, title, content, version, effectiveDate } = req.body;

    if (!type || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Type, title, and content are required',
      });
    }

    if (!['privacy-policy', 'terms-conditions'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be privacy-policy or terms-conditions',
      });
    }

    const documentData = {
      type,
      title,
      content,
      version: version || '1.0',
      lastUpdatedBy: req.user._id,
      isActive: true,
    };

    if (effectiveDate) {
      documentData.effectiveDate = effectiveDate;
    }

    // Find and update or create new
    const document = await Legal.findOneAndUpdate(
      { type },
      documentData,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `${type === 'privacy-policy' ? 'Privacy Policy' : 'Terms and Conditions'} ${document.isNew ? 'created' : 'updated'} successfully`,
      data: document,
    });
  } catch (error) {
    console.error('Create/Update legal document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating/updating legal document',
      error: error.message,
    });
  }
};

// Delete Legal Document (Admin only)
exports.deleteLegalDocument = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }

    const { type } = req.params;

    if (!['privacy-policy', 'terms-conditions'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be privacy-policy or terms-conditions',
      });
    }

    const document = await Legal.findOneAndDelete({ type });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Legal document not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Legal document deleted successfully',
    });
  } catch (error) {
    console.error('Delete legal document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting legal document',
      error: error.message,
    });
  }
};

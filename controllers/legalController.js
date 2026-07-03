const LegalPolicy = require('../models/LegalPolicy');

// Get current version of a policy (Privacy Policy or Terms & Conditions)
exports.getPolicyByType = async (req, res) => {
  try {
    const { policyType } = req.params;

    // Validate policy type
    const validTypes = ['PRIVACY_POLICY', 'TERMS_AND_CONDITIONS'];
    if (!validTypes.includes(policyType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid policy type. Must be PRIVACY_POLICY or TERMS_AND_CONDITIONS',
      });
    }

    const policy = await LegalPolicy.findOne({
      policyType: policyType.toUpperCase(),
      isActive: true,
    }).populate('createdBy', 'name email');

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: `${policyType} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching policy',
      error: error.message,
    });
  }
};

// Get all versions of a specific policy
exports.getPolicyVersions = async (req, res) => {
  try {
    const { policyType } = req.params;

    const validTypes = ['PRIVACY_POLICY', 'TERMS_AND_CONDITIONS'];
    if (!validTypes.includes(policyType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid policy type. Must be PRIVACY_POLICY or TERMS_AND_CONDITIONS',
      });
    }

    const versions = await LegalPolicy.find({
      policyType: policyType.toUpperCase(),
    })
      .select('version effectiveDate isActive changelog summary -content')
      .populate('createdBy', 'name email')
      .sort({ version: -1 });

    res.status(200).json({
      success: true,
      data: versions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching policy versions',
      error: error.message,
    });
  }
};

// Get specific version of a policy
exports.getPolicyVersion = async (req, res) => {
  try {
    const { policyType, version } = req.params;

    const validTypes = ['PRIVACY_POLICY', 'TERMS_AND_CONDITIONS'];
    if (!validTypes.includes(policyType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid policy type. Must be PRIVACY_POLICY or TERMS_AND_CONDITIONS',
      });
    }

    const policy = await LegalPolicy.findOne({
      policyType: policyType.toUpperCase(),
      version: parseInt(version),
    }).populate('createdBy', 'name email');

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: `${policyType} version ${version} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching policy version',
      error: error.message,
    });
  }
};

// Create or update a policy (Admin only)
exports.createOrUpdatePolicy = async (req, res) => {
  try {
    const { policyType, title, content, changelog, summary, effectiveDate } =
      req.body;
    const userId = req.user?.id;

    // Validate input
    if (!policyType || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'policyType, title, and content are required',
      });
    }

    const validTypes = ['PRIVACY_POLICY', 'TERMS_AND_CONDITIONS'];
    if (!validTypes.includes(policyType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid policy type. Must be PRIVACY_POLICY or TERMS_AND_CONDITIONS',
      });
    }

    // Find existing policy to determine next version
    const existingPolicy = await LegalPolicy.findOne({
      policyType: policyType.toUpperCase(),
    }).sort({ version: -1 });

    const nextVersion = existingPolicy ? existingPolicy.version + 1 : 1;

    // Deactivate previous version if it exists
    if (existingPolicy && existingPolicy.isActive) {
      existingPolicy.isActive = false;
      await existingPolicy.save();
    }

    // Create new policy version
    const newPolicy = new LegalPolicy({
      policyType: policyType.toUpperCase(),
      title,
      content,
      version: nextVersion,
      isActive: true,
      effectiveDate: effectiveDate || new Date(),
      createdBy: userId,
      lastUpdatedBy: userId,
      changelog,
      summary,
    });

    await newPolicy.save();

    const populatedPolicy = await LegalPolicy.findById(newPolicy._id).populate(
      'createdBy',
      'name email'
    );

    res.status(201).json({
      success: true,
      message: `${policyType} created successfully`,
      data: populatedPolicy,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating/updating policy',
      error: error.message,
    });
  }
};

// Get all policies (current versions only)
exports.getAllPolicies = async (req, res) => {
  try {
    const policies = await LegalPolicy.find({ isActive: true })
      .select('-content')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: policies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching policies',
      error: error.message,
    });
  }
};

// Delete a specific policy version (Admin only)
exports.deletePolicyVersion = async (req, res) => {
  try {
    const { id } = req.params;

    const policy = await LegalPolicy.findById(id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found',
      });
    }

    // Prevent deletion if it's the only active version
    if (policy.isActive) {
      const otherActiveVersions = await LegalPolicy.countDocuments({
        policyType: policy.policyType,
        isActive: true,
        _id: { $ne: id },
      });

      if (otherActiveVersions === 0) {
        return res.status(400).json({
          success: false,
          message:
            'Cannot delete the only active version of a policy. Create a new version first.',
        });
      }
    }

    await LegalPolicy.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Policy version deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting policy',
      error: error.message,
    });
  }
};

// Activate a specific policy version (Admin only)
exports.activatePolicyVersion = async (req, res) => {
  try {
    const { id } = req.params;

    const policy = await LegalPolicy.findById(id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found',
      });
    }

    if (policy.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This policy version is already active',
      });
    }

    // Deactivate other active versions of the same policy type
    await LegalPolicy.updateMany(
      {
        policyType: policy.policyType,
        isActive: true,
        _id: { $ne: id },
      },
      { isActive: false }
    );

    // Activate the selected version
    policy.isActive = true;
    policy.lastUpdatedBy = req.user?.id;
    await policy.save();

    const updatedPolicy = await LegalPolicy.findById(id).populate(
      'createdBy lastUpdatedBy',
      'name email'
    );

    res.status(200).json({
      success: true,
      message: 'Policy version activated successfully',
      data: updatedPolicy,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error activating policy',
      error: error.message,
    });
  }
};

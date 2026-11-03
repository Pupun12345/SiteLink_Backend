const { v2: cloudinary } = require('cloudinary');

// Allowed upload contexts and their locked-down parameters.
// Nothing outside this map can be signed.
const UPLOAD_CONTEXTS = {
  profileImage:           { folder: 'profiles',  resource_type: 'image', maxBytes: 5  * 1024 * 1024 },
  companyLogo:            { folder: 'profiles',  resource_type: 'image', maxBytes: 5  * 1024 * 1024 },
  governmentID:           { folder: 'documents', resource_type: 'image', maxBytes: 10 * 1024 * 1024 },
  gstCertificate:         { folder: 'documents', resource_type: 'image', maxBytes: 10 * 1024 * 1024 },
  panCardImage:           { folder: 'documents', resource_type: 'image', maxBytes: 10 * 1024 * 1024 },
  experienceCertificate:  { folder: 'documents', resource_type: 'image', maxBytes: 10 * 1024 * 1024 },
  workSamplesPhoto:       { folder: 'posts',     resource_type: 'image', maxBytes: 10 * 1024 * 1024 },
  postImage:              { folder: 'posts',     resource_type: 'image', maxBytes: 10 * 1024 * 1024 },
  postVideo:              { folder: 'posts',     resource_type: 'video', maxBytes: 100 * 1024 * 1024 },
};

// Validate that required Cloudinary env vars are present at startup.
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('[uploadController] Missing Cloudinary environment variables. Signature endpoint will fail.');
}

// @desc    Generate a signed upload signature for direct browser → Cloudinary upload
// @route   POST /api/uploads/signature
// @access  Private
exports.getUploadSignature = (req, res) => {
  const { context } = req.body;

  if (!context || !UPLOAD_CONTEXTS[context]) {
    return res.status(400).json({
      success: false,
      message: `Invalid upload context. Allowed: ${Object.keys(UPLOAD_CONTEXTS).join(', ')}`,
    });
  }

  const { folder, resource_type, maxBytes } = UPLOAD_CONTEXTS[context];

  const timestamp = Math.round(Date.now() / 1000);
  const public_id = `${context}-${req.user._id}-${timestamp}-${Math.round(Math.random() * 1e6)}`;

  // Only sign the params that will be sent to Cloudinary.
  // Any unsigned param Cloudinary receives will cause signature mismatch.
  const paramsToSign = {
    folder,
    public_id,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );

  return res.status(200).json({
    success: true,
    data: {
      signature,
      timestamp,
      public_id,
      folder,
      resource_type,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      maxBytes,
    },
  });
};

// @desc    Verify a Cloudinary asset after direct upload (ownership + folder check)
// @route   POST /api/uploads/confirm
// @access  Private
//
// No Admin API call — the public_id was generated and signed by this server,
// so we verify purely by inspecting the values we originally issued.
// The secure_url is reconstructed from known parts and compared against what
// Cloudinary returned to Flutter, making a round-trip to the Admin API unnecessary.
exports.confirmUpload = (req, res) => {
  const { public_id, secure_url } = req.body;

  if (!public_id || typeof public_id !== 'string') {
    return res.status(400).json({ success: false, message: 'public_id is required' });
  }

  if (!secure_url || typeof secure_url !== 'string' || !secure_url.startsWith('https://res.cloudinary.com/')) {
    return res.status(400).json({ success: false, message: 'secure_url is required' });
  }

  // 1. Derive context from the public_id prefix we generated
  const contextKey = Object.keys(UPLOAD_CONTEXTS).find((k) => public_id.startsWith(k + '-'));
  if (!contextKey) {
    return res.status(400).json({ success: false, message: 'Unrecognised asset public_id' });
  }

  // 2. Ownership check — public_id was generated as `${context}-${userId}-${ts}-${rand}`
  if (!public_id.includes(`-${req.user._id}-`)) {
    return res.status(403).json({ success: false, message: 'Asset does not belong to this user' });
  }

  // 3. Confirm the secure_url actually contains the public_id we issued
  //    Cloudinary secure_url format: https://res.cloudinary.com/<cloud>/image/upload/v<ver>/<folder>/<public_id>.<ext>
  //    The public_id (without folder prefix) must appear in the URL.
  const { folder, resource_type } = UPLOAD_CONTEXTS[contextKey];
  const expectedFragment = `${folder}/${public_id}`;
  if (!secure_url.includes(expectedFragment)) {
    return res.status(400).json({ success: false, message: 'secure_url does not match the issued public_id' });
  }

  return res.status(200).json({
    success: true,
    data: { public_id: `${folder}/${public_id}`, secure_url, resource_type },
  });
};

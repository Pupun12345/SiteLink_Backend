const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const folderMap = {
      profileImage: 'profiles',
      companyLogo: 'profiles',
      governmentID: 'documents',
      gstCertificate: 'documents',
      panCardImage: 'documents',
      images: 'posts',
      video: 'posts',
    };

    const prefixMap = {
      profileImage: 'profile',
      companyLogo: 'company-logo',
      gstCertificate: 'gst-certificate',
      panCardImage: 'pan-card',
      images: 'post',
      video: 'post',
    };

    const folder = folderMap[file.fieldname] || 'misc';
    const prefix = prefixMap[file.fieldname] || 'file';
    const isVideo = file.mimetype && file.mimetype.startsWith('video/');

    return {
      folder: folder,
      public_id: `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      resource_type: isVideo ? 'video' : 'auto',
    };
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

const handleUpload = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ success: false, message: err.message || 'File upload failed' });
    }
    next();
  });
};

module.exports = upload;
module.exports.handleUpload = handleUpload;

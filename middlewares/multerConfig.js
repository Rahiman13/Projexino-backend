const multer = require('multer');

// Configure storage
const storage = multer.memoryStorage();

// Configure file filter
const fileFilter = (req, file, cb) => {
  if (!file) {
    cb(new Error('No file uploaded'));
    return;
  }

  // Check the route/endpoint being accessed
  if (req.originalUrl.includes('/blogs') || req.originalUrl.includes('/newsletter')) {
    // For blogs and newsletters - allow only images
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WEBP) are allowed for blogs and newsletters'));
    }
  } else if (req.originalUrl.includes('/careers')) {
    // For careers - allow only PDFs
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for careers'));
    }
  } else {
    cb(new Error('Invalid route'));
  }
};

// Configure multer with file size limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  }
});

module.exports = upload;

const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    patterns: /pdf|doc|docx/,
    photos: /jpeg|jpg|png|gif/,
    all: /pdf|doc|docx|jpeg|jpg|png|gif/
  };
  
  const fileType = req.route.path.includes('pattern') ? 'patterns' : 'photos';
  const regex = allowedTypes[fileType] || allowedTypes.all;
  
  const extname = regex.test(path.extname(file.originalname).toLowerCase());
  const mimetype = regex.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${fileType}`));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 // 50MB
  },
  fileFilter
});

module.exports = { upload };
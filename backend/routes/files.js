const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');
const File = require('../models/File');

const router = express.Router();

// Configure secure file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // make sure backend/uploads folder exists
  },
  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname)
    );
  },
});

// Secure file filter (MIME type + extension)
// Secure file filter (MIME type + extension)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpeg|jpg|png|pdf|txt|docx)$/i;

  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword' // .doc
  ];

  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );

  // Check if MIME type is in strict whitelist
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }

  console.log('Blocked file:', file.mimetype, file.originalname); // Debug log
  cb(new Error('Invalid file type. Only JPEG, PNG, PDF, TXT, and DOCX are allowed.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// @route   POST api/files/upload
// @desc    Upload secure file (protected)
router.post(
  '/upload',
  authMiddleware,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileDoc = await File.create({
        owner: req.user.userId,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        path: req.file.path,
        size: req.file.size,
      });

      return res.status(201).json({
        message: 'File uploaded successfully',
        file: {
          id: fileDoc._id,
          originalName: fileDoc.originalName,
          mimeType: fileDoc.mimeType,
          size: fileDoc.size,
          createdAt: fileDoc.createdAt,
        },
      });
    } catch (error) {
      console.error('UPLOAD ERROR:', error);
      return res
        .status(500)
        .json({ error: error.message || 'Upload failed' });
    }
  }
);

// @route   GET api/files
// @desc    List current user's files (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const files = await File.find({ owner: req.user.userId })
      .sort({ createdAt: -1 })
      .select('originalName mimeType size createdAt');

    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch files' });
  }
});

// @route   GET api/files/:id
// @desc    Download file by id (protected)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const fileDoc = await File.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!fileDoc) {
      return res.status(404).json({ error: 'File not found' });
    }

    const absolutePath = path.resolve(fileDoc.path);
    if (!fs.existsSync(absolutePath)) {
      return res.status(410).json({ error: 'File missing on server' });
    }

    res.setHeader('Content-Type', fileDoc.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileDoc.originalName}"`
    );

    const stream = fs.createReadStream(absolutePath);
    stream.pipe(res);
  } catch (error) {
    console.error('DOWNLOAD ERROR:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});
// @route   DELETE api/files/:id
// @desc    Delete file by id (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const fileDoc = await File.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!fileDoc) {
      return res.status(404).json({ error: 'File not found' });
    }

    const absolutePath = path.resolve(fileDoc.path);

    // Delete from filesystem
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    // Delete from DB
    await File.deleteOne({ _id: req.params.id });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('DELETE ERROR:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;

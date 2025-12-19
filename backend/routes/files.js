/*const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');
const File = require('../models/File');

const router = express.Router();

// Configure secure file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // ensure this folder exists
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
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|txt|docx/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only images, PDF, TXT, DOCX allowed'));
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

      res.status(201).json({
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
      res
        .status(400)
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
    res.status(500).json({ error: 'Download failed' });
  }
});

module.exports = router;
*/
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
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|txt|docx/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only images, PDF, TXT, DOCX allowed'));
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
  // remove upload.single('file'),
  async (req, res) => {
    // console.log('req.file =', req.file);
    console.log('req.body =', req.body);
    res.json({ ok: true, message: 'Reached upload route without Multer'});

    /*try {
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
        */
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

module.exports = router;

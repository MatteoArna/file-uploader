require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();

// Configuration from .env
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || 10485760000;

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// Multer setup for file uploads (only .mp4)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Use original filename directly
    cb(null, file.originalname);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'video/mp4') cb(null, true);
    else cb(new Error('Only .mp4 files are allowed'), false);
  },
});

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static(UPLOAD_DIR));

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ filename: req.file.filename, originalname: req.file.originalname });
});

// List files endpoint
app.get('/files', (req, res) => {
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to list files' });
    const fileList = files.map((file) => ({
      name: file,
      originalName: file, // No prefix, so same as name
      url: `/uploads/${file}`,
    }));
    res.json(fileList);
  });
});

// Rename file endpoint
app.post('/rename', express.json(), (req, res) => {
  const { oldName, newName } = req.body;
  const oldPath = path.join(UPLOAD_DIR, oldName);
  // Ensure .mp4 extension is preserved
  const newNameWithExt = newName.endsWith('.mp4') ? newName : `${newName}.mp4`;
  const newPath = path.join(UPLOAD_DIR, newNameWithExt);

  fs.rename(oldPath, newPath, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to rename file' });
    res.json({ success: true, newName: newNameWithExt });
  });
});

// Delete file endpoint
app.post('/delete', express.json(), (req, res) => {
  const { filename } = req.body;
  const filePath = path.join(UPLOAD_DIR, filename);

  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete file' });
    res.json({ success: true });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
const express = require('express');
const fetch = require('node-fetch');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const PYTHON_URL = process.env.PYTHON_SERVER_URL || 'http://localhost:5000';

// Configure multer for file uploads
const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

router.use(authMiddleware);

// Get all documents
router.get('/', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_URL}/get_documents`);
    const files = await response.json();
    res.json(files);
  } catch (err) {
    console.error('Get documents error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download a document
router.get('/download/:file(*)', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_URL}/get_document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: req.params.file }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'File not found' });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const disposition = response.headers.get('content-disposition') || '';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', disposition || `attachment; filename="${req.params.file}"`);

    response.body.pipe(res);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload documents (supports bulk upload)
router.post('/upload', upload.array('files', 50), async (req, res) => {
  const { dataset } = req.body;
  if (!dataset) {
    return res.status(400).json({ error: 'Dataset name is required' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files provided' });
  }

  const results = [];
  for (const file of req.files) {
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(file.path), file.originalname);
      form.append('dataset', dataset);

      const response = await fetch(`${PYTHON_URL}/add_document`, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
        timeout: 300000,
      });

      // Clean up temp file
      fs.unlinkSync(file.path);

      if (response.ok) {
        results.push({ filename: file.originalname, success: true });
      } else {
        const errText = await response.text();
        results.push({ filename: file.originalname, success: false, error: errText });
      }
    } catch (err) {
      // Clean up temp file on error
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      results.push({ filename: file.originalname, success: false, error: err.message });
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  res.json({
    message: failed === 0
      ? `All ${succeeded} files were successfully added.`
      : `${succeeded} succeeded, ${failed} failed.`,
    results,
    succeeded,
    failed,
  });
});

// Delete a document
router.post('/delete', async (req, res) => {
  const { filename } = req.body;
  try {
    const response = await fetch(`${PYTHON_URL}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Delete document error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

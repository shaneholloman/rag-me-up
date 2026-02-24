const express = require('express');
const fetch = require('node-fetch');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const PYTHON_URL = process.env.PYTHON_SERVER_URL || 'http://localhost:5000';

router.use(authMiddleware);

// GET /api/config – retrieve current .env configuration
router.get('/', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_URL}/config`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Get config error:', err);
    res.status(500).json({ error: 'Failed to fetch config from Python server' });
  }
});

// PUT /api/config – update .env configuration
router.put('/', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_URL}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    res.json(data);
  } catch (err) {
    console.error('Update config error:', err);
    res.status(500).json({ error: 'Failed to update config on Python server' });
  }
});

module.exports = router;

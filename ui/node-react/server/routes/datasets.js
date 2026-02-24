const express = require('express');
const fetch = require('node-fetch');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const PYTHON_URL = process.env.PYTHON_SERVER_URL || 'http://localhost:5000';

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_URL}/get_datasets`);
    const datasets = await response.json();
    res.json(datasets);
  } catch (err) {
    console.error('Get datasets error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

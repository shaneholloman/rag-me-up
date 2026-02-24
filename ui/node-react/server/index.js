require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const documentRoutes = require('./routes/documents');
const datasetRoutes = require('./routes/datasets');
const feedbackRoutes = require('./routes/feedback');
const configRoutes = require('./routes/config');
const { runMigrations } = require('./db/migrate');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Make pool available to routes
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/config', configRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server after running migrations
(async () => {
  try {
    await runMigrations(pool);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();

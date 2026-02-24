const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/', async (req, res) => {
  const { chat_id, message_offset, feedback, feedback_text } = req.body;

  if (!chat_id || message_offset === undefined || feedback === undefined || !feedback_text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify the chat belongs to the user
    const chatResult = await req.db.query(
      'SELECT id FROM chats WHERE id = $1 AND user_id = $2',
      [chat_id, req.user.id]
    );
    if (chatResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await req.db.query(
      'INSERT INTO feedback (chat_id, message_offset, feedback, feedback_text) VALUES ($1, $2, $3, $4)',
      [chat_id, message_offset, feedback, feedback_text]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

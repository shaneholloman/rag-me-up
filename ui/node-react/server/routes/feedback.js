const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Get all feedback for the current user's chats, joined with Q&A messages
router.get('/', async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT
         f.chat_id,
         f.message_offset,
         f.feedback,
         f.feedback_text,
         c.title AS chat_title,
         -- The assistant message that was rated (feedback.message_offset points to the assistant msg)
         am.text AS answer,
         am.documents,
         -- The preceding user message (offset - 1, or - 2 if system msg exists)
         (
           SELECT qm.text FROM chat_messages qm
           WHERE qm.chat_id = f.chat_id
             AND qm.role = 'user'
             AND qm.message_offset < f.message_offset
           ORDER BY qm.message_offset DESC
           LIMIT 1
         ) AS question
       FROM feedback f
       JOIN chats c ON c.id = f.chat_id AND c.user_id = $1
       LEFT JOIN chat_messages am ON am.chat_id = f.chat_id AND am.message_offset = f.message_offset
       ORDER BY c.created_at DESC, f.message_offset DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get feedback error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

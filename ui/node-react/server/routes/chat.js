const express = require('express');
const fetch = require('node-fetch');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const PYTHON_URL = process.env.PYTHON_SERVER_URL || 'http://localhost:5000';

// All chat routes require auth
router.use(authMiddleware);

// Get user's chats (last 20)
router.get('/', async (req, res) => {
  try {
    const result = await req.db.query(
      'SELECT id, title, created_at FROM chats WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get chats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single chat with messages
router.get('/:id', async (req, res) => {
  try {
    const chatResult = await req.db.query(
      'SELECT id, title, created_at FROM chats WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const messagesResult = await req.db.query(
      'SELECT chat_id, message_offset, created_at, text, role, documents, rewritten, fetched_new_documents FROM chat_messages WHERE chat_id = $1 ORDER BY message_offset ASC',
      [req.params.id]
    );

    res.json({
      chat: chatResult.rows[0],
      messages: messagesResult.rows,
    });
  } catch (err) {
    console.error('Get chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a message (proxy to Python + store)
router.post('/:id/message', async (req, res) => {
  const chatId = req.params.id;
  const { query, history, docs, datasets, messageOffset } = req.body;

  try {
    // Call Python RAG server
    const ragResponse = await fetch(`${PYTHON_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: query,
        history: history || [],
        docs: docs || [],
        datasets: datasets || [],
      }),
      timeout: 300000,
    });

    if (!ragResponse.ok) {
      const errText = await ragResponse.text();
      return res.status(ragResponse.status).json({ error: errText });
    }

    const data = await ragResponse.json();

    // Ensure chat exists
    const chatExists = await req.db.query('SELECT id FROM chats WHERE id = $1', [chatId]);
    if (chatExists.rows.length === 0) {
      // Create title via Python
      const titleResponse = await fetch(`${PYTHON_URL}/create_title`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });
      const titleData = await titleResponse.json();

      await req.db.query(
        'INSERT INTO chats (id, title, created_at, user_id) VALUES ($1, $2, $3, $4)',
        [chatId, titleData.title, Date.now(), req.user.id]
      );
    }

    // Determine what messages to insert
    const askTime = Date.now();
    const newHistory = data.history || [];
    const existingOffset = messageOffset || 0;

    // Check if history was compressed (shrunk)
    if (history && history.length > 0 && newHistory.length - 2 !== history.length) {
      // History shrunk, delete and re-insert
      await req.db.query('DELETE FROM chat_messages WHERE chat_id = $1', [chatId]);

      // Insert all messages from new history
      const systemMessages = newHistory.filter((m) => m.role === 'system');
      const nonSystemMessages = newHistory.filter((m) => m.role !== 'system');

      let offset = 0;
      if (systemMessages.length > 0) {
        await req.db.query(
          'INSERT INTO chat_messages (chat_id, message_offset, created_at, text, role, documents, rewritten, fetched_new_documents) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [chatId, offset, askTime - 1, systemMessages[0].content, 'system', '[]', null, false]
        );
        offset++;
      }

      for (const msg of nonSystemMessages) {
        const isUser = msg.role === 'user';
        await req.db.query(
          'INSERT INTO chat_messages (chat_id, message_offset, created_at, text, role, documents, rewritten, fetched_new_documents) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [chatId, offset, askTime, msg.content, msg.role,
            isUser ? '[]' : JSON.stringify(data.documents || []),
            isUser ? null : (data.rewritten || null),
            isUser ? false : (data.fetched_new_documents || false)]
        );
        offset++;
      }
    } else {
      // Normal append: just add the new user + assistant messages
      const newMessages = newHistory.slice(Math.max(0, existingOffset - 1));
      const systemMessages = newMessages.filter((m) => m.role === 'system');
      const historyMessages = newMessages.filter((m) => m.role !== 'system');

      let offset = existingOffset;

      if (systemMessages.length > 0) {
        await req.db.query(
          'INSERT INTO chat_messages (chat_id, message_offset, created_at, text, role, documents, rewritten, fetched_new_documents) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (chat_id, message_offset) DO NOTHING',
          [chatId, offset, askTime - 1, systemMessages[0].content, 'system', '[]', null, false]
        );
        offset++;
      }

      for (const msg of historyMessages) {
        const isUser = msg.role === 'user';
        await req.db.query(
          'INSERT INTO chat_messages (chat_id, message_offset, created_at, text, role, documents, rewritten, fetched_new_documents) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (chat_id, message_offset) DO NOTHING',
          [chatId, offset, isUser ? askTime : Date.now(), isUser ? data.question : msg.content, msg.role,
            isUser ? '[]' : JSON.stringify(data.documents || []),
            isUser ? null : (data.rewritten || null),
            isUser ? false : (data.fetched_new_documents || false)]
        );
        offset++;
      }
    }

    res.json(data);
  } catch (err) {
    console.error('Chat message error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a chat
router.delete('/:id', async (req, res) => {
  try {
    await req.db.query('DELETE FROM chats WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

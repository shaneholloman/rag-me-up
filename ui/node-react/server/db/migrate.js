const { Pool } = require('pg');

async function runMigrations(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
      );
    `);

    // Chats table (compatible with Scala schema, adds user_id)
    await client.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        title TEXT,
        created_at NUMERIC,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Add user_id column if it doesn't exist (for existing installations)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'chats' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE chats ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Chat messages table (compatible with Scala schema)
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        chat_id TEXT,
        message_offset INTEGER,
        created_at NUMERIC,
        text TEXT,
        role TEXT,
        documents TEXT,
        rewritten TEXT,
        fetched_new_documents BOOLEAN,
        PRIMARY KEY (chat_id, message_offset),
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS chat_messages_chat_id_message_offset_idx
      ON chat_messages (chat_id, message_offset);
    `);

    // Feedback table (compatible with Scala schema)
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        chat_id TEXT,
        message_offset INTEGER,
        feedback BOOLEAN,
        feedback_text TEXT,
        FOREIGN KEY (chat_id, message_offset) REFERENCES chat_messages(chat_id, message_offset) ON DELETE CASCADE
      );
    `);

    await client.query('COMMIT');
    console.log('Database migrations completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { runMigrations };

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import { sendMessage, getChat, submitFeedback } from '../api';
import DocumentCards from './DocumentCards';
import FeedbackModal from './FeedbackModal';

export default function ChatView({ chatId, selectedDatasets, onChatCreated }) {
  const [messages, setMessages] = useState([]); // { role, content, documents?, rewritten?, fetchedNewDocuments? }
  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => chatId || uuidv4());
  const [messageOffset, setMessageOffset] = useState(0);
  const [isNewChat, setIsNewChat] = useState(!chatId);
  const messagesEndRef = useRef(null);

  // Feedback state
  const [feedbackModal, setFeedbackModal] = useState(null); // { chatId, messageOffset, type }

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // Load existing chat
  useEffect(() => {
    if (chatId) {
      (async () => {
        try {
          const data = await getChat(chatId);
          const loadedMessages = [];
          let offset = 0;

          for (const msg of data.messages) {
            loadedMessages.push({
              role: msg.role,
              content: msg.text,
              documents: msg.documents ? safeParseJSON(msg.documents) : [],
              rewritten: msg.rewritten,
              fetchedNewDocuments: msg.fetched_new_documents,
              offset: msg.message_offset,
            });
            offset = Math.max(offset, msg.message_offset + 1);
          }

          // Only show non-system messages in the UI
          setMessages(loadedMessages.filter(m => m.role !== 'system'));
          setMessageOffset(offset);
          setIsNewChat(false);

          // Rebuild history for the Python API
          const hist = data.messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({ role: m.role, content: m.text }));
          setHistory(hist);

          // Set documents from last assistant message
          const lastAssistant = [...data.messages].reverse().find((m) => m.role === 'assistant');
          if (lastAssistant && lastAssistant.documents) {
            const docs = safeParseJSON(lastAssistant.documents);
            if (Array.isArray(docs)) setDocuments(docs);
          }
        } catch (err) {
          console.error('Failed to load chat:', err);
        }
      })();
    }
  }, [chatId]);

  function safeParseJSON(str) {
    if (!str) return [];
    if (typeof str === 'object') return str;
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  }

  const handleSend = async () => {
    const query = input.trim();
    if (!query || loading) return;

    setInput('');
    setLoading(true);
    setIsNewChat(false);

    // Add user message optimistically
    const userMsg = { role: 'user', content: query, offset: messageOffset };
    setMessages((prev) => [...prev, userMsg]);
    const currentOffset = messageOffset;
    setMessageOffset((prev) => prev + 1);

    try {
      const data = await sendMessage(
        sessionId,
        query,
        history,
        documents,
        selectedDatasets,
        currentOffset
      );

      // If first message, notify parent about new chat
      if (!chatId && currentOffset === 0) {
        onChatCreated(sessionId, data.reply.substring(0, 50) + '...');
        // The title will be set by the server, but we show a placeholder
      }

      const newMessages = [];

      // Rewritten query
      if (data.rewritten) {
        newMessages.push({
          role: 'rewritten',
          content: `Your message has been rewritten:\n\n${data.rewritten}`,
        });
      }

      // Assistant response
      newMessages.push({
        role: 'assistant',
        content: data.reply,
        documents: data.documents || [],
        fetchedNewDocuments: data.fetched_new_documents,
        offset: currentOffset + 1,
      });

      setMessages((prev) => [...prev, ...newMessages]);
      setMessageOffset((prev) => prev + 1);
      setHistory(data.history || []);

      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Something went wrong: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFeedback = (type, offset) => {
    setFeedbackModal({ chatId: sessionId, messageOffset: offset, type });
  };

  const handleSubmitFeedback = async (text) => {
    if (!feedbackModal) return;
    try {
      await submitFeedback(
        feedbackModal.chatId,
        feedbackModal.messageOffset,
        feedbackModal.type === 'positive',
        text
      );
    } catch (err) {
      console.error('Feedback error:', err);
    }
    setFeedbackModal(null);
  };

  return (
    <div className="chat-view">
      <div className="chat-messages">
        {isNewChat && messages.length === 0 && !loading && (
          <div className="chat-welcome">
            <h2>What are you looking for?</h2>
            <p>Ask questions about your documents and get AI-powered answers with source references.</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          if (msg.role === 'system') {
            return (
              <div key={idx} className="message-row agent">
                <div className="message-bubble system">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            );
          }

          if (msg.role === 'rewritten') {
            return (
              <div key={idx} className="message-row agent">
                <div className="message-bubble rewritten">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            );
          }

          if (msg.role === 'user') {
            return (
              <div key={idx} className="message-row human">
                <div className="message-bubble human">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            );
          }

          // Assistant
          return (
            <React.Fragment key={idx}>
              <div className="message-row agent">
                <div className="message-bubble agent">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {msg.offset !== undefined && (
                    <FeedbackButtons
                      onPositive={() => handleFeedback('positive', msg.offset)}
                      onNegative={() => handleFeedback('negative', msg.offset)}
                    />
                  )}
                </div>
              </div>
              {msg.documents &&
                msg.documents.length > 0 &&
                msg.fetchedNewDocuments && (
                  <div className="message-row agent">
                    <div className="message-bubble agent" style={{ maxWidth: '75%' }}>
                      <DocumentCards documents={msg.documents} />
                    </div>
                  </div>
                )}
            </React.Fragment>
          );
        })}

        {loading && (
          <div className="message-row agent">
            <div className="message-bubble agent">
              <div className="typing-indicator">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask a question about your documents..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoFocus
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            <i className="fas fa-paper-plane" />
          </button>
        </div>
      </div>

      {feedbackModal && (
        <FeedbackModal
          type={feedbackModal.type}
          onSubmit={handleSubmitFeedback}
          onClose={() => setFeedbackModal(null)}
        />
      )}
    </div>
  );
}

function FeedbackButtons({ onPositive, onNegative }) {
  const [submitted, setSubmitted] = useState(null);

  const handleClick = (type) => {
    if (submitted) return;
    setSubmitted(type);
    if (type === 'positive') onPositive();
    else onNegative();
  };

  return (
    <div className="feedback-row">
      <button
        className={`feedback-btn positive ${submitted === 'positive' ? 'submitted' : ''} ${submitted && submitted !== 'positive' ? 'dimmed' : ''}`}
        onClick={() => handleClick('positive')}
        title="Good response"
      >
        <i className="far fa-thumbs-up" />
      </button>
      <button
        className={`feedback-btn negative ${submitted === 'negative' ? 'submitted' : ''} ${submitted && submitted !== 'negative' ? 'dimmed' : ''}`}
        onClick={() => handleClick('negative')}
        title="Poor response"
      >
        <i className="far fa-thumbs-down" />
      </button>
      {submitted && <span className="feedback-thanks">Thank you!</span>}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { getFeedback } from '../api';
import DocumentCards from './DocumentCards';

export default function FeedbackPage() {
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'positive' | 'negative'
  const [expandedDocs, setExpandedDocs] = useState({}); // track which cards have docs expanded

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getFeedback();
      setFeedbackItems(data);
    } catch (err) {
      console.error('Failed to load feedback:', err);
      setError('Failed to load feedback data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const filtered = feedbackItems.filter((item) => {
    if (filter === 'positive') return item.feedback === true;
    if (filter === 'negative') return item.feedback === false;
    return true;
  });

  const positiveCount = feedbackItems.filter((f) => f.feedback === true).length;
  const negativeCount = feedbackItems.filter((f) => f.feedback === false).length;

  function safeParseJSON(str) {
    if (!str) return [];
    if (typeof str === 'object') return str;
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  }

  const toggleDocs = (idx) => {
    setExpandedDocs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="feedback-page">
      <div className="feedback-page-header">
        <h2>Feedback Overview</h2>
        <p className="feedback-page-subtitle">
          Review feedback given on chat responses
        </p>
      </div>

      {/* Stats bar */}
      <div className="feedback-stats">
        <div className="feedback-stat-card">
          <span className="feedback-stat-number">{feedbackItems.length}</span>
          <span className="feedback-stat-label">Total</span>
        </div>
        <div className="feedback-stat-card positive">
          <span className="feedback-stat-number">{positiveCount}</span>
          <span className="feedback-stat-label">Positive</span>
        </div>
        <div className="feedback-stat-card negative">
          <span className="feedback-stat-number">{negativeCount}</span>
          <span className="feedback-stat-label">Negative</span>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="feedback-filters">
        <button
          className={`feedback-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({feedbackItems.length})
        </button>
        <button
          className={`feedback-filter-btn positive ${filter === 'positive' ? 'active' : ''}`}
          onClick={() => setFilter('positive')}
        >
          <i className="fas fa-thumbs-up" /> Positive ({positiveCount})
        </button>
        <button
          className={`feedback-filter-btn negative ${filter === 'negative' ? 'active' : ''}`}
          onClick={() => setFilter('negative')}
        >
          <i className="fas fa-thumbs-down" /> Negative ({negativeCount})
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="feedback-loading">
          <i className="fas fa-spinner fa-spin" /> Loading feedback...
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-comment-dots" />
          <p>
            {filter === 'all'
              ? 'No feedback has been given yet.'
              : `No ${filter} feedback found.`}
          </p>
        </div>
      ) : (
        <div className="feedback-list">
          {filtered.map((item, idx) => {
            const docs = safeParseJSON(item.documents);
            const isPositive = item.feedback === true;
            const docsExpanded = expandedDocs[idx];

            return (
              <div
                key={`${item.chat_id}-${item.message_offset}-${idx}`}
                className={`feedback-card ${isPositive ? 'positive' : 'negative'}`}
              >
                {/* Polarity indicator strip */}
                <div className={`feedback-card-indicator ${isPositive ? 'positive' : 'negative'}`} />

                <div className="feedback-card-body">
                  {/* Header: polarity badge + chat title */}
                  <div className="feedback-card-header">
                    <span className={`feedback-badge ${isPositive ? 'positive' : 'negative'}`}>
                      <i className={`fas fa-thumbs-${isPositive ? 'up' : 'down'}`} />
                      {isPositive ? ' Positive' : ' Negative'}
                    </span>
                    {item.chat_title && (
                      <span className="feedback-card-chat" title={item.chat_title}>
                        <i className="fas fa-message" /> {item.chat_title}
                      </span>
                    )}
                  </div>

                  {/* Question */}
                  {item.question && (
                    <div className="feedback-section">
                      <div className="feedback-section-label">
                        <i className="fas fa-user" /> Question
                      </div>
                      <div className="feedback-section-content question">
                        <ReactMarkdown>{item.question}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* Answer */}
                  {item.answer && (
                    <div className="feedback-section">
                      <div className="feedback-section-label">
                        <i className="fas fa-robot" /> Answer
                      </div>
                      <div className={`feedback-section-content answer ${isPositive ? 'positive' : 'negative'}`}>
                        <ReactMarkdown>{item.answer}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* Feedback text */}
                  {item.feedback_text && (
                    <div className="feedback-section">
                      <div className="feedback-section-label">
                        <i className="fas fa-comment" /> Feedback Comment
                      </div>
                      <div className="feedback-section-content comment">
                        {item.feedback_text}
                      </div>
                    </div>
                  )}

                  {/* Documents (collapsible) */}
                  {docs.length > 0 && (
                    <div className="feedback-section">
                      <button
                        className="feedback-docs-toggle"
                        onClick={() => toggleDocs(idx)}
                      >
                        <i className={`fas fa-chevron-${docsExpanded ? 'up' : 'down'}`} />
                        {docsExpanded ? 'Hide' : 'Show'} {docs.length} source document{docs.length !== 1 ? 's' : ''}
                      </button>
                      {docsExpanded && (
                        <div className="feedback-docs">
                          <DocumentCards documents={docs} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

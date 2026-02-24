import React, { useState } from 'react';

export default function FeedbackModal({ type, onSubmit, onClose }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (text.length < 10) {
      setError('Please provide at least 10 characters of feedback.');
      return;
    }
    onSubmit(text);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>
          {type === 'positive' ? '👍' : '👎'} Provide Feedback
        </h3>
        {error && <div className="alert alert-error">{error}</div>}
        <textarea
          placeholder="Tell us more about why this response was helpful or not..."
          value={text}
          onChange={(e) => { setText(e.target.value); setError(''); }}
          autoFocus
        />
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
}

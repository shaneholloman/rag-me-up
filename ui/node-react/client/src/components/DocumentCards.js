import React, { useState } from 'react';

export default function DocumentCards({ documents }) {
  return (
    <div className="documents-section">
      <h5>Documents used in this answer</h5>
      {documents.map((doc, idx) => (
        <DocCard key={idx} doc={doc} />
      ))}
    </div>
  );
}

function DocCard({ doc }) {
  const [expanded, setExpanded] = useState(false);

  const source = doc.metadata?.source || 'Unknown';
  const filename = source.split(/[\\/]/).pop();
  const provenance = doc.provenance
    ? `provenance: ${Math.round(doc.provenance * 100000) / 100000}`
    : null;
  const content = doc.content || doc.page_content || '';

  const displayContent = expanded ? content : content.substring(0, 120) + (content.length > 120 ? '...' : '');

  return (
    <div
      className={`doc-card ${expanded ? 'expanded' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="doc-card-title">{filename}</div>
      {provenance && <div className="doc-card-provenance">{provenance}</div>}
      <div className="doc-card-content">{displayContent}</div>
    </div>
  );
}

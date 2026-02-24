import React, { useState, useEffect, useRef, useCallback } from 'react';
// Collapsible group for each dataset
// ...existing code...

function DatasetGroup({ dataset, docs, onDownload, onDelete }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="dataset-group">
      <div className="dataset-group-header" onClick={() => setOpen((o) => !o)}>
        <span className="dataset-group-toggle">
          <i className={`fas fa-chevron-${open ? 'down' : 'right'}`} />
        </span>
        <span className="dataset-group-title">
          {dataset || <em style={{ color: 'var(--text-muted)' }}>none</em>}
        </span>
        <span className="dataset-group-count">({docs.length} docs)</span>
      </div>
      {open && (
        <table className="doc-table">
          <thead>
            <tr>
              <th>Filename</th>
              <th style={{ width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs
              .sort((a, b) => a.filename.localeCompare(b.filename))
              .map((doc) => (
                <tr key={doc.filename}>
                  <td>{doc.filename}</td>
                  <td>
                    <div className="doc-actions">
                      <button
                        className="doc-action-btn download"
                        onClick={() => onDownload(doc.filename)}
                        title="Download"
                      >
                        <i className="fas fa-download" />
                      </button>
                      <button
                        className="doc-action-btn delete"
                        onClick={() => onDelete(doc.filename)}
                        title="Delete"
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
// ...existing code...
import {
  getDocuments,
  uploadDocuments,
  downloadDocument,
  deleteDocument,
} from '../api';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [dataset, setDataset] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Auto-dismiss alerts
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!dataset.trim() || files.length === 0) return;

    setUploading(true);
    try {
      const result = await uploadDocuments(files, dataset.trim());
      setAlert({ type: 'success', message: result.message });
      setFiles([]);
      setDataset('');
      loadDocuments();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Delete "${filename}"? This cannot be undone.`)) return;
    try {
      const result = await deleteDocument(filename);
      setAlert({
        type: 'success',
        message: `Deleted ${filename} (${result.count} chunks removed).`,
      });
      loadDocuments();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleDownload = async (filename) => {
    try {
      await downloadDocument(filename);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
    e.target.value = '';
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Group documents by dataset
  const grouped = documents.reduce((acc, doc) => {
    const ds = doc.dataset || '';
    if (!acc[ds]) acc[ds] = [];
    acc[ds].push(doc);
    return acc;
  }, {});

  return (
    <div className="documents-page">
      <h2>Document Management</h2>

      {alert && (
        <div className={`alert alert-${alert.type}`}>{alert.message}</div>
      )}

      {/* Upload Section */}
      <div className="upload-section">
        <h3>
          <i className="fas fa-cloud-upload-alt" style={{ marginRight: 8 }} />
          Upload Documents
        </h3>
        <form className="upload-form" onSubmit={handleUpload}>
          <div className="form-group">
            <label>Dataset Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter dataset name..."
              value={dataset}
              onChange={(e) => setDataset(e.target.value)}
              required
            />
          </div>

          <div
            className={`dropzone ${dragOver ? 'dragover' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="dropzone-icon">
              <i className="fas fa-cloud-upload-alt" />
            </div>
            <div className="dropzone-text">
              <strong>Click to browse</strong> or drag and drop files here
            </div>
            <div className="dropzone-text" style={{ fontSize: '0.8rem', marginTop: 4 }}>
              Supports bulk upload — select multiple files at once
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {files.length > 0 && (
            <div className="file-list">
              {files.map((file, idx) => (
                <span key={idx} className="file-tag">
                  {file.name}
                  <span className="file-tag-remove" onClick={() => removeFile(idx)}>
                    ×
                  </span>
                </span>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={uploading || !dataset.trim() || files.length === 0}
          >
            {uploading ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Uploading...
              </>
            ) : (
              <>
                <i className="fas fa-upload" /> Upload {files.length > 0 ? `${files.length} file(s)` : ''}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Documents Table - Grouped by Dataset */}
      <div className="documents-table-section">
        <div className="documents-table-header">
          <h3>
            <i className="fas fa-database" style={{ marginRight: 8 }} />
            Existing Documents ({documents.length})
          </h3>
        </div>

        {documents.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-folder-open" />
            <p>No documents found. Upload some to get started!</p>
          </div>
        ) : (
          <div className="doc-dataset-groups">
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([ds, docs]) => (
                <DatasetGroup
                  key={ds}
                  dataset={ds}
                  docs={docs}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

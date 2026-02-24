import React, { useState, useEffect, useCallback } from 'react';
import { getConfig, updateConfig } from '../api';

/**
 * Configuration categories – each setting is grouped under one of these
 * headings so the page is easy to navigate.
 */
const CONFIG_SECTIONS = [
  {
    title: 'General',
    icon: 'fas fa-cog',
    keys: ['logging_level', 'temperature'],
  },
  {
    title: 'LLM Backend',
    icon: 'fas fa-brain',
    keys: [
      'use_openai', 'openai_model_name',
      'use_azure', 'AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_ENDPOINT',
      'AZURE_OPENAI_CHAT_DEPLOYMENT_NAME', 'AZURE_OPENAI_API_VERSION',
      'use_gemini', 'gemini_model_name',
      'use_anthropic', 'anthropic_model_name', 'anthropic_max_tokens',
      'use_ollama', 'ollama_model_name',
    ],
    reinitialize: true,
  },
  {
    title: 'Embeddings',
    icon: 'fas fa-vector-square',
    keys: ['embedding_model', 'embedding_cpu'],
    warning: 'Changing the embedding model requires a full server restart to take effect.',
  },
  {
    title: 'Data & Ingestion',
    icon: 'fas fa-database',
    keys: [
      'data_directory', 'file_types', 'json_schema', 'json_text_content',
      'xml_xpath', 'csv_seperator',
    ],
  },
  {
    title: 'Vector Store',
    icon: 'fas fa-layer-group',
    keys: ['postgres_uri', 'vector_store_k'],
  },
  {
    title: 'Text Splitting',
    icon: 'fas fa-scissors',
    keys: [
      'splitter',
      'recursive_splitter_chunk_size', 'recursive_splitter_chunk_overlap',
      'semantic_chunker_breakpoint_threshold_type',
      'semantic_chunker_breakpoint_threshold_amount',
      'semantic_chunker_number_of_chunks',
      'paragraph_chunker_max_chunk_size', 'paragraph_chunker_paragraph_separator',
    ],
  },
  {
    title: 'Reranking',
    icon: 'fas fa-sort-amount-down',
    keys: ['rerank', 'rerank_k', 'rerank_model'],
    reinitialize: true,
  },
  {
    title: 'Provenance',
    icon: 'fas fa-certificate',
    keys: [
      'provenance_method', 'provenance_similarity_llm',
      'provenance_include_query', 'provenance_llm_prompt',
    ],
  },
  {
    title: 'HyDE',
    icon: 'fas fa-lightbulb',
    keys: ['use_hyde', 'hyde_query'],
  },
  {
    title: 'RE2',
    icon: 'fas fa-redo',
    keys: ['use_re2', 're2_prompt'],
  },
  {
    title: 'Summarization',
    icon: 'fas fa-compress-alt',
    keys: [
      'use_summarization', 'summarization_threshold',
      'summarization_query', 'summarization_encoder',
    ],
  },
  {
    title: 'RAG Prompts',
    icon: 'fas fa-comment-dots',
    keys: [
      'rag_instruction', 'rag_question_initial',
      'rag_question_followup', 'rag_fetch_new_question',
    ],
  },
  {
    title: 'Rewrite Loop',
    icon: 'fas fa-pen-fancy',
    keys: [
      'use_rewrite_loop', 'rewrite_query_instruction',
      'rewrite_query_question', 'rewrite_query_prompt',
    ],
  },
];

/** Keys whose value should be rendered as a boolean toggle */
const BOOLEAN_KEYS = new Set([
  'rerank', 'use_hyde', 'use_re2', 'use_rewrite_loop',
  'use_summarization', 'use_openai', 'use_azure', 'use_gemini',
  'use_anthropic', 'use_ollama', 'embedding_cpu', 'json_text_content',
  'provenance_include_query',
]);

/** Keys whose value should be rendered as a multi-line textarea */
const TEXTAREA_KEYS = new Set([
  'rag_instruction', 'rag_question_initial', 'rag_question_followup',
  'rag_fetch_new_question', 'rewrite_query_instruction',
  'rewrite_query_question', 'rewrite_query_prompt',
  'summarization_query', 'hyde_query', 'provenance_llm_prompt',
]);

function friendlyLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ConfigPage() {
  const [config, setConfig] = useState({});
  const [editedKeys, setEditedKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [addedKeys, setAddedKeys] = useState([]);  // keys added this session

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getConfig();
      setConfig(data);
      setEditedKeys({});
      setMessage(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (key, value) => {
    setEditedKeys((prev) => ({ ...prev, [key]: value }));
  };

  const currentValue = (key) =>
    key in editedKeys ? editedKeys[key] : (config[key] ?? '');

  const hasChanges = Object.keys(editedKeys).length > 0;

  // Determine whether any edited section carries the `reinitialize` flag
  const needsReinit = CONFIG_SECTIONS.some(
    (sec) =>
      sec.reinitialize &&
      sec.keys.some((k) => k in editedKeys && editedKeys[k] !== config[k])
  );

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await updateConfig(editedKeys, needsReinit);
      setMessage({
        type: 'success',
        text: `Saved ${result.updated?.length ?? 0} setting(s).${needsReinit ? ' LLM reinitialized.' : ''}`,
      });
      // Merge into config
      setConfig((prev) => ({ ...prev, ...editedKeys }));
      setEditedKeys({});
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setEditedKeys({});
    setAddedKeys([]);
    setNewVarKey('');
    setNewVarValue('');
    setMessage(null);
  };

  const handleAddVariable = () => {
    const key = newVarKey.trim();
    if (!key) return;
    if (key in config || key in editedKeys) {
      setMessage({ type: 'error', text: `Variable "${key}" already exists. Edit it above instead.` });
      return;
    }
    setEditedKeys((prev) => ({ ...prev, [key]: newVarValue }));
    setAddedKeys((prev) => [...prev, key]);
    setNewVarKey('');
    setNewVarValue('');
    // Make sure the Other section is expanded
    setExpandedSections((prev) => ({ ...prev, Other: true }));
  };

  const toggleSection = (title) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // Collect keys that don't appear in any section (including newly added ones)
  const categorizedKeys = new Set(CONFIG_SECTIONS.flatMap((s) => s.keys));
  const allKnownKeys = new Set([...Object.keys(config), ...Object.keys(editedKeys)]);
  const uncategorizedKeys = [...allKnownKeys].filter(
    (k) => !categorizedKeys.has(k)
  );

  const allSections = [
    ...CONFIG_SECTIONS,
    ...(uncategorizedKeys.length > 0
      ? [{ title: 'Other', icon: 'fas fa-ellipsis-h', keys: uncategorizedKeys }]
      : []),
  ];

  // Filter sections by search term
  const filteredSections = searchTerm
    ? allSections
        .map((sec) => ({
          ...sec,
          keys: sec.keys.filter(
            (k) =>
              k.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (config[k] ?? '').toLowerCase().includes(searchTerm.toLowerCase())
          ),
        }))
        .filter((sec) => sec.keys.length > 0)
    : allSections;

  if (loading) {
    return (
      <div className="config-page">
        <div className="config-loading">Loading configuration…</div>
      </div>
    );
  }

  return (
    <div className="config-page">
      {/* Header */}
      <div className="config-header">
        <div className="config-header-left">
          <h2><i className="fas fa-sliders-h" /> Server Configuration</h2>
          <p className="config-subtitle">
            Edit the Python server's <code>.env</code> file. Changes to prompts and basic settings
            take effect immediately. LLM backend changes trigger a reinitialization.
          </p>
        </div>
        <div className="config-header-actions">
          {hasChanges && (
            <>
              <button className="config-btn config-btn-secondary" onClick={handleDiscard} disabled={saving}>
                <i className="fas fa-undo" /> Discard
              </button>
              <button className="config-btn config-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin" /> Saving…</> : <><i className="fas fa-save" /> Save changes</>}
              </button>
            </>
          )}
          <button className="config-btn config-btn-ghost" onClick={load} disabled={loading} title="Reload from server">
            <i className="fas fa-sync-alt" />
          </button>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div className={`config-message config-message-${message.type}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`} />
          {message.text}
        </div>
      )}

      {/* Search */}
      <div className="config-search">
        <i className="fas fa-search" />
        <input
          type="text"
          placeholder="Search settings…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="config-search-clear" onClick={() => setSearchTerm('')}>
            <i className="fas fa-times" />
          </button>
        )}
      </div>

      {/* Sections */}
      <div className="config-sections">
        {filteredSections.map((section) => {
          const isExpanded = expandedSections[section.title] !== false; // default open
          const sectionHasEdits = section.keys.some((k) => k in editedKeys);
          return (
            <div key={section.title} className={`config-section ${sectionHasEdits ? 'has-edits' : ''}`}>
              <button className="config-section-header" onClick={() => toggleSection(section.title)}>
                <span className="config-section-title">
                  <i className={section.icon} />
                  {section.title}
                  {sectionHasEdits && <span className="config-badge">modified</span>}
                </span>
                <i className={`fas fa-chevron-down config-section-chevron ${isExpanded ? 'open' : ''}`} />
              </button>

              {isExpanded && (
                <div className="config-section-body">
                  {section.warning && (
                    <div className="config-section-warning">
                      <i className="fas fa-exclamation-circle" /> {section.warning}
                    </div>
                  )}
                  {section.keys
                    .filter((k) => k in config || k in editedKeys)
                    .map((key) => (
                      <ConfigField
                        key={key}
                        name={key}
                        value={currentValue(key)}
                        isEdited={key in editedKeys}
                        isNew={addedKeys.includes(key)}
                        onChange={(v) => handleChange(key, v)}
                        onReset={() => {
                          setEditedKeys((prev) => {
                            const next = { ...prev };
                            delete next[key];
                            return next;
                          });
                          setAddedKeys((prev) => prev.filter((k) => k !== key));
                        }}
                        originalValue={config[key] ?? ''}
                      />
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add custom variable */}
      <div className="config-add-var">
        <div className="config-add-var-title">
          <i className="fas fa-plus-circle" /> Add Custom Variable
        </div>
        <p className="config-add-var-hint">
          Add new environment variables (e.g. <code>OPENAI_API_KEY</code>, <code>GOOGLE_API_KEY</code>).
        </p>
        <div className="config-add-var-form">
          <input
            type="text"
            className="config-input config-add-var-key"
            placeholder="VARIABLE_NAME"
            value={newVarKey}
            onChange={(e) => setNewVarKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddVariable()}
          />
          <span className="config-add-var-eq">=</span>
          <input
            type="text"
            className="config-input config-add-var-value"
            placeholder="value"
            value={newVarValue}
            onChange={(e) => setNewVarValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddVariable()}
          />
          <button
            className="config-btn config-btn-primary config-add-var-btn"
            onClick={handleAddVariable}
            disabled={!newVarKey.trim()}
          >
            <i className="fas fa-plus" /> Add
          </button>
        </div>
      </div>

      {/* Change summary */}
      {hasChanges && (
        <div className="config-change-summary">
          <strong>{Object.keys(editedKeys).length} unsaved change(s)</strong>
          {needsReinit && (
            <span className="config-reinit-notice">
              <i className="fas fa-bolt" /> Will reinitialize LLM
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ConfigField({ name, value, isEdited, isNew, onChange, onReset, originalValue }) {
  const isBoolean = BOOLEAN_KEYS.has(name);
  const isTextarea = TEXTAREA_KEYS.has(name);

  // Strip surrounding quotes for display
  const displayValue = typeof value === 'string' ? value.replace(/^["']|["']$/g, '') : value;
  const displayOriginal = typeof originalValue === 'string' ? originalValue.replace(/^["']|["']$/g, '') : originalValue;

  const handleBoolToggle = () => {
    const current = displayValue === 'True' || displayValue === 'true';
    onChange(current ? 'False' : 'True');
  };

  return (
    <div className={`config-field ${isEdited ? 'edited' : ''} ${isNew ? 'new-var' : ''}`}>
      <div className="config-field-header">
        <label className="config-field-label">{friendlyLabel(name)}</label>
        <code className="config-field-key">{name}</code>
        {isNew && <span className="config-badge config-badge-new">new</span>}
        {isEdited && (
          <button className="config-field-reset" onClick={onReset} title={isNew ? 'Remove' : `Reset to: ${displayOriginal}`}>
            <i className={`fas ${isNew ? 'fa-trash' : 'fa-undo'}`} />
          </button>
        )}
      </div>
      <div className="config-field-input">
        {isBoolean ? (
          <button
            className={`config-toggle ${displayValue === 'True' || displayValue === 'true' ? 'on' : 'off'}`}
            onClick={handleBoolToggle}
          >
            <span className="config-toggle-thumb" />
            <span className="config-toggle-label">
              {displayValue === 'True' || displayValue === 'true' ? 'True' : 'False'}
            </span>
          </button>
        ) : isTextarea ? (
          <textarea
            className="config-textarea"
            rows={4}
            value={displayValue}
            onChange={(e) => {
              // Re-add quotes if the original had them
              const raw = originalValue;
              const hadQuotes = (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"));
              onChange(hadQuotes ? `"${e.target.value}"` : e.target.value);
            }}
          />
        ) : (
          <input
            type="text"
            className="config-input"
            value={displayValue}
            onChange={(e) => {
              const raw = originalValue;
              const hadQuotes = (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"));
              onChange(hadQuotes ? `"${e.target.value}"` : e.target.value);
            }}
          />
        )}
      </div>
    </div>
  );
}

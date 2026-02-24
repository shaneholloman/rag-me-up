import React, { useState, useRef, useEffect } from 'react';

export default function DatasetDropdown({ options, selected, onChange, placeholder = 'Select datasets...' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef();

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  const allChecked = filtered.length > 0 && filtered.every(opt => selected.includes(opt));

  function handleToggle(opt) {
    if (selected.includes(opt)) {
      onChange(selected.filter(o => o !== opt));
    } else {
      onChange([...selected, opt]);
    }
  }

  function handleSelectAll() {
    if (allChecked) {
      onChange(selected.filter(opt => !filtered.includes(opt)));
    } else {
      onChange([...selected, ...filtered.filter(opt => !selected.includes(opt))]);
    }
  }

  return (
    <div className="dataset-section" ref={ref}>
      <button className={`dataset-trigger${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)} type="button">
        <span className="trigger-icon">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="4" rx="1"/><rect x="2" y="10" width="20" height="4" rx="1"/><rect x="2" y="17" width="20" height="4" rx="1"/></svg>
        </span>
        <span className="trigger-label">
          {selected.length === 0 ? placeholder : (selected.length === 1 ? selected[0] : `${selected[0]} +${selected.length - 1} more`)}
        </span>
        <span className={`trigger-badge${selected.length === 0 ? ' hidden' : ''}`}>{selected.length}</span>
        <span className="trigger-chevron">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </button>
      <div className={`dataset-dropdown${open ? ' open' : ''}`}>
        <div className="dataset-search">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter datasets…" />
        </div>
        <div className="dataset-list-header">
          <span className="list-count">{filtered.length} dataset{filtered.length !== 1 ? 's' : ''}</span>
          <button className="select-all-btn" type="button" onClick={handleSelectAll}>{allChecked ? 'Deselect all' : 'Select all'}</button>
        </div>
        <div className="dataset-options">
          {filtered.length === 0 ? (
            <div className="no-results">No datasets match</div>
          ) : filtered.map(opt => (
            <div
              key={opt}
              className={`dataset-option${selected.includes(opt) ? ' checked' : ''}`}
              onClick={() => handleToggle(opt)}
            >
              <div className="ds-checkbox">
                <svg className="ds-checkmark" width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2 6 5 9 10 3"/>
                </svg>
              </div>
              <span className="ds-name">{opt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

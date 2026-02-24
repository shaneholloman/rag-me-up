import React from 'react';
import DatasetDropdown from './MultiselectDropdown';
// ...existing code...

export default function Sidebar({
  user,
  datasets,
  selectedDatasets,
  onToggleDataset,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  activeView,
  onViewChange,
  onLogout,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>RAG Me Up - by SensAI.PT</h1>
        <div className="user-email">{user?.email}</div>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        <button
          className={`sidebar-nav-btn ${activeView === 'chat' ? 'active' : ''}`}
          onClick={() => onViewChange('chat')}
        >
          <i className="fas fa-comments" /> Chat
        </button>
        <button
          className={`sidebar-nav-btn ${activeView === 'documents' ? 'active' : ''}`}
          onClick={() => onViewChange('documents')}
        >
          <i className="fas fa-folder" /> Documents
        </button>
      </div>

      {/* Datasets */}
      {datasets.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">Datasets</div>
          <DatasetDropdown
            options={datasets.sort()}
            selected={selectedDatasets}
            onChange={onToggleDataset}
            placeholder="Select datasets..."
          />
        </div>
      )}

      {/* Chats */}
      <div className="sidebar-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="chat-list-header">
          <div className="sidebar-section-title" style={{ marginBottom: 0 }}>
            Chats
          </div>
          <button className="new-chat-btn" onClick={onNewChat} title="New chat">
            <i className="fas fa-plus" />
          </button>
        </div>
        <div className="chat-list">
          {chats.length === 0 ? (
            <div style={{ padding: '12px 8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
              No chats yet
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-list-item ${activeChatId === chat.id ? 'active' : ''}`}
                onClick={() => onSelectChat(chat.id)}
              >
                <i className="fas fa-message" style={{ fontSize: '0.7rem', opacity: 0.5 }} />
                <span className="chat-list-item-title" title={chat.title}>
                  {chat.title}
                </span>
                <button
                  className="chat-list-item-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  title="Delete chat"
                >
                  <i className="fas fa-trash" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <i className="fas fa-sign-out-alt" /> Sign out
        </button>
      </div>
    </aside>
  );
}

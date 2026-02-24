import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDatasets, getChats, deleteChat as deleteChatApi } from '../api';
import Sidebar from '../components/Sidebar';
import ChatView from '../components/ChatView';
import DocumentsPage from '../components/DocumentsPage';
import ConfigPage from '../components/ConfigPage';
import FeedbackPage from '../components/FeedbackPage';

export default function MainLayout() {
  const { user, logoutUser } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasets, setSelectedDatasets] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeView, setActiveView] = useState('chat');

  const loadDatasets = useCallback(async () => {
    try {
      const data = await getDatasets();
      setDatasets(data);
    } catch (err) {
      console.error('Failed to load datasets:', err);
    }
  }, []);

  const loadChats = useCallback(async () => {
    try {
      const data = await getChats();
      setChats(data);
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  }, []);

  useEffect(() => {
    loadDatasets();
    loadChats();
  }, [loadDatasets, loadChats]);

  const handleNewChat = () => {
    setActiveChatId(null);
    setActiveView('chat');
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setActiveView('chat');
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await deleteChatApi(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  const setSelectedDatasetsHandler = (datasets) => {
    setSelectedDatasets(datasets);
  };

  const handleChatCreated = (chatId, title) => {
    setChats((prev) => [{ id: chatId, title, created_at: Date.now() }, ...prev]);
    setActiveChatId(chatId);
  };

  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        datasets={datasets}
        selectedDatasets={selectedDatasets}
        onToggleDataset={setSelectedDatasetsHandler}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={logoutUser}
      />
      <div className="main-content">
        {activeView === 'config' ? (
          <ConfigPage />
        ) : activeView === 'documents' ? (
          <DocumentsPage />
        ) : activeView === 'feedback' ? (
          <FeedbackPage />
        ) : (
          <ChatView
            key={activeChatId || 'new'}
            chatId={activeChatId}
            selectedDatasets={selectedDatasets}
            onChatCreated={handleChatCreated}
          />
        )}
      </div>
    </div>
  );
}

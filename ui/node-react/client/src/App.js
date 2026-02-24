import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import MainLayout from './pages/MainLayout';

function AppContent() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <MainLayout /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

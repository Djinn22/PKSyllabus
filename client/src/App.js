import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SimpleNav from './components/SimpleNav';
import PublicApp from './PublicApp';
import JuniorSyllabus from './JuniorSyllabus';
import Admin from './Admin';
import EditSyllabus from './EditSyllabus';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function AppContent() {
  const { user } = useAuth();
  
  return (
    <div className="app" style={{ position: 'relative' }}>
      <header className="app-header">
        <div className="header-content">
          <img src="/pkr_logo.webp" alt="PKR Logo" className="logo" />
          <div className="header-text">
            <h1>Karate Syllabus</h1>
            <p>Progressive Shotokan Syllabus</p>
          </div>
        </div>
        <SimpleNav isAuthenticated={!!user} isAdmin={user?.isAdmin} />
      </header>
      
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Navigate to="/senior" replace />} />
          <Route path="/senior" element={<PublicApp syllabusType="senior" />} />
          <Route path="/junior" element={<JuniorSyllabus />} />
          
          {/* Public routes */}
          <Route path="/login" element={
            user ? <Navigate to="/admin" replace /> : <Login />
          } />
          
          {/* Protected routes */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } />
          
          <Route path="/edit/:type" element={
            <ProtectedRoute requireAdmin>
              <EditSyllabus />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Karate School. All rights reserved.</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;

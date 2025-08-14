import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import api from '../api';

const AuthContext = createContext();
const REAUTH_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastReauthAt, setLastReauthAt] = useState(() => {
    const ts = localStorage.getItem('lastReauthAt');
    return ts ? Number(ts) : 0;
  });

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Set the Authorization header for this specific request
          const response = await api.get('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          // If we got here, the token is valid
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(response.data);
          // Do not initialize reauth timestamp here; require explicit login to set it
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('lastReauthAt');
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    // Set the default Authorization header for all future requests
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    const now = Date.now();
    localStorage.setItem('lastReauthAt', String(now));
    setLastReauthAt(now);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('lastReauthAt');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setLastReauthAt(0);
  };

  // helper: should force re-auth?
  const shouldReauth = () => {
    if (!lastReauthAt) return true;
    return Date.now() - lastReauthAt > REAUTH_WINDOW_MS;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, lastReauthAt, shouldReauth }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

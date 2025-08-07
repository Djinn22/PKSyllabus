import React from 'react';
import App from './App';
import PublicApp from './PublicApp';

const Router = () => {
  // Simple routing based on URL path
  const path = window.location.pathname;
  
  // Admin interface
  if (path === '/admin' || path.startsWith('/admin/')) {
    return <App />;
  }
  
  // Public interface (default)
  return <PublicApp />;
};

export default Router;

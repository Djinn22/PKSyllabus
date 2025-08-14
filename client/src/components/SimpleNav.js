import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SimpleNav = ({ isAuthenticated, isAdmin }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <div className="nav-container" style={{ position: 'relative' }}>
      {/* Subtle top-right Admin link to force login */}
      <div style={{ position: 'absolute', top: 8, right: 12 }}>
        <NavLink to="/login" className={({ isActive }) => `admin-link${isActive ? ' active' : ''}`}>
          Admin
        </NavLink>
      </div>

      <div className="nav-buttons">
        <NavLink 
          to="/senior"
          className={({ isActive }) => `nav-button senior${isActive ? ' active' : ''}`}
        >
          Senior Syllabus
        </NavLink>
        <NavLink 
          to="/junior"
          className={({ isActive }) => `nav-button junior${isActive ? ' active' : ''}`}
        >
          Junior Syllabus
        </NavLink>

        {isAuthenticated && (
          <button 
            onClick={handleLogout}
            className="nav-button logout"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
};

export default SimpleNav;

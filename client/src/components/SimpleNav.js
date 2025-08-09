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
    <div className="nav-container">
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
        
        {isAuthenticated ? (
          <>
            <NavLink 
              to="/admin"
              className={({ isActive }) => `nav-button admin${isActive ? ' active' : ''}`}
            >
              Admin
            </NavLink>
            <button 
              onClick={handleLogout}
              className="nav-button logout"
            >
              Logout
            </button>
          </>
        ) : (
          <NavLink 
            to="/login" 
            className={({ isActive }) => `nav-button login${isActive ? ' active' : ''}`}
          >
            Admin Login
          </NavLink>
        )}
      </div>
    </div>
  );
};

export default SimpleNav;

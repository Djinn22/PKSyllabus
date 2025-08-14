import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

// Simple error boundary for the navigation
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Navigation Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red', padding: '1rem', textAlign: 'center' }}>Navigation Error</div>;
    }

    return this.props.children;
  }
}

const Navigation = () => {
  try {
    return (
      <ErrorBoundary>
        <nav className="syllabus-nav" style={{
          border: '2px solid #e74c3c',
          backgroundColor: '#2c3e50',
          padding: '1rem',
          margin: '1rem 0',
          borderRadius: '8px',
          position: 'relative'
        }}>
          <div className="nav-top-right">
            <NavLink to="/login" className={({ isActive }) => isActive ? 'admin-link active' : 'admin-link'}>
              Admin
            </NavLink>
          </div>
          <h3 style={{ color: 'white', margin: '0 0 1rem 0', textAlign: 'center' }}>Syllabus Navigation</h3>
          <ul style={{
            display: 'flex',
            justifyContent: 'center',
            listStyle: 'none',
            padding: 0,
            margin: 0,
            gap: '1rem'
          }}>
            <li>
              <NavLink 
                to="/senior" 
                className={({ isActive }) => isActive ? 'active' : ''}
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3498db',
                  borderRadius: '4px',
                  display: 'inline-block',
                  minWidth: '150px',
                  textAlign: 'center'
                }}
              >
                Senior Syllabus
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/junior" 
                className={({ isActive }) => isActive ? 'active' : ''}
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2ecc71',
                  borderRadius: '4px',
                  display: 'inline-block',
                  minWidth: '150px',
                  textAlign: 'center'
                }}
              >
                Junior Syllabus
              </NavLink>
            </li>
          </ul>
        </nav>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error in Navigation component:', error);
    return (
      <div style={{ 
        backgroundColor: '#ffebee', 
        color: '#c62828', 
        padding: '1rem', 
        margin: '1rem 0',
        borderRadius: '4px',
        border: '1px solid #ef9a9a'
      }}>
        <h3>Navigation Error</h3>
        <p>There was an error loading the navigation.</p>
      </div>
    );
  }
};

export default Navigation;

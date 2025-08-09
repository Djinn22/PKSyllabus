import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from './api';
import BackupRestore from './components/BackupRestore';
import './Admin.css';

function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({ username: '', password: '', isAdmin: false });
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/users');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/users', newUser);
      setNewUser({ username: '', password: '', isAdmin: false });
      setShowAddUser(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/api/admin/users/${id}`);
        fetchUsers();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  if (loading) {
    return <div className="admin-container">Loading...</div>;
  }
  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>
      <div className="admin-actions">
        <Link 
          to="/edit/senior" 
          className="btn btn-primary"
        >
          Edit Senior Syllabus
        </Link>
        <Link 
          to="/edit/junior" 
          className="btn btn-primary"
        >
          Edit Junior Syllabus
        </Link>
      </div>
      <BackupRestore />
      <div className="admin-section">
        <h2>User Management</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        
        <div className="user-list">
          <h3>Admin Users</h3>
          <table className="user-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.isAdmin ? 'Admin' : 'User'}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={users.length <= 1} // Prevent deleting the last admin
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {showAddUser ? (
            <form onSubmit={handleAddUser} className="add-user-form">
              <h4>Add New User</h4>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  className="form-control"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="isAdminCheck"
                  checked={newUser.isAdmin}
                  onChange={(e) => setNewUser({...newUser, isAdmin: e.target.checked})}
                />
                <label className="form-check-label" htmlFor="isAdminCheck">
                  Admin User
                </label>
              </div>
              <div className="button-group">
                <button type="submit" className="btn btn-primary">
                  Add User
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddUser(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button 
              className="btn btn-primary mt-3"
              onClick={() => setShowAddUser(true)}
            >
              Add Admin User
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BackupRestore.css';

function BackupRestore() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBackup, setSelectedBackup] = useState('');
  const [backupName, setBackupName] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fetch list of backups
  useEffect(() => {
    const fetchBackups = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/backups', {
          auth: {
            username: 'admin',
            password: 'karate123'
          }
        });
        setBackups(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching backups:', err);
        setError('Failed to load backups. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBackups();
  }, []);

  const createBackup = async () => {
    if (!backupName.trim()) {
      setMessage({ text: 'Please enter a backup name', type: 'error' });
      return;
    }

    try {
      setIsCreatingBackup(true);
      setMessage({ text: '', type: '' });
      
      const response = await axios.post(
        '/api/backups',
        { name: backupName },
        {
          auth: {
            username: 'admin',
            password: 'karate123'
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      setMessage({ text: response.data.message || 'Backup created successfully!', type: 'success' });
      setBackupName('');
      
      // Refresh backups list
      const updatedBackups = await axios.get('/api/backups', {
        auth: {
          username: 'admin',
          password: 'karate123'
        }
      });
      setBackups(updatedBackups.data);
    } catch (err) {
      console.error('Error creating backup:', err);
      setMessage({ 
        text: err.response?.data?.error || 'Failed to create backup', 
        type: 'error' 
      });
    } finally {
      setIsCreatingBackup(false);
      // Clear message after 5 seconds
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    }
  };

  const restoreBackup = async () => {
    if (!selectedBackup) {
      setMessage({ text: 'Please select a backup to restore', type: 'error' });
      return;
    }

    if (!window.confirm('Are you sure you want to restore this backup? This will overwrite the current syllabus data.')) {
      return;
    }

    try {
      setIsRestoring(true);
      setMessage({ text: '', type: '' });
      
      const response = await axios.post(
        `/api/backups/${encodeURIComponent(selectedBackup)}/restore`,
        { type: 'senior' }, // Default to senior syllabus, can be made configurable
        {
          auth: {
            username: 'admin',
            password: 'karate123'
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      setMessage({ 
        text: response.data.message || 'Backup restored successfully! The page will refresh in 3 seconds...', 
        type: 'success' 
      });
      
      // Refresh the page to show updated data
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      console.error('Error restoring backup:', err);
      setMessage({ 
        text: err.response?.data?.error || 'Failed to restore backup', 
        type: 'error' 
      });
    } finally {
      setIsRestoring(false);
      // Clear message after 5 seconds
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    }
  };

  const deleteBackup = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete the backup "${filename}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setMessage({ text: '', type: '' });
      
      const response = await axios.delete(`/api/backups/${encodeURIComponent(filename)}`, {
        auth: {
          username: 'admin',
          password: 'karate123'
        }
      });
      
      setMessage({ 
        text: response.data.message || 'Backup deleted successfully!', 
        type: 'success' 
      });
      
      // Refresh backups list
      const updatedBackups = await axios.get('/api/backups', {
        auth: {
          username: 'admin',
          password: 'karate123'
        }
      });
      setBackups(updatedBackups.data);
      setSelectedBackup(''); // Reset selected backup
    } catch (err) {
      console.error('Error deleting backup:', err);
      setMessage({ 
        text: err.response?.data?.error || 'Failed to delete backup', 
        type: 'error' 
      });
    } finally {
      // Clear message after 5 seconds
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    }
  };

  return (
    <div className="backup-restore">
      <h2>Backup & Restore</h2>
      
      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="backup-section">
        <h3>Create New Backup</h3>
        <div className="form-group">
          <input
            type="text"
            value={backupName}
            onChange={(e) => setBackupName(e.target.value)}
            placeholder="Enter backup name"
            className="form-control"
            disabled={isCreatingBackup}
          />
          <button
            className="btn btn-primary"
            onClick={createBackup}
            disabled={isCreatingBackup || !backupName.trim()}
          >
            {isCreatingBackup ? 'Creating...' : 'Create Backup'}
          </button>
        </div>
      </div>

      <div className="restore-section">
        <h3>Restore from Backup</h3>
        {loading ? (
          <div className="loading">Loading backups...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : backups.length === 0 ? (
          <div className="no-backups">No backups available</div>
        ) : (
          <>
            <div className="form-group">
              <select
                className="form-control"
                value={selectedBackup}
                onChange={(e) => setSelectedBackup(e.target.value)}
                disabled={isRestoring}
              >
                <option value="">Select a backup to restore</option>
                {backups.map((backup) => (
                  <option key={backup} value={backup}>
                    {backup}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-warning"
                onClick={restoreBackup}
                disabled={!selectedBackup || isRestoring}
              >
                {isRestoring ? 'Restoring...' : 'Restore Backup'}
              </button>
            </div>
            <div className="backup-list">
              <h4>Available Backups:</h4>
              <ul>
                {backups.map((backup) => (
                  <li key={backup}>
                    <span>{backup}</span>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteBackup(backup)}
                      disabled={isRestoring}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default BackupRestore;

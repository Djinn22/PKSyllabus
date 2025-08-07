import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BeltSection from './components/BeltSection';
import './App.css';

function App() {
  const [syllabusData, setSyllabusData] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    fetchSyllabus();
  }, []);

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/syllabus');
      setSyllabusData(response.data);
    } catch (error) {
      console.error('Error fetching syllabus:', error);
      setMessage('Error loading syllabus data');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const updateSyllabusData = (belt, category, newData) => {
    setSyllabusData(prev => ({
      ...prev,
      [belt]: {
        ...prev[belt],
        [category]: newData
      }
    }));
  };

  const saveSyllabus = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/syllabus', syllabusData);
      setMessage(`Syllabus saved successfully! Backup: ${response.data.backup}`);
      setMessageType('success');
    } catch (error) {
      console.error('Error saving syllabus:', error);
      if (error.response?.status === 401) {
        setMessage('Authentication required. Please log in.');
      } else if (error.response?.data?.details) {
        setMessage(`Validation error: ${error.response.data.details.join(', ')}`);
      } else {
        setMessage('Error saving syllabus');
      }
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && Object.keys(syllabusData).length === 0) {
    return (
      <div className="container">
        <div className="loading">Loading syllabus data...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>PKSyllabus Admin - Edit Syllabus</h1>
        <p>Edit karate belt grading requirements. Changes are validated and backed up automatically.</p>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {Object.entries(syllabusData).map(([belt, categories]) => (
        <BeltSection
          key={belt}
          belt={belt}
          categories={categories}
          onUpdate={updateSyllabusData}
        />
      ))}

      <div className="save-section">
        <button 
          className="btn btn-success" 
          onClick={saveSyllabus}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Syllabus'}
        </button>
      </div>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EditSyllabus.css';

function EditSyllabus() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [syllabus, setSyllabus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSyllabus();
  }, [type]);

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/syllabus?type=${type}`);
      setSyllabus(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load syllabus');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await axios.post('/api/syllabus', { 
        type, 
        data: syllabus,
        action: 'update'
      }, {
        auth: {
          username: 'admin',
          password: 'karate123'
        }
      });
      alert('Syllabus saved successfully!');
    } catch (err) {
      setError('Failed to save syllabus');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = (belt, category) => {
    const newItem = {
      traditional: '',
      english: '',
      notes: ''
    };
    
    setSyllabus(prev => ({
      ...prev,
      [belt]: {
        ...prev[belt],
        [category]: [
          ...(prev[belt]?.[category] || []),
          newItem
        ]
      }
    }));
    
    setEditingItem({
      belt,
      category,
      index: (syllabus[belt]?.[category]?.length || 0),
      ...newItem
    });
  };

  const handleUpdateItem = (belt, category, index, field, value) => {
    setSyllabus(prev => {
      const updated = { ...prev };
      if (!updated[belt]) updated[belt] = {};
      if (!updated[belt][category]) updated[belt][category] = [];
      if (!updated[belt][category][index]) updated[belt][category][index] = {};
      
      updated[belt][category][index] = {
        ...updated[belt][category][index],
        [field]: value
      };
      
      return updated;
    });
  };

  const handleDeleteItem = (belt, category, index) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setSyllabus(prev => ({
        ...prev,
        [belt]: {
          ...prev[belt],
          [category]: [
            ...prev[belt][category].slice(0, index),
            ...prev[belt][category].slice(index + 1)
          ]
        }
      }));
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="edit-syllabus">
      <div className="edit-header">
        <h1>Edit {type.charAt(0).toUpperCase() + type.slice(1)} Syllabus</h1>
        <div className="action-buttons">
          <button 
            className="btn btn-save"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            className="btn btn-cancel"
            onClick={() => navigate('/admin')}
          >
            Back to Admin
          </button>
        </div>
      </div>

      <div className="syllabus-container">
        {Object.entries(syllabus).map(([belt, categories]) => (
          <div key={belt} className="belt-section">
            <h2>{belt}</h2>
            {Object.entries(categories).map(([category, items]) => (
              <div key={`${belt}-${category}`} className="category-section">
                <h3>{category}</h3>
                <button 
                  className="btn btn-add"
                  onClick={() => handleAddItem(belt, category)}
                >
                  + Add Item
                </button>
                <div className="items-list">
                  {items.map((item, index) => (
                    <div key={index} className="item-row">
                      <input
                        type="text"
                        value={item.traditional || ''}
                        onChange={(e) => handleUpdateItem(belt, category, index, 'traditional', e.target.value)}
                        placeholder="Traditional"
                        className="item-input"
                      />
                      <input
                        type="text"
                        value={item.english || ''}
                        onChange={(e) => handleUpdateItem(belt, category, index, 'english', e.target.value)}
                        placeholder="English"
                        className="item-input"
                      />
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => handleUpdateItem(belt, category, index, 'notes', e.target.value)}
                        placeholder="Notes"
                        className="item-input"
                      />
                      <button 
                        className="btn btn-delete"
                        onClick={() => handleDeleteItem(belt, category, index)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default EditSyllabus;

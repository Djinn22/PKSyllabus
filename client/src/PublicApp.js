import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PublicBeltSection from './components/PublicBeltSection';
import './PublicApp.css';

function PublicApp() {
  const [syllabus, setSyllabus] = useState({});
  const [cumulativeSyllabus, setCumulativeSyllabus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBelt, setSelectedBelt] = useState('all');
  const [expandedBelts, setExpandedBelts] = useState({});

  // Toggle expansion state for a belt section
  const toggleBeltExpand = (belt) => {
    setExpandedBelts(prev => ({
      ...prev,
      [belt]: !prev[belt]
    }));
  };

  // Initialize all belts as expanded by default
  useEffect(() => {
    if (Object.keys(syllabus).length > 0 && Object.keys(expandedBelts).length === 0) {
      const initialExpandedState = {};
      Object.keys(syllabus).forEach(belt => {
        initialExpandedState[belt] = true; // Start with all belts expanded
      });
      setExpandedBelts(initialExpandedState);
    }
  }, [syllabus]);

  // Belt progression order for cumulative display
  const beltOrder = [
    'Red Belt',
    'Yellow Belt', 
    'Orange Belt',
    'Green Belt',
    'Purple Belt',
    'Blue Belt',
    'Brown Belt',
    'Brown/Black Stripe',
    'Black Belt'
  ];

  useEffect(() => {
    fetchSyllabus();
  }, []);

  // Create cumulative syllabus where each belt includes all previous techniques
  const createCumulativeSyllabus = (syllabusData) => {
    const cumulative = {};
    let previousBeltsData = {};
    
    beltOrder.forEach((belt, index) => {
      if (!syllabusData[belt]) return;
      
      // Start with a copy of previous belts' data
      const currentBeltData = JSON.parse(JSON.stringify(previousBeltsData));
      
      // Add current belt's data with isCurrentBelt flag
      Object.entries(syllabusData[belt]).forEach(([category, items]) => {
        if (!currentBeltData[category]) {
          currentBeltData[category] = [];
        }
        
        // Mark current belt's items with isCurrentBelt: true
        const currentItems = items.map(item => ({
          ...item,
          isCurrentBelt: true
        }));
        
        // Add current belt's items to the beginning of the category
        currentBeltData[category] = [
          ...currentItems,
          ...(currentBeltData[category] || [])
        ];
      });
      
      // Save the cumulative data for this belt
      cumulative[belt] = currentBeltData;
      
      // Update previous belts data for next iteration
      previousBeltsData = { ...currentBeltData };
    });
    
    return cumulative;
  };

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/syllabus');
      const syllabusData = response.data;
      setSyllabus(syllabusData);
      
      // Create and set cumulative syllabus data
      const cumulative = createCumulativeSyllabus(syllabusData);
      setCumulativeSyllabus(cumulative);
    } catch (error) {
      console.error('Error fetching syllabus:', error);
      setError('Error loading syllabus data');
    } finally {
      setLoading(false);
    }
  };

  const filteredSyllabus = () => {
    let filtered = syllabus;
    
    // Filter by selected belt
    if (selectedBelt !== 'all') {
      filtered = { [selectedBelt]: syllabus[selectedBelt] };
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const result = {};
      
      Object.entries(filtered).forEach(([belt, categories]) => {
        const filteredCategories = {};
        let hasMatch = false;
        
        Object.entries(categories).forEach(([category, items]) => {
          const filteredItems = items.filter(item => {
            if (item.traditional && item.traditional.toLowerCase().includes(searchLower)) return true;
            if (item.english && item.english.toLowerCase().includes(searchLower)) return true;
            if (item.name && item.name.toLowerCase().includes(searchLower)) return true;
            if (item.requirements && item.requirements.some(req => req.toLowerCase().includes(searchLower))) return true;
            return false;
          });
          
          if (filteredItems.length > 0) {
            filteredCategories[category] = filteredItems;
            hasMatch = true;
          }
        });
        
        if (hasMatch) {
          result[belt] = filteredCategories;
        }
      });
      
      return result;
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="public-container">
        <div className="loading">Loading syllabus...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  const beltOptions = Object.keys(syllabus);
  const filteredData = filteredSyllabus();

  return (
    <div className="public-container">
      <header className="public-header">
        <div className="header-content">
          <img src="/pkr_logo.webp" alt="PKR Logo" className="logo" />
          <div className="header-text">
            <h1>Karate Belt Grading Requirements</h1>
            <p>Progressive Shotokan Syllabus</p>
          </div>
        </div>
      </header>

      <div className="controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search techniques, kata, or requirements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-section">
          <label htmlFor="belt-filter">Filter by Belt:</label>
          <select
            id="belt-filter"
            value={selectedBelt}
            onChange={(e) => setSelectedBelt(e.target.value)}
            className="belt-filter"
          >
            <option value="all">All Belts</option>
            {beltOptions.map(belt => (
              <option key={belt} value={belt}>{belt}</option>
            ))}
          </select>
        </div>
      </div>

      {Object.keys(filteredData).length === 0 ? (
        <div className="no-results">
          <p>No results found for "{searchTerm}"</p>
          <button onClick={() => setSearchTerm('')} className="btn btn-primary">
            Clear Search
          </button>
        </div>
      ) : (
        <div className="syllabus-content">
          {Object.entries(syllabus).map(([belt, categories]) => (
            <PublicBeltSection 
              key={belt}
              belt={belt} 
              categories={categories}
              cumulativeCategories={cumulativeSyllabus[belt] || {}}
              isExpanded={expandedBelts[belt]}
              onToggleExpand={() => toggleBeltExpand(belt)}
              searchTerm={searchTerm}
              isVisible={selectedBelt === 'all' || selectedBelt === belt}
            />
          ))}
        </div>
      )}

      <footer className="public-footer">
        <p> Peninsula Karate 2025</p>
        <p>
          <a href="/admin" className="admin-link">Admin Access</a>
        </p>
      </footer>
    </div>
  );
}

export default PublicApp;

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
  }, [syllabus, expandedBelts]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchSyllabus is stable and doesn't need to be in deps

  // Create cumulative syllabus where each belt includes all previous techniques
  const createCumulativeSyllabus = (syllabusData) => {
    const cumulative = {};
    const allItemsByCategory = new Map(); // Track items by category across all belts
    
    try {
      // First pass: collect all unique items by category across all belts
      beltOrder.forEach(belt => {
        if (!syllabusData || !syllabusData[belt]) return;
        
        Object.entries(syllabusData[belt]).forEach(([category, items]) => {
          if (!Array.isArray(items)) return;
          
          // Initialize category if it doesn't exist
          if (!allItemsByCategory.has(category)) {
            allItemsByCategory.set(category, new Map());
          }
          const categoryItems = allItemsByCategory.get(category);
          
          // Add items from this belt to the category
          items.forEach(item => {
            if (!item) return;
            
            const safeItem = {
              ...item,
              traditional: item.traditional || '',
              english: item.english || '',
              isCurrentBelt: false, // Will be set to true for the belt it first appears in
              _originBelt: belt
            };
            
            const itemKey = `${safeItem.traditional}_${safeItem.english}`.toLowerCase();
            
            // Only add if we haven't seen this item in this category before
            if (!categoryItems.has(itemKey)) {
              categoryItems.set(itemKey, {
                ...safeItem,
                _firstSeenBelt: belt // Track where this item first appeared
              });
            }
          });
        });
      });
      
      // Second pass: build cumulative syllabus for each belt
      const processedBelts = new Set();
      
      beltOrder.forEach(belt => {
        if (!syllabusData || !syllabusData[belt]) return;
        
        const currentBeltData = {};
        
        // Get all categories from all belts up to this one
        const allCategories = new Set();
        beltOrder.slice(0, beltOrder.indexOf(belt) + 1).forEach(b => {
          if (syllabusData[b]) {
            Object.keys(syllabusData[b]).forEach(cat => allCategories.add(cat));
          }
        });
        
        // Process each category that exists up to this belt
        allCategories.forEach(category => {
          if (!allItemsByCategory.has(category)) return;
          
          const categoryItems = [];
          const categoryMap = allItemsByCategory.get(category);
          
          // Add all items from this category that were first seen in this or previous belts
          categoryMap.forEach((item, key) => {
            if (beltOrder.indexOf(item._firstSeenBelt) <= beltOrder.indexOf(belt)) {
              categoryItems.push({
                ...item,
                isCurrentBelt: item._firstSeenBelt === belt
              });
            }
          });
          
          if (categoryItems.length > 0) {
            currentBeltData[category] = categoryItems;
          }
        });
        
        // Save the complete data for this belt
        cumulative[belt] = currentBeltData;
        processedBelts.add(belt);
        
        // Item count calculation kept for potential future use
        const itemCount = Object.values(currentBeltData).reduce(
          (total, items) => total + (items?.length || 0), 0
        );
      });
      
      // Debug logging removed for production
      
      return cumulative;
      
    } catch (error) {
      console.error('Error in createCumulativeSyllabus:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      return cumulative;
    }
  };

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/syllabus/senior');
      const syllabusData = response.data;
      
      // Ensure the syllabus data has the expected structure
      if (!syllabusData || typeof syllabusData !== 'object') {
        throw new Error('Invalid syllabus data format');
      }
      
      setSyllabus(syllabusData);
      
      // Create and set cumulative syllabus data
      const cumulative = createCumulativeSyllabus(syllabusData);
      setCumulativeSyllabus(cumulative);
    } catch (error) {
      console.error('Error fetching syllabus:', error);
      setError(`Error loading syllabus data: ${error.message}`);
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
          {beltOrder.map((belt) => {
            if (!syllabus[belt]) return null;
            
            return (
              <PublicBeltSection 
                key={belt}
                belt={belt} 
                categories={syllabus[belt]}
                cumulativeCategories={cumulativeSyllabus[belt] || {}}
                isExpanded={expandedBelts[belt]}
                onToggleExpand={() => toggleBeltExpand(belt)}
                searchTerm={searchTerm}
                isVisible={selectedBelt === 'all' || selectedBelt === belt}
              />
            );
          })}
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

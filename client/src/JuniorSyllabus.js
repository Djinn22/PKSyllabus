import React, { useState, useEffect } from 'react';
import axios from 'axios';
import JuniorBeltSection from './components/JuniorBeltSection';
import './PublicApp.css';

function JuniorSyllabus() {
  const [syllabus, setSyllabus] = useState({});
  const [cumulativeSyllabus, setCumulativeSyllabus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBelt, setSelectedBelt] = useState('all');
  const [expandedBelts, setExpandedBelts] = useState({});

  // Belt progression order for cumulative display
  const beltOrder = React.useMemo(() => [
    'Red Belt',
    'Yellow Belt', 
    'Orange Belt',
    'Green Belt',
    'Purple Belt',
    'Blue Belt',
    'Brown Belt',
    'Brown/Black Stripe',
    'Black Belt'
  ], []); // Empty dependency array since beltOrder is static

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
        initialExpandedState[belt] = true;
      });
      setExpandedBelts(initialExpandedState);
    }
  }, [syllabus, expandedBelts]);

  // Create cumulative syllabus where each belt includes all previous techniques
  const createCumulativeSyllabus = React.useCallback((syllabusData) => {
    const cumulative = {};
    const allItemsByCategory = new Map();
    
    try {
      // First pass: collect unique items by category across belts
      beltOrder.forEach(belt => {
        if (!syllabusData || !syllabusData[belt]) return;
        
        Object.entries(syllabusData[belt]).forEach(([category, items]) => {
          if (!Array.isArray(items)) return;
          
          if (!allItemsByCategory.has(category)) {
            allItemsByCategory.set(category, new Map());
          }
          const categoryItems = allItemsByCategory.get(category);
          
          items.forEach(item => {
            if (!item) return;
            
            const safeItem = {
              ...item,
              traditional: item.traditional || '',
              english: item.english || '',
              isCurrentBelt: false,
              _originBelt: belt
            };
            
            const itemKey = `${safeItem.traditional}_${safeItem.english}`.toLowerCase();
            
            if (!categoryItems.has(itemKey)) {
              categoryItems.set(itemKey, {
                ...safeItem,
                _firstSeenBelt: belt
              });
            }
          });
        });
      });
      
      // Second pass: build cumulative syllabus per belt
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
      });
      
      return cumulative;
      
    } catch (error) {
      console.error('Error in createCumulativeSyllabus:', error);
      return cumulative;
    }
  }, [beltOrder]); // Only depends on beltOrder which is stable

  const fetchSyllabus = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/syllabus/junior'); // Note: Update your backend to support this endpoint
      const syllabusData = response.data;
      setSyllabus(syllabusData);
      
      // Create and set cumulative syllabus data
      const cumulative = createCumulativeSyllabus(syllabusData);
      setCumulativeSyllabus(cumulative);
    } catch (error) {
      console.error('Error fetching junior syllabus:', error);
      setError('Error loading junior syllabus data');
    } finally {
      setLoading(false);
    }
  }, [createCumulativeSyllabus]); // Include createCumulativeSyllabus as a dependency

  useEffect(() => {
    fetchSyllabus();
  }, [fetchSyllabus]); // fetchSyllabus is stable and doesn't need to be in deps

  // Filter belts based on search term
  const filteredBelts = beltOrder.filter(belt => {
    if (selectedBelt !== 'all' && belt !== selectedBelt) return false;
    
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const beltData = cumulativeSyllabus[belt];
    
    if (!beltData) return false;
    
    // Check if any item in this belt matches the search term
    return Object.values(beltData).some(items => 
      items.some(item => 
        (item.traditional && item.traditional.toLowerCase().includes(searchLower)) ||
        (item.english && item.english.toLowerCase().includes(searchLower)) ||
        (item.notes && item.notes.toLowerCase().includes(searchLower))
      )
    );
  });

  if (loading) {
    return <div className="loading">Loading Junior Syllabus...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

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
            {beltOrder.map(belt => (
              <option key={belt} value={belt}>{belt}</option>
            ))}
          </select>
        </div>
      </div>
      
      <main className="belt-container">
        {filteredBelts.map((belt) => (
          <JuniorBeltSection
            key={belt}
            belt={belt}
            categories={syllabus[belt] || {}}
            cumulativeCategories={cumulativeSyllabus[belt] || {}}
            isExpanded={!!expandedBelts[belt]}
            onToggleExpand={() => toggleBeltExpand(belt)}
            searchTerm={searchTerm}
            isVisible={true}
          />
        ))}
      </main>
    </div>
  );
}

export default JuniorSyllabus;

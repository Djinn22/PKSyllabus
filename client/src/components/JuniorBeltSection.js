import React, { useState } from 'react';
import PublicCategorySection from './PublicCategorySection';

const JuniorBeltSection = ({ belt, categories, cumulativeCategories, isExpanded, onToggleExpand, searchTerm, isVisible }) => {
  const [isExpandedState, setIsExpanded] = useState(isExpanded);

  // Get belt color based on belt name (same as PublicBeltSection)
  const getBeltColor = (beltName) => {
    const beltColors = {
      'Red Belt': {
        background: 'linear-gradient(135deg, #dc7373 0%, #c85a5a 100%)',
        hover: 'linear-gradient(135deg, #d66666 0%, #c24d4d 100%)'
      },
      'Yellow Belt': {
        background: 'linear-gradient(135deg, #f4d03f 0%, #f1c40f 100%)',
        hover: 'linear-gradient(135deg, #f2ca2e 0%, #e8b800 100%)'
      },
      'Orange Belt': {
        background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
        hover: 'linear-gradient(135deg, #f08c00 0%, #d35400 100%)'
      },
      'Green Belt': {
        background: 'linear-gradient(135deg, #58d68d 0%, #27ae60 100%)',
        hover: 'linear-gradient(135deg, #4dd080 0%, #229954 100%)'
      },
      'Blue Belt': {
        background: 'linear-gradient(135deg, #5dade2 0%, #3498db 100%)',
        hover: 'linear-gradient(135deg, #52a3dd 0%, #2e86c1 100%)'
      },
      'Purple Belt': {
        background: 'linear-gradient(135deg, #af7ac5 0%, #9b59b6 100%)',
        hover: 'linear-gradient(135deg, #a569bd 0%, #8e44ad 100%)'
      },
      'Brown Belt': {
        background: 'linear-gradient(135deg, #b7950b 0%, #a0522d 100%)',
        hover: 'linear-gradient(135deg, #a68a0a 0%, #8b4513 100%)'
      },
      'Black Belt': {
        background: 'linear-gradient(135deg, #566573 0%, #2c3e50 100%)',
        hover: 'linear-gradient(135deg, #4a5a6b 0%, #273746 100%)'
      },
      'Brown/Black Stripe': {
        background: 'linear-gradient(135deg, #b7950b 0%, #a0522d 100%)',
        hover: 'linear-gradient(135deg, #a68a0a 0%, #8b4513 100%)',
        isStriped: true
      },
      'White Belt': {
        background: 'linear-gradient(135deg, #d5d8dc 0%, #aeb6bf 100%)',
        hover: 'linear-gradient(135deg, #ccd1d6 0%, #a3acb5 100%)'
      }
    };

    return beltColors[beltName] || {
      background: 'linear-gradient(135deg, #85929e 0%, #5d6d7e 100%)',
      hover: 'linear-gradient(135deg, #7b8794 0%, #566573 100%)'
    };
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpandedState);
    onToggleExpand();
  };

  const getTotalItems = () => {
    return Object.values(categories).reduce((total, items) => {
      return total + (Array.isArray(items) ? items.length : 0);
    }, 0);
  };

  const getCategoryCount = () => {
    return Object.keys(categories).length;
  };

  const beltColor = getBeltColor(belt);
  const categoriesToDisplay = cumulativeCategories || categories;
  
  // Process categories for display
  const filteredCategories = [];
  
  try {
    // Get all unique categories
    const allCategories = new Set([
      ...Object.keys(categoriesToDisplay || {}),
      ...Object.keys(categories || {})
    ]);
    
    // Process each category
    allCategories.forEach(category => {
      try {
        // Get items for this category
        const items = categoriesToDisplay[category] || [];
        const processedItems = Array.isArray(items) ? items : [items];
        
        // Filter items based on search term if provided
        const filteredItems = searchTerm
          ? processedItems.filter(item => {
              if (!item) return false;
              const searchLower = searchTerm.toLowerCase();
              return (
                (item.traditional && item.traditional.toLowerCase().includes(searchLower)) ||
                (item.english && item.english.toLowerCase().includes(searchLower)) ||
                (item.notes && item.notes.toLowerCase().includes(searchLower))
              );
            })
          : processedItems;
        
        // Ensure items have the required structure
        const processedCategoryItems = filteredItems.map(item => ({
          ...item,
          traditional: item.traditional || '',
          english: item.english || item.name || '',
          isCurrentBelt: belt === 'Red Belt' ? true : (item.isCurrentBelt !== false),
          _originBelt: item._originBelt || belt,
          _id: item._id || `${belt}-${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));
        
        // Always include the category for the first belt, even if empty
        if (belt === 'Red Belt' || processedCategoryItems.length > 0) {
          const categoryData = {
            name: category,
            items: processedCategoryItems,
            hasCurrentBeltItems: processedCategoryItems.some(item => item.isCurrentBelt)
          };
          
          filteredCategories.push(categoryData);
        }
      } catch (error) {
        console.error(`Error processing category ${category}:`, error);
      }
    });
    
  } catch (error) {
    console.error(`Error processing categories for belt ${belt}:`, error);
  }

  return (
    <div className={`public-belt-section junior-belt ${isExpandedState ? 'expanded' : ''} ${!isVisible ? 'hidden' : ''}`}>
      <div 
        className="belt-header junior-belt-header" 
        onClick={toggleExpanded}
        style={{
          background: beltColor.background,
          '--hover-bg': beltColor.hover,
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          borderRadius: isExpandedState ? '8px 8px 0 0' : '8px',
          marginBottom: isExpandedState ? 0 : '1rem',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}
      >
        {/* White stripe for junior belts */}
        <div className="junior-stripe" style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '37.5%', // Position the stripe in the middle (50% - 25%/2)
          height: '25%',
          backgroundColor: 'white',
          opacity: 0.8
        }}></div>
        
        {beltColor.isStriped && (
          <div className="stripe-overlay" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.2) 10px, rgba(0,0,0,0.2) 20px)'
          }}></div>
        )}
        <div className="belt-header-content" style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          color: '#000000',
          textShadow: '0 0 3px rgba(255,255,255,0.7)'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '1.6rem',
            fontWeight: 600,
            letterSpacing: '0.5px',
            color: '#000000'
          }}>
            {belt}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span className="item-count" style={{
              backgroundColor: 'rgba(0,0,0,0.2)',
              padding: '0.35rem 1rem',
              borderRadius: '1.5rem',
              fontSize: '0.95rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#000000'
            }}>
              <span>{getCategoryCount()} categories</span>
              <span style={{ opacity: 0.7 }}>•</span>
              <span>{getTotalItems()} items</span>
            </span>
            <span style={{ 
              fontSize: '1.4rem',
              fontWeight: 'bold',
              color: '#000000',
              lineHeight: 1,
              marginTop: '-2px'
            }}>
              {isExpandedState ? '−' : '+'}
            </span>
          </div>
        </div>
      </div>
      
      {isExpandedState && (
        <div className="belt-content" style={{
          padding: '1rem',
          border: '1px solid #e1e1e1',
          borderTop: 'none',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
          backgroundColor: '#fff',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
        }}>
          {filteredCategories.length > 0 ? (
            filteredCategories.map((categoryData, index) => (
              <PublicCategorySection
                key={`${belt}-${categoryData.name}-${index}`}
                category={categoryData.name}
                items={categoryData.items}
                currentBelt={belt}
                searchTerm={searchTerm}
              />
            ))
          ) : (
            <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
              No items found for this belt.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default JuniorBeltSection;

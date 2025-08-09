import React, { useState } from 'react';
import PublicCategorySection from './PublicCategorySection';

const PublicBeltSection = ({ belt, categories, cumulativeCategories, isExpanded, onToggleExpand, searchTerm, isVisible }) => {
  const [isExpandedState, setIsExpanded] = useState(isExpanded);

  // Get belt color based on belt name
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
        background: '#8B4513', // Solid brown color
        hover: '#7a3b0f' // Slightly darker brown on hover
      },
      'Black Belt': {
        background: 'linear-gradient(135deg, #566573 0%, #2c3e50 100%)',
        hover: 'linear-gradient(135deg, #4a5a6b 0%, #273746 100%)'
      },
      'Brown/Black Stripe': {
        background: 'linear-gradient(to bottom, #8B4513 0%, #8B4513 37.5%, #000000 37.5%, #000000 62.5%, #8B4513 62.5%, #8B4513 100%)',
        hover: 'linear-gradient(to bottom, #7a3b0f 0%, #7a3b0f 37.5%, #000000 37.5%, #000000 62.5%, #7a3b0f 62.5%, #7a3b0f 100%)',
        textColor: '#ffffff' // Ensure text is readable on the black stripe
      },
      'White Belt': {
        background: 'linear-gradient(135deg, #d5d8dc 0%, #aeb6bf 100%)',
        hover: 'linear-gradient(135deg, #ccd1d6 0%, #a3acb5 100%)'
      }
    };

    // Default color for unknown belts
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
  
  // Use cumulative categories if available, otherwise fall back to regular categories
  const categoriesToDisplay = cumulativeCategories || categories;
  
  // Process categories for display
  const filteredCategories = [];
  
  try {
    // Get all unique categories from both sources
    const allCategories = new Set([
      ...Object.keys(categories || {}),
      ...Object.keys(cumulativeCategories || {})
    ]);
    
    // Process each category
    allCategories.forEach(category => {
      try {
        // For the first belt, always include all categories even if empty
        const shouldForceInclude = belt === 'Red Belt';
        
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
        if (shouldForceInclude || processedCategoryItems.length > 0) {
          const categoryData = {
            name: category,
            items: processedCategoryItems,
            hasCurrentBeltItems: processedCategoryItems.some(item => item.isCurrentBelt)
          };
          filteredCategories.push(categoryData);
        }
      } catch (error) {
        // Removed console.error statement
      }
    });
    
    // Maintain original category order (don't sort alphabetically)
  } catch (error) {
    // Removed console.error statement
  }

  return (
    <div className={`public-belt-section ${isExpandedState ? 'expanded' : ''} ${!isVisible ? 'hidden' : ''}`}>
      <div 
        className="belt-header" 
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
          color: beltColor.textColor || '#fff',
          textShadow: beltColor.textColor === '#000000' ? '0 0 3px rgba(255,255,255,0.7)' : '1px 1px 2px rgba(0,0,0,0.5)'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '1.6rem',
            fontWeight: 600,
            letterSpacing: '0.5px'
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
              gap: '0.5rem'
            }}>
              <span>{getCategoryCount()} categories</span>
              <span style={{ opacity: 0.7 }}>•</span>
              <span>{getTotalItems()} items</span>
            </span>
            <span className="expand-icon" style={{
              transition: 'transform 0.3s ease',
              transform: isExpandedState ? 'rotate(180deg)' : 'rotate(0)',
              fontSize: '0.8rem',
              opacity: 0.8
            }}>▼</span>
          </div>
        </div>
      </div>
      
      <div className="belt-content" style={{
        maxHeight: isExpandedState ? '5000px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: '#fff',
        borderLeft: '1px solid #e0e0e0',
        borderRight: '1px solid #e0e0e0',
        borderBottom: '1px solid #e0e0e0',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
        padding: isExpandedState ? '1.5rem' : '0',
        boxSizing: 'border-box',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        {filteredCategories.length > 0 ? (
          <div className="category-list" style={{
            display: 'grid',
            gap: '2rem',
            marginTop: '0.5rem'
          }}>
            {filteredCategories.map(({ name, items }) => (
              <PublicCategorySection
                key={name}
                category={name}
                items={items}
                searchTerm={searchTerm}
                currentBelt={belt}
              />
            ))}
          </div>
        ) : (
          <div className="no-results" style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            color: '#666',
            fontStyle: 'italic',
            fontSize: '1.1rem',
            backgroundColor: '#f9f9f9',
            borderRadius: '6px',
            border: '1px dashed #e0e0e0'
          }}>
            {searchTerm ? (
              <>
                <p style={{ margin: '0 0 1rem' }}>No matching items found for "{searchTerm}"</p>
                <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.8 }}>
                  Try a different search term or check back later.
                </p>
              </>
            ) : (
              <p style={{ margin: 0 }}>No items available for this belt.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicBeltSection;

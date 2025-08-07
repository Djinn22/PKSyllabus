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
  
  // Debug logging
  console.log('Belt:', belt, 'Color:', beltColor);

  // Use cumulative categories if available, otherwise fall back to regular categories
  const displayCategories = Object.keys(cumulativeCategories).length > 0 ? cumulativeCategories : categories;
  
  // Filter categories to only include those that match search term if provided
  const filteredCategories = searchTerm
    ? Object.entries(displayCategories).filter(([category, items]) => {
        // Check if any item in this category matches the search term
        return items.some(item => 
          (item.traditional && item.traditional.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.english && item.english.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      })
    : Object.entries(displayCategories);

  return (
    <div className="public-belt-section">
      <div 
        className={`public-belt-header ${beltColor.isStriped ? 'striped-belt' : ''}`}
        onClick={toggleExpanded}
        style={{
          background: beltColor.background,
          '--hover-background': beltColor.hover
        }}
      >
        <div>
          <h2>{belt}</h2>
          <div className="belt-stats">
            {getCategoryCount()} categories • {getTotalItems()} techniques
          </div>
        </div>
        <span className={`expand-icon ${isExpandedState ? 'expanded' : ''}`}>
          ▶
        </span>
      </div>
      
      {isExpandedState && (
        <div className="public-belt-content">
          {filteredCategories.map(([category, items]) => (
            <PublicCategorySection
              key={category}
              category={category}
              items={items}
              searchTerm={searchTerm}
              isCurrentBelt={isVisible}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicBeltSection;

import React, { useState } from 'react';
import CategorySection from './CategorySection';

const BeltSection = ({ belt, categories, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCategoryUpdate = (category, newData) => {
    onUpdate(belt, category, newData);
  };

  const getTotalItems = () => {
    return Object.values(categories).reduce((total, items) => {
      return total + (Array.isArray(items) ? items.length : 0);
    }, 0);
  };

  return (
    <div className="belt-section">
      <div className="belt-header" onClick={toggleExpanded}>
        <div>
          <h2 style={{ margin: 0 }}>{belt}</h2>
          <span className="belt-count">
            {Object.keys(categories).length} categories, {getTotalItems()} total items
          </span>
        </div>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
          ▶
        </span>
      </div>
      
      {isExpanded && (
        <div className="belt-content">
          {Object.entries(categories).map(([category, items]) => (
            <CategorySection
              key={category}
              belt={belt}
              category={category}
              items={items}
              onUpdate={handleCategoryUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BeltSection;

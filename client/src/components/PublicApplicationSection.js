import React, { useMemo } from 'react';
import PublicApplicationBlock from './PublicApplicationBlock';

const PublicApplicationSection = ({ items = [], searchTerm = '', currentBelt = '' }) => {
  // Process and group items by subCategory
  const { groupedItems, hasSubCategories } = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) {
      return { groupedItems: {}, hasSubCategories: false };
    }

    const groups = items.reduce((acc, item, index) => {
      if (!item) return acc;
      
      // Handle both subCategory and category properties
      const subCat = item.subCategory || item.category || 'main';
      
      if (!acc[subCat]) {
        acc[subCat] = [];
      }
      
      acc[subCat].push({ 
        ...item, 
        originalIndex: index,
        // Ensure isCurrentBelt is always a boolean
        isCurrentBelt: item.isCurrentBelt !== false
      });
      
      return acc;
    }, {});

    // Check if we have any subcategories (other than 'main')
    const hasSubs = Object.keys(groups).some(key => key !== 'main');
    
    return { groupedItems: groups, hasSubCategories: hasSubs };
  }, [items]);

  // Handle empty state
  if (!items || items.length === 0) {
    return (
      <div style={{
        padding: '1.5rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#6c757d',
        border: '1px dashed #dee2e6'
      }}>
        <p style={{ margin: 0 }}>No items available for this category.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {Object.entries(groupedItems).map(([subCategory, subItems]) => (
        <div 
          key={subCategory} 
          style={{
            marginBottom: hasSubCategories ? '1.5rem' : '0.5rem',
            border: hasSubCategories ? '1px solid #e9ecef' : 'none',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: hasSubCategories ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
          }}
        >
          {subCategory !== 'main' && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #e9ecef',
              fontWeight: '600',
              color: '#495057',
              fontSize: '1.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>{subCategory}</span>
              <span style={{
                fontSize: '0.8em',
                backgroundColor: '#e9ecef',
                color: '#495057',
                padding: '0.1em 0.5em',
                borderRadius: '10px',
                fontWeight: 'normal'
              }}>
                {subItems.length} item{subItems.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          
          <div style={{
            display: 'grid',
            gap: '0.5rem',
            padding: hasSubCategories ? '1rem' : '0'
          }}>
            {subItems.map((item, index) => (
              <PublicApplicationBlock
                key={`${subCategory}-${index}-${item.originalIndex || index}`}
                item={item}
                searchTerm={searchTerm}
                isCurrentBelt={item.isCurrentBelt}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PublicApplicationSection;

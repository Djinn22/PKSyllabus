import React from 'react';
import PublicApplicationBlock from './PublicApplicationBlock';

const PublicApplicationSection = ({ items, searchTerm, currentBelt }) => {
  if (!items || items.length === 0) {
    return (
      <div className="public-app-block">
        <p>No items available for this category.</p>
      </div>
    );
  }

  // Group items by subCategory
  const groupedItems = items.reduce((groups, item, index) => {
    const subCat = item.subCategory || 'main';
    if (!groups[subCat]) {
      groups[subCat] = [];
    }
    groups[subCat].push({ ...item, originalIndex: index });
    return groups;
  }, {});

  return (
    <div>
      {Object.entries(groupedItems).map(([subCategory, subItems]) => (
        <div key={subCategory} className={subCategory !== 'main' ? 'public-subcategory' : ''}>
          {subCategory !== 'main' && (
            <div className="public-subcategory-title">{subCategory}</div>
          )}
          
          {subItems.map((item, index) => (
            <PublicApplicationBlock
              key={`${subCategory}-${index}`}
              item={item}
              searchTerm={searchTerm}
              isCurrentBelt={item.isCurrentBelt}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default PublicApplicationSection;

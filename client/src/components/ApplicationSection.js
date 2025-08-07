import React, { useState } from 'react';
import ApplicationBlock from './ApplicationBlock';

const ApplicationSection = ({ belt, category, items, onUpdate }) => {
  const [newItem, setNewItem] = useState({
    name: '',
    requirements: '',
    subCategory: ''
  });

  // Group items by subCategory
  const groupedItems = items.reduce((groups, item, index) => {
    const subCat = item.subCategory || 'main';
    if (!groups[subCat]) {
      groups[subCat] = [];
    }
    groups[subCat].push({ ...item, originalIndex: index });
    return groups;
  }, {});

  const handleItemUpdate = (originalIndex, updatedItem) => {
    const updatedItems = [...items];
    updatedItems[originalIndex] = updatedItem;
    onUpdate(updatedItems);
  };

  const handleItemRemove = (originalIndex) => {
    const updatedItems = items.filter((_, i) => i !== originalIndex);
    onUpdate(updatedItems);
  };

  const handleAddItem = (subCategory = '') => {
    if (newItem.name.trim()) {
      const item = {
        name: newItem.name.trim(),
        requirements: newItem.requirements
          .split('\n')
          .map(req => req.trim())
          .filter(req => req.length > 0)
      };
      
      if (subCategory) {
        item.subCategory = subCategory;
      }
      
      onUpdate([...items, item]);
      setNewItem({ name: '', requirements: '', subCategory: '' });
    }
  };

  return (
    <div>
      {Object.entries(groupedItems).map(([subCategory, subItems]) => (
        <div key={subCategory} className={subCategory !== 'main' ? 'subcategory' : ''}>
          {subCategory !== 'main' && (
            <div className="subcategory-header">{subCategory}</div>
          )}
          
          {subItems.map((item) => (
            <ApplicationBlock
              key={item.originalIndex}
              item={item}
              onUpdate={(updatedItem) => handleItemUpdate(item.originalIndex, updatedItem)}
              onRemove={() => handleItemRemove(item.originalIndex)}
            />
          ))}
          
          {/* Add new item form for this subcategory */}
          <div className="app-block">
            <input
              type="text"
              placeholder="Item name"
              value={subCategory === 'main' ? newItem.name : ''}
              onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
            />
            <textarea
              placeholder="Requirements (one per line)"
              value={subCategory === 'main' ? newItem.requirements : ''}
              onChange={(e) => setNewItem(prev => ({ ...prev, requirements: e.target.value }))}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleAddItem(subCategory === 'main' ? '' : subCategory)}
            >
              Add {subCategory === 'main' ? 'Item' : `to ${subCategory}`}
            </button>
          </div>
        </div>
      ))}
      
      {/* Add new subcategory section */}
      {Object.keys(groupedItems).length > 1 && (
        <div className="subcategory">
          <div className="subcategory-header">Add New Subcategory</div>
          <div className="app-block">
            <input
              type="text"
              placeholder="Subcategory name"
              value={newItem.subCategory}
              onChange={(e) => setNewItem(prev => ({ ...prev, subCategory: e.target.value }))}
            />
            <input
              type="text"
              placeholder="Item name"
              value={newItem.name}
              onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
            />
            <textarea
              placeholder="Requirements (one per line)"
              value={newItem.requirements}
              onChange={(e) => setNewItem(prev => ({ ...prev, requirements: e.target.value }))}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleAddItem(newItem.subCategory)}
            >
              Add New Subcategory Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationSection;

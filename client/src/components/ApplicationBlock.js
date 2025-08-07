import React, { useState } from 'react';

const ApplicationBlock = ({ item, onUpdate, onRemove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState({
    name: item.name || '',
    requirements: (item.requirements || []).join('\n'),
    subCategory: item.subCategory || ''
  });

  const handleSave = () => {
    const updatedItem = {
      name: editedItem.name.trim(),
      requirements: editedItem.requirements
        .split('\n')
        .map(req => req.trim())
        .filter(req => req.length > 0)
    };
    
    if (editedItem.subCategory.trim()) {
      updatedItem.subCategory = editedItem.subCategory.trim();
    }
    
    onUpdate(updatedItem);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedItem({
      name: item.name || '',
      requirements: (item.requirements || []).join('\n'),
      subCategory: item.subCategory || ''
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="app-block">
        <input
          type="text"
          value={editedItem.name}
          onChange={(e) => setEditedItem(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Item name"
        />
        {item.subCategory && (
          <input
            type="text"
            value={editedItem.subCategory}
            onChange={(e) => setEditedItem(prev => ({ ...prev, subCategory: e.target.value }))}
            placeholder="Subcategory"
          />
        )}
        <textarea
          value={editedItem.requirements}
          onChange={(e) => setEditedItem(prev => ({ ...prev, requirements: e.target.value }))}
          placeholder="Requirements (one per line)"
        />
        <div>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
          <button type="button" className="btn" onClick={handleCancel} style={{ marginLeft: '10px' }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-block">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 10px 0' }}>{item.name}</h4>
          {item.requirements && item.requirements.length > 0 && (
            <ul style={{ margin: '0 0 10px 20px', paddingLeft: '0' }}>
              {item.requirements.map((req, index) => (
                <li key={index} style={{ marginBottom: '5px' }}>{req}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => setIsEditing(true)}
            style={{ marginRight: '10px' }}
          >
            Edit
          </button>
          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationBlock;

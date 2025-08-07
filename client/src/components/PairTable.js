import React, { useState } from 'react';

const PairTable = ({ belt, category, items, onUpdate }) => {
  const [newTraditional, setNewTraditional] = useState('');
  const [newEnglish, setNewEnglish] = useState('');

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    onUpdate(updatedItems);
  };

  const handleAddItem = () => {
    if (newTraditional.trim() || newEnglish.trim()) {
      const newItem = {
        traditional: newTraditional.trim(),
        english: newEnglish.trim()
      };
      onUpdate([...items, newItem]);
      setNewTraditional('');
      setNewEnglish('');
    }
  };

  const handleRemoveItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onUpdate(updatedItems);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  return (
    <table className="pair-table">
      <thead>
        <tr>
          <th>Traditional Name</th>
          <th>English Name</th>
          <th style={{ width: '100px' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={index}>
            <td>
              <input
                type="text"
                value={item.traditional || ''}
                onChange={(e) => handleItemChange(index, 'traditional', e.target.value)}
                placeholder="Traditional name"
              />
            </td>
            <td>
              <input
                type="text"
                value={item.english || ''}
                onChange={(e) => handleItemChange(index, 'english', e.target.value)}
                placeholder="English name"
              />
            </td>
            <td>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleRemoveItem(index)}
              >
                Remove
              </button>
            </td>
          </tr>
        ))}
        <tr className="add-row">
          <td>
            <input
              type="text"
              value={newTraditional}
              onChange={(e) => setNewTraditional(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add traditional name"
            />
          </td>
          <td>
            <input
              type="text"
              value={newEnglish}
              onChange={(e) => setNewEnglish(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add english name"
            />
          </td>
          <td>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddItem}
            >
              Add
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default PairTable;

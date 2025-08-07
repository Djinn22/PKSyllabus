import React from 'react';

const PublicApplicationBlock = ({ item, searchTerm, isCurrentBelt }) => {
  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="highlight">{part}</span>
      ) : part
    );
  };

  // Apply bold style if this is the current belt's technique
  const blockStyle = {
    fontWeight: isCurrentBelt ? 'bold' : 'normal',
    marginBottom: '1rem',
    padding: '0.5rem',
    borderLeft: isCurrentBelt ? '3px solid #4a5568' : '1px solid #e2e8f0',
    backgroundColor: isCurrentBelt ? '#f8fafc' : 'transparent',
    borderRadius: '0.25rem'
  };

  return (
    <div className="public-app-block" style={blockStyle}>
      <h4>{highlightText(item.name || '', searchTerm)}</h4>
      {item.requirements && item.requirements.length > 0 && (
        <ul>
          {item.requirements.map((req, index) => (
            <li key={index}>
              {highlightText(req, searchTerm)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PublicApplicationBlock;

import React from 'react';

const PublicPairTable = ({ items, searchTerm, currentBelt }) => {
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

  if (!items || items.length === 0) {
    return (
      <div className="public-app-block">
        <p>No items available for this category.</p>
      </div>
    );
  }

  return (
    <table className="public-pair-table">
      <thead>
        <tr>
          <th>Traditional Name</th>
          <th>English Name</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => {
          // If isCurrentBelt is true, show in bold, otherwise regular weight
          const textWeight = item.isCurrentBelt ? 'bold' : 'normal';
          
          return (
            <tr key={index} style={{ fontWeight: textWeight }}>
              <td>
                {highlightText(item.traditional || '', searchTerm)}
              </td>
              <td>
                {highlightText(item.english || '', searchTerm)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default PublicPairTable;

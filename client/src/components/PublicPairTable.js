import React from 'react';

const PublicPairTable = ({ items, searchTerm, currentBelt }) => {
  const highlightText = (text, term) => {
    if (!text) return '';
    if (!term) return text;
    
    try {
      const regex = new RegExp(`(${term})`, 'gi');
      return text.split(regex).map((part, i) => 
        regex.test(part) ? <mark key={i}>{part}</mark> : part
      );
    } catch (e) {
      console.warn('Error in highlightText:', e);
      return text;
    }
  };

  if (!items || items.length === 0) {
    return <div className="no-items">No items to display</div>;
  }

  // Debug logging removed for production

  return (
    <table className="public-pair-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        {items.map((item, index) => {
          // Default to true if isCurrentBelt is not set
          const isCurrent = item.isCurrentBelt !== false; // Default to true if not set
          
          return (
            <tr 
              key={`${item.traditional}-${item.english}-${index}`}
              style={{ 
                fontWeight: isCurrent ? 'bold' : 'normal',
                backgroundColor: isCurrent ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                borderBottom: '1px solid #eee',
                transition: 'background-color 0.2s'
              }}
              title={`From: ${item._originBelt || 'Previous belt'}`}
              className={isCurrent ? 'current-belt-item' : 'previous-belt-item'}
            >
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                {item.traditional ? highlightText(item.traditional, searchTerm) : '-'}
              </td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                {item.english ? highlightText(item.english, searchTerm) : '-'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default PublicPairTable;

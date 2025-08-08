import React, { useEffect } from 'react';
import PublicPairTable from './PublicPairTable';
import PublicApplicationSection from './PublicApplicationSection';

const PublicCategorySection = ({ category, items = [], searchTerm = '', currentBelt = '' }) => {
  // Normalize category name by removing any extra spaces or slashes
  const normalizedCategory = category.replace(/\s*\/\s*/g, ' / ').trim();
  
  // Split the category into individual category names if it's a combined category
  const categoryNames = normalizedCategory.split(' / ').map(cat => cat.trim());
  
  // Check if any of the categories in the combined name are pair categories
  const isPairCategory = [
    'Stances', 'Punches and Strikes', 'Blocks', 'Kicks', 'Kata', 
    'Basic Drills', 'Fighting Drills'
  ].some(cat => categoryNames.includes(cat));

  // Check if any of the categories in the combined name are application categories
  const isApplicationCategory = [
    'Application', 'Demonstration', 'Impact'
  ].some(cat => categoryNames.includes(cat));
  
  // If it's a combined category, we'll need to process items differently
  const isCombinedCategory = categoryNames.length > 1;

  // Debug: Log category and items
  useEffect(() => {
    console.group(`Category: ${category} (${currentBelt})`);
    console.log('Items count:', items.length);
    console.log('Items with isCurrentBelt:', items.filter(i => i?.isCurrentBelt).length);
    console.groupEnd();
  }, [category, items, currentBelt]);

  // Process items to ensure consistent structure
  const processedItems = (items || [])
    .filter(Boolean) // Remove any null/undefined items
    .map(item => {
      // Ensure item has required fields and defaults
      const processedItem = {
        traditional: item.traditional || '',
        english: item.english || '',
        isCurrentBelt: item.isCurrentBelt !== false, // Default to true if not set
        _originBelt: item._originBelt || currentBelt || 'unknown',
        ...item // Spread any additional properties
      };
      
      return processedItem;
    });

  // Debug: Log first few processed items
  useEffect(() => {
    if (processedItems.length > 0) {
      console.group(`Processed Items (${category}):`);
      processedItems.slice(0, 3).forEach((item, i) => {
        console.log(`Item ${i}:`, {
          traditional: item.traditional,
          english: item.english,
          isCurrentBelt: item.isCurrentBelt,
          originBelt: item._originBelt
        });
      });
      console.groupEnd();
    }
  }, [category, processedItems]);

  // Process items for combined categories
  const processCombinedCategoryItems = (items, categoryName) => {
    return items.filter(item => {
      // If the item has a subCategory, check if it matches any of our category names
      if (item.subCategory) {
        return categoryNames.some(cat => 
          item.subCategory.toLowerCase().includes(cat.toLowerCase())
        );
      }
      // If no subCategory, include it if it's in the main category
      return categoryNames.some(cat => 
        item.category?.toLowerCase().includes(cat.toLowerCase())
      );
    });
  };

  // Get the appropriate items based on category type
  const getItemsToRender = () => {
    if (isCombinedCategory) {
      return processCombinedCategoryItems(processedItems, category);
    }
    return processedItems;
  };

  const itemsToRender = getItemsToRender();

  return (
    <div className="public-category-section" style={{ marginBottom: '2rem' }}>
      <h3 className="public-category-title" style={{
        color: '#333',
        borderBottom: '2px solid #eee',
        paddingBottom: '0.5rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {normalizedCategory}
        {isCombinedCategory && (
          <span style={{
            fontSize: '0.8em',
            backgroundColor: '#e3f2fd',
            color: '#0d47a1',
            padding: '0.2em 0.5em',
            borderRadius: '4px',
            fontWeight: 'normal',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25em'
          }}>
            Combined Category
          </span>
        )}
      </h3>
      
      {isPairCategory && (
        <div className="pair-table-container">
          <PublicPairTable
            items={itemsToRender}
            searchTerm={searchTerm}
            currentBelt={currentBelt}
          />
        </div>
      )}
      
      {isApplicationCategory && (
        <div className="application-container">
          <PublicApplicationSection
            items={itemsToRender}
            searchTerm={searchTerm}
            currentBelt={currentBelt}
          />
        </div>
      )}
      
      {!isPairCategory && !isApplicationCategory && (
        <div className="unsupported-category" style={{
          backgroundColor: '#fff8e1',
          padding: '1rem',
          borderRadius: '4px',
          borderLeft: '4px solid #ffc107'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#e65100' }}>Unsupported Category</h4>
          <p style={{ margin: 0, color: '#5d4037' }}>
            The "{normalizedCategory}" category type is not yet supported in the public interface.
          </p>
          {isCombinedCategory && (
            <div style={{ marginTop: '0.5rem' }}>
              <p style={{ margin: '0.5rem 0', fontSize: '0.9em' }}>This appears to be a combined category. Try viewing the individual categories instead:</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {categoryNames.map((cat, idx) => (
                  <span key={idx} style={{
                    backgroundColor: '#e3f2fd',
                    color: '#0d47a1',
                    padding: '0.25em 0.5em',
                    borderRadius: '4px',
                    fontSize: '0.9em'
                  }}>
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicCategorySection;

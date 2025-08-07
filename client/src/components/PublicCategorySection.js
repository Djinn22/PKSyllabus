import React from 'react';
import PublicPairTable from './PublicPairTable';
import PublicApplicationSection from './PublicApplicationSection';

const PublicCategorySection = ({ category, items, searchTerm, currentBelt }) => {
  const isPairCategory = [
    'Stances', 'Punches and Strikes', 'Blocks', 'Kicks', 'Kata', 
    'Basic Drills', 'Fighting Drills'
  ].includes(category);

  const isApplicationCategory = [
    'Application', 'Demonstration', 'Impact'
  ].includes(category);

  return (
    <div className="public-category-section">
      <h3 className="public-category-title">{category}</h3>
      
      {isPairCategory && (
        <PublicPairTable
          items={items || []}
          searchTerm={searchTerm}
          currentBelt={currentBelt}
        />
      )}
      
      {isApplicationCategory && (
        <PublicApplicationSection
          items={items || []}
          searchTerm={searchTerm}
          currentBelt={currentBelt}
        />
      )}
      
      {!isPairCategory && !isApplicationCategory && (
        <div className="public-app-block">
          <h4>Unknown Category: {category}</h4>
          <p>This category type is not yet supported in the public interface.</p>
        </div>
      )}
    </div>
  );
};

export default PublicCategorySection;

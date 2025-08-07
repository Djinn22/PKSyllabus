import React from 'react';
import PairTable from './PairTable';
import ApplicationSection from './ApplicationSection';

const CategorySection = ({ belt, category, items, onUpdate }) => {
  const isPairCategory = [
    'Stances', 'Punches and Strikes', 'Blocks', 'Kicks', 'Kata', 
    'Basic Drills', 'Fighting Drills'
  ].includes(category);

  const isApplicationCategory = [
    'Application', 'Demonstration', 'Impact'
  ].includes(category);

  const handleUpdate = (newData) => {
    onUpdate(category, newData);
  };

  return (
    <div className="category-section">
      <h3 className="category-title">{category}</h3>
      
      {isPairCategory && (
        <PairTable
          belt={belt}
          category={category}
          items={items || []}
          onUpdate={handleUpdate}
        />
      )}
      
      {isApplicationCategory && (
        <ApplicationSection
          belt={belt}
          category={category}
          items={items || []}
          onUpdate={handleUpdate}
        />
      )}
      
      {!isPairCategory && !isApplicationCategory && (
        <div>
          <p>Unsupported category type: {category}</p>
          <pre>{JSON.stringify(items, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default CategorySection;

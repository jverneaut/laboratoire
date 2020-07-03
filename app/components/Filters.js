import React, { useState, useEffect } from 'react';

const Filters = ({ defaultFilterFunction, setFilterFunction, categories }) => {
  const sortFilters = [
    {
      name: 'Du plus récent au plus ancien',
      function: defaultFilterFunction,
    },
    {
      name: 'Du plus ancien au plus récent',
      function: (a, b) => (a.date < b.date ? -1 : 1),
    },
    {
      name: 'Ordre alphabétique',
      function: (a, b) => (a.name < b.name ? -1 : 1),
    },
    {
      name: 'Aléatoire',
      function: (a, b) => (Math.random() < 0.5 ? -1 : 1),
    },
  ];
  const [sortFiltersIndex, setSortFiltersIndex] = useState(0);
  const [categoriesIndices, setCategoriesIndices] = useState([]);

  useEffect(() => {
    const filterFunction = el =>
      categoriesIndices.length
        ? categoriesIndices
            .map(index => categories[index])
            .includes(el.category)
        : true;
    const sortFunction = sortFilters[sortFiltersIndex].function;

    setFilterFunction(() => arr =>
      arr.filter(filterFunction).sort(sortFunction)
    );
  }, [sortFiltersIndex, categoriesIndices]);

  return (
    <div className="filters">
      <div className="filters__group">
        <h3>Tri :</h3>
        <ul>
          {sortFilters.map((filter, index) => (
            <li key={filter.name}>
              <button
                onClick={() => setSortFiltersIndex(index)}
                className={index === sortFiltersIndex ? 'active' : ''}
              >
                {filter.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="filters__group">
        <h3>Catégories :</h3>
        <ul>
          <li>
            <button
              onClick={() => setCategoriesIndices([])}
              className={categoriesIndices.length ? '' : 'active'}
            >
              Toutes les catégories
            </button>
          </li>
          {categories.map((category, index) => (
            <li key={category}>
              <button
                className={categoriesIndices.includes(index) ? 'active' : ''}
                onClick={() =>
                  setCategoriesIndices(indices =>
                    indices.includes(index)
                      ? indices.filter(el => el !== index)
                      : [...indices, index]
                  )
                }
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Filters;

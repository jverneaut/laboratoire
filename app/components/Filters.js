import { use } from 'matter-js';
import React, { useState, useEffect } from 'react';
import slugify from '../utils/slugify';

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

  const getCategoryIndexBySlug = slug =>
    categories.map(category => slugify(category)).indexOf(slug);

  const [sortFiltersIndex, setSortFiltersIndex] = useState(0);
  const [categoriesIndex, setCategoriesIndex] = useState(undefined);

  useEffect(() => {
    const categoryIndexBySlug = getCategoryIndexBySlug(
      window.location.hash.replace(/#/g, '')
    );

    if (categoryIndexBySlug > -1) {
      setCategoriesIndex(categoryIndexBySlug);
    }
  }, []);

  useEffect(() => {
    const filterFunction = el =>
      categoriesIndex !== null && categoriesIndex !== undefined
        ? el.category === categories[categoriesIndex]
        : true;

    const sortFunction = sortFilters[sortFiltersIndex].function;

    setFilterFunction(() => arr =>
      arr.filter(filterFunction).sort(sortFunction)
    );
  }, [sortFiltersIndex, categoriesIndex]);

  useEffect(() => {
    if (categoriesIndex === undefined) return;

    if (categoriesIndex === null) {
      history.pushState('', document.title, window.location.pathname);
      return;
    }

    const slug = slugify(categories[categoriesIndex]);
    window.location.hash = slug;
  }, [categoriesIndex]);

  useEffect(() => {
    const handleHashChange = () => {
      const slug = window.location.hash.replace(/#/g, '');

      const categoryIndexBySlug = getCategoryIndexBySlug(slug);

      if (categoryIndexBySlug > -1) {
        setCategoriesIndex(categoryIndexBySlug);
      } else {
        setCategoriesIndex(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
              onClick={() => setCategoriesIndex(null)}
              className={
                categoriesIndex === null || categoriesIndex === undefined
                  ? 'active'
                  : ''
              }
            >
              Toutes les catégories
            </button>
          </li>
          {categories.map((category, index) => (
            <li key={category}>
              <button
                onClick={() => setCategoriesIndex(index)}
                className={index === categoriesIndex ? 'active' : ''}
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

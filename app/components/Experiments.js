import React, { useState, useEffect } from 'react';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';
import FlipMove from 'react-flip-move';
import { Link } from 'react-router-dom';

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const Experiments = ({ pages }) => {
  return (
    <FlipMove className="experiments" duration={350 + pages.length * 5}>
      {pages.map((page) => (
        <Link to={page.slug + '/'} className="experiment" key={page.slug}>
          <div className="experiment__img">
            {page.screenshot && (
              <img src={page.screenshot.src} loading="lazy" />
            )}
          </div>
          <div className="experiment__info">
            <h2 className="experiment__title">{page.name}</h2>
            <div className="experiment__date">
              {capitalize(
                formatDistance(new Date(page.date), Date.now(), {
                  addSuffix: true,
                  locale: fr,
                })
              )}
            </div>
          </div>
        </Link>
      ))}
    </FlipMove>
  );
};

export default Experiments;

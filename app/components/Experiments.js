import React from 'react';
import { formatDistance } from 'date-fns';

const Experiments = ({ pages }) => {
  return (
    <div className="experiments">
      {pages.map(page => (
        <a href={page.slug} key={page.slug} className="experiment">
          {page.screenshot && (
            <div className="experiment__img">
              <img src={page.screenshot} />
            </div>
          )}
          <div className="experiment__info">
            <h2 className="experiment__title">{page.name}</h2>
            <div className="experiment__date">
              {formatDistance(new Date(page.date), Date.now(), {
                addSuffix: true,
              })}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};

export default Experiments;

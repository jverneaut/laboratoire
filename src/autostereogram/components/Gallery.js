import React, { useState, useEffect } from 'react';
import { useDetectClickOutside } from 'react-detect-click-outside';

import gallery from '../gallery.json';

import chevronRight from '../assets/icons/chevron-right.svg';

const Gallery = ({
  seamlessImages,
  depthMapImages,
  setBackgroundImage,
  setDepthMapImage,
}) => {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const ref = useDetectClickOutside({ onTriggered: () => setOpen(false) });

  const flatBackgrounds = Object.keys(seamlessImages).reduce((acc, curr) => {
    return {
      ...acc,
      ...seamlessImages[curr].reduce((acc, curr) => {
        return {
          ...acc,
          [curr.slug]: curr,
        };
      }, {}),
    };
  }, {});

  const flatDepthMaps = Object.keys(depthMapImages).reduce((acc, curr) => {
    return {
      ...acc,
      ...depthMapImages[curr].reduce((acc, curr) => {
        return {
          ...acc,
          [curr.slug]: curr,
        };
      }, {}),
    };
  }, {});

  const prev = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  const next = () => {
    if (index < gallery.length - 1) {
      setIndex(index + 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        prev();
      } else if (e.key === 'ArrowRight') {
        next();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [index]);

  useEffect(() => {
    setBackgroundImage(flatBackgrounds[gallery[index].background]);
    setDepthMapImage(flatDepthMaps[gallery[index].depth]);
  }, [index]);

  return (
    <div className="gallery">
      <div className="gallery__toggle-container" ref={ref}>
        <button className="gallery__toggle" onClick={() => setOpen(!open)}>
          <div className="gallery__indicator">
            <div className="gallery__current">
              {(index + 1).toString().padStart(2, '0')}
            </div>
            <div className="gallery__separator">/</div>
            <div className="gallery__total">{gallery.length}</div>
          </div>

          <div className="gallery__title">{gallery[index].title}</div>
        </button>
        <div
          className={[
            'gallery__list',
            open ? 'gallery__list--open' : null,
          ].join(' ')}
        >
          {gallery.map((item, i) => (
            <div
              key={i}
              className={[
                'gallery__item',
                i === index ? 'gallery__item--selected' : null,
              ].join(' ')}
              onClick={() => {
                setIndex(i);
                setOpen(false);
              }}
            >
              <div
                className="gallery__thumbnail"
                style={{
                  backgroundImage: `url(${
                    flatBackgrounds[item.background].previewSrc
                  })`,
                }}
              ></div>
              <div className="gallery__item-title">{item.title}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="gallery__buttons">
        <button
          onClick={prev}
          className={[
            'gallery__button gallery__button--prev',
            index === 0 ? 'gallery__button--disabled' : null,
          ].join(' ')}
          disabled={index === 0}
        >
          <img src={chevronRight} alt="Prev" />
        </button>

        <button
          onClick={next}
          className={[
            'gallery__button gallery__button--next',
            index === gallery.length - 1 ? 'gallery__button--disabled' : null,
          ].join(' ')}
          disabled={index === gallery.length - 1}
        >
          <img src={chevronRight} alt="Next" />
        </button>
      </div>
    </div>
  );
};

export default Gallery;

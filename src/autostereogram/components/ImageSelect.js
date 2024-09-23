import React, { useState } from 'react';
import { useDetectClickOutside } from 'react-detect-click-outside';

import checkIcon from '../assets/icons/circle-check.svg';
import randomizeIcon from '../assets/icons/shuffle.svg';

const ImageSelect = ({
  images,
  flatImages,
  selectedSlug,
  selectedImage,
  setSelectedSlug,
  title,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useDetectClickOutside({ onTriggered: () => setOpen(false) });

  const selected = selectedImage || flatImages[selectedSlug];

  return (
    <div className="control" ref={ref}>
      <div className="control__current-container">
        <button className="control__current" onClick={() => setOpen(!open)}>
          <img
            className="control__current-image"
            src={selected.previewSrc}
            alt=""
          />

          <div className="control__current-title">
            <span>{title}</span>
            <h2>{selected.name}</h2>
          </div>
        </button>

        <button
          className="control__randomize"
          onClick={() =>
            setSelectedSlug(
              flatImages[
                Object.keys(flatImages)[
                  Math.floor(Math.random() * Object.keys(flatImages).length)
                ]
              ].slug
            )
          }
        >
          <img src={randomizeIcon} alt="" />
        </button>
      </div>

      <div
        className={['control__list', open ? 'control__list--open' : null].join(
          ' '
        )}
      >
        {Object.keys(images).map((category, index) => (
          <div className="control__category" key={index}>
            <div className="control__category-title">{category}</div>
            <div className="control__category-list">
              {images[category].map((image, index) => (
                <button
                  className={[
                    'control__button',
                    image.slug === selected.slug
                      ? 'control__button--selected'
                      : null,
                  ].join(' ')}
                  key={index}
                  onClick={() => setSelectedSlug(image.slug)}
                >
                  <img
                    className="control__image"
                    src={image.previewSrc}
                    alt=""
                  />
                  {image.slug === selected.slug && (
                    <img className="control__icon" src={checkIcon} />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageSelect;

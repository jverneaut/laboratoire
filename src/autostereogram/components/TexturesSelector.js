import React, { useState, useEffect } from 'react';
import ImageSelect from './ImageSelect';

import randomizeIcon from '../assets/icons/shuffle.svg';
import downloadIcon from '../assets/icons/download.svg';

import gallery from '../gallery.json';

const TexturesSelector = ({
  seamlessImages,
  depthMapImages,
  setBackgroundImage,
  setDepthMapImage,
  backgroundImage,
  depthMapImage,
}) => {
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

  const getRandomSlug = (array) =>
    array[
      Object.keys(array)[Math.floor(Math.random() * Object.keys(array).length)]
    ].slug;

  const [backgroundSlug, setBackgroundSlug] = useState(gallery[0].background);
  const [depthMapSlug, setDepthMapSlug] = useState(gallery[0].depth);

  useEffect(() => {
    setBackgroundImage(flatBackgrounds[backgroundSlug]);
  }, [backgroundSlug]);

  useEffect(() => {
    setDepthMapImage(flatDepthMaps[depthMapSlug]);
  }, [depthMapSlug]);

  return (
    <div className="controls">
      <ImageSelect
        images={seamlessImages}
        flatImages={flatBackgrounds}
        selectedImage={backgroundImage}
        selectedSlug={backgroundSlug}
        setSelectedSlug={setBackgroundSlug}
        title="Background image"
      />

      <ImageSelect
        images={depthMapImages}
        flatImages={flatDepthMaps}
        selectedImage={depthMapImage}
        selectedSlug={depthMapSlug}
        setSelectedSlug={setDepthMapSlug}
        title="Depth map"
      />

      <div
        className="button"
        onClick={() => {
          setBackgroundSlug(getRandomSlug(flatBackgrounds));
          setDepthMapSlug(getRandomSlug(flatDepthMaps));
        }}
      >
        <span>Randomize all</span>
        <img src={randomizeIcon} alt="" />
      </div>

      <div className="button button--white">
        <span>Download image</span>
        <img src={downloadIcon} alt="" />
      </div>
    </div>
  );
};

export default TexturesSelector;

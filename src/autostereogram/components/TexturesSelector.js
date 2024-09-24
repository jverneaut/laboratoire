import React, { useState, useEffect } from 'react';
import ImageSelect from './ImageSelect';

import randomizeIcon from '../assets/icons/shuffle.svg';
import downloadIcon from '../assets/icons/download.svg';

import gallery from '../gallery.json';

import { ReImg } from 'reimg';

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

  const downloadImage = () => {
    ReImg.fromCanvas(document.querySelector('canvas')).downloadPng(
      'autostereogram'
    );
  };

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

      <button
        className="button"
        onClick={() => {
          setBackgroundSlug(getRandomSlug(flatBackgrounds));
          setDepthMapSlug(getRandomSlug(flatDepthMaps));
        }}
      >
        <span>Randomize all</span>
        <img src={randomizeIcon} alt="" />
      </button>

      <button className="button button--white" onClick={downloadImage}>
        <span>Download image</span>
        <img src={downloadIcon} alt="" />
      </button>
    </div>
  );
};

export default TexturesSelector;

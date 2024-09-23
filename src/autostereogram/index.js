import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';

import './main.scss';

import texturesData from './textures.json';

const seamlessImages = Object.keys(texturesData.backgrounds).reduce(
  (acc, curr) => {
    const images = texturesData.backgrounds[curr].map((texture) => {
      return {
        name: texture.name,
        slug: texture.slug,

        src: require(`${texture.src}?size=800`).src,
        previewSrc: require(`${texture.src}?size=160`).src,

        width: require(`${texture.src}?size=800`).width,
        height: require(`${texture.src}?size=800`).height,
      };
    });

    return { ...acc, [curr]: images };
  },
  {}
);

const depthMapImages = Object.keys(texturesData.depthmaps).reduce(
  (acc, curr) => {
    const images = texturesData.depthmaps[curr].map((texture) => {
      return {
        name: texture.name,
        slug: texture.slug,

        src: require(`${texture.src}?size=800`).src,
        previewSrc: require(`${texture.src}?size=160`).src,

        width: require(`${texture.src}?size=800`).width,
        height: require(`${texture.src}?size=800`).height,
      };
    });

    return { ...acc, [curr]: images };
  },
  {}
);

ReactDOM.render(
  <App seamlessImages={seamlessImages} depthMapImages={depthMapImages} />,
  document.querySelector('#root')
);

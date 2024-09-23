import React, { useState } from 'react';

import TexturesSelector from './TexturesSelector';
import Stereogram from './Stereogram';
import ViewerControls from './ViewerControls';
import Gallery from './Gallery';

const App = ({ seamlessImages, depthMapImages }) => {
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [depthMapImage, setDepthMapImage] = useState(null);

  const [slices, setSlices] = useState(10);
  const [depth, setDepth] = useState(16);
  const [zoom, setZoom] = useState(10);

  return (
    <div className="main">
      <Gallery
        seamlessImages={seamlessImages}
        depthMapImages={depthMapImages}
        setBackgroundImage={setBackgroundImage}
        setDepthMapImage={setDepthMapImage}
      />

      <Stereogram
        backgroundImage={backgroundImage}
        depthMapImage={depthMapImage}
        slices={slices}
        depth={depth}
        zoom={zoom}
      />

      <TexturesSelector
        seamlessImages={seamlessImages}
        depthMapImages={depthMapImages}
        backgroundImage={backgroundImage}
        depthMapImage={depthMapImage}
        setBackgroundImage={setBackgroundImage}
        setDepthMapImage={setDepthMapImage}
      />
    </div>
  );
};

export default App;

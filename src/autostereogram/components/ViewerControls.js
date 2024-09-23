import React from 'react';

const ViewerControls = ({
  depth,
  slices,
  zoom,
  setDepth,
  setSlices,
  setZoom,
}) => {
  return (
    <div>
      <input
        type="number"
        value={slices}
        onChange={(e) => setSlices(e.target.value)}
      />
      <input
        type="number"
        value={depth}
        onChange={(e) => setDepth(e.target.value)}
      />
      <input
        type="number"
        value={zoom}
        onChange={(e) => setZoom(e.target.value)}
      />
    </div>
  );
};

export default ViewerControls;

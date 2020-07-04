import React, { useState, useEffect } from 'react';

let loadTimeoutId;
let opacityTimeoutId;
let progressTimeoutId;

const Loader = ({ loaded }) => {
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(0);

  const load = () => {
    setProgress(20);
    const tick = () => {
      setProgress(progress => progress + (90 - progress) * 0.2);
      progressTimeoutId = setTimeout(tick, 200 + Math.random() * 200);
    };
    progressTimeoutId = setTimeout(tick, 200 + Math.random() * 200);
  };

  useEffect(() => {
    opacityTimeoutId = setTimeout(() => {
      setOpacity(1);
    }, 100);
  }, []);

  useEffect(() => {
    if (loaded !== true) {
      loadTimeoutId = setTimeout(() => {
        load();
      }, 100);
      setOpacity(1);
    } else {
      clearTimeout(loadTimeoutId);
      clearTimeout(opacityTimeoutId);
      clearTimeout(progressTimeoutId);
      setProgress(100);
      setOpacity(0);
    }
  }, [loaded]);

  return (
    <div className="loader">
      <div
        className="loader__bar"
        style={{
          transform: `scaleX(${progress / 100})`,
          opacity: opacity,
        }}
      ></div>
    </div>
  );
};

export default Loader;

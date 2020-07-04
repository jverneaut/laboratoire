import React, { useEffect, useState } from 'react';

let timeoutId;
const Loader = ({ loaded }) => {
  const [scale, setScale] = useState(0);

  useEffect(() => {
    setImmediate(() => {
      setScale(0.2);
    });

    const tick = () => {
      setScale(scale => Math.max(scale, scale + 0.2 * (1 - scale)));
      timeoutId = setTimeout(tick, Math.random() * 200 + 200);
    };
    timeoutId = setTimeout(tick, Math.random() * 200 + 200);

    return () => {
      clearInterval(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (loaded) {
      setScale(1);
      clearTimeout(timeoutId);
    }
  }, [loaded]);

  return (
    <div className="loader">
      <div
        className="loader__bar"
        style={{
          opacity: loaded ? 0 : 1,
          transform: `scaleX(${loaded ? scale : 0.95 * scale})`,
        }}
      ></div>
    </div>
  );
};

export default Loader;

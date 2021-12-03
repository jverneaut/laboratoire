import React, { useEffect, useState } from 'react';

import Window from './Window';

const App = () => {
  const { availWidth: screenWidth, availHeight: screenHeight } = window.screen;
  const [visible, setVisible] = useState(false);
  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const tick = (dt) => {
      setTime(Date.now());
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  const showWindows = () => {
    setVisible(true);
  };

  return (
    <>
      <div className="container my-5">
        <div className="row">
          <div
            onClick={showWindows}
            className="col-12 d-flex flex-column align-items-center"
          >
            <button className="btn btn-primary">Show windows</button>
            <p className="mt-4">You need to allow popups for this to work.</p>
          </div>
        </div>
      </div>
      {visible && (
        <>
          <Window
            x={screenWidth * 0.0}
            y={screenHeight * 0.0}
            width={screenWidth * 0.5}
            height={screenHeight * 0.5}
            time={time}
          />
          <Window
            x={screenWidth * 0.5}
            y={screenHeight * 0.0}
            width={screenWidth * 0.5}
            height={screenHeight * 0.5}
            time={time}
          />
          <Window
            x={screenWidth * 0.0}
            y={screenHeight * 0.5}
            width={screenWidth * 0.5}
            height={screenHeight * 0.5}
            time={time}
          />
          <Window
            x={screenWidth * 0.5}
            y={screenHeight * 0.5}
            width={screenWidth * 0.5}
            height={screenHeight * 0.5}
            time={time}
          />
        </>
      )}
    </>
  );
};

export default App;

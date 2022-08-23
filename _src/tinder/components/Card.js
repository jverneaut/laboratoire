import React, { useState, useEffect } from 'react';
import { animated, useSpring } from 'react-spring';

import { THRESHOLD, RENDERED } from './App';

const App = ({ index, current, setCurrent, children }) => {
  const isCurrent = index === current;
  const isRendered = index >= current - 1 && index < current + RENDERED;

  if (!isRendered) return null;

  const [isMouseDown, setMouseDown] = useState(false);
  const [startPos, setStartPos] = useState([null, null]);
  const [currentPos, setCurrentPos] = useState([null, null]);

  const onMouseDown = e => {
    setStartPos([
      e.clientX || e.touches[0].clientX,
      e.clientY || e.touches[0].clientY,
    ]);
    setCurrentPos([
      e.clientX || e.touches[0].clientX,
      e.clientY || e.touches[0].clientY,
    ]);
    setMouseDown(true);
  };

  const onMouseMove = e => {
    if (!isMouseDown) return;
    setCurrentPos(() => [
      e.clientX || e.touches[0].clientX,
      e.clientY || e.touches[0].clientY,
    ]);
  };

  const offsetX = currentPos[0] - startPos[0];
  const mix = 1 - (index - current) / RENDERED;
  const opacity = index < current ? 0 : 1;
  const scale = 1 - 0.05 * (index - current);
  const offsetY = 22 * (index - current) + currentPos[1] - startPos[1];
  const rotationFactor = [
    offsetX / (0.5 * window.innerWidth),
    (-3 * offsetY) / (0.5 * window.innerHeight) + 1,
  ];
  const rotation = 30 * rotationFactor[0] * rotationFactor[1];

  useEffect(() => {}, [rotationFactor]);

  const bgColor = [33, 37, 41];
  const fgColor = [53, 59, 65];

  const animatedStyles = useSpring({
    transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale}) rotate(${rotation}deg)`,
    backgroundColor: `rgb(
      ${bgColor[0] + mix * fgColor[0]},
      ${bgColor[1] + mix * fgColor[1]},
      ${bgColor[2] + mix * fgColor[2]})`,
    opacity,
    boxShadow: `0px 4px 32px rgba(0, 0, 0, ${0.4 * mix})`,
    from: {
      transform: `translate(${offsetX}px, ${offsetY + 22}px) scale(${scale -
        0.05}) rotate(0deg)`,
      opacity: 0,
    },
  });

  const onMouseUp = e => {
    setMouseDown(false);
    if (Math.abs(offsetX) > THRESHOLD) {
      setCurrent(current => current + 1);
    } else {
      setStartPos([null, null]);
      setCurrentPos([null, null]);
    }
  };

  const styles = {
    pointerEvents: isCurrent ? 'all' : 'none',
    cursor: isMouseDown ? 'grabbing' : 'grab',
  };

  useEffect(() => {
    if (isCurrent) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('touchmove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('touchend', onMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchend', onMouseUp);
    };
  }, [isCurrent, isMouseDown, offsetX]);

  return (
    <animated.div
      onTouchStart={isCurrent ? onMouseDown : null}
      onMouseDown={isCurrent ? onMouseDown : null}
      className="card"
      style={{ ...styles, ...animatedStyles }}
    >
      {children}
    </animated.div>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { animated, useSpring } from 'react-spring';

const transform = (x, y, s, rotation) =>
  `translate(${x}px, ${y}px) scale(${s}) rotate(${rotation}deg)`;

const Card = ({ index, current, setCurrent, children, threshold }) => {
  const isCurrent = index === Math.floor(current);

  const [isMouseDown, setMouseDown] = useState(false);
  const [startPos, setStartPos] = useState([null, null]);
  const [startCurrent, setStartCurrent] = useState(null);

  const [offset, setOffset] = useState(0);
  const [rotation, setRotation] = useState(0);

  const onMouseDown = e => {
    setMouseDown(true);
    setStartPos([e.clientX, e.clientY]);
    setStartCurrent(current);
  };

  const onMouseMove = e => {
    if (isMouseDown) {
      const distance = Math.sqrt(
        Math.pow(e.clientX - startPos[0], 2) +
          Math.pow(e.clientY - startPos[1], 2)
      );
      const distanceRatio = distance / (window.innerWidth / 2);

      setCurrent(startCurrent + distanceRatio);
      setOffset(0.5 * Math.sign(e.clientX - startPos[0]) * distance);
      setRotation(Math.sign(e.clientX - startPos[0]) * distanceRatio * 30);
    }
  };

  const onMouseUp = e => {
    if (isMouseDown) {
      const distance = Math.sqrt(
        Math.pow(e.clientX - startPos[0], 2) +
          Math.pow(e.clientY - startPos[1], 2)
      );
      if (distance > threshold) {
        setCurrent(startCurrent + 1);
      } else {
        setOffset(0);
        setRotation(0);
        setCurrent(startCurrent);
      }
    }
    setMouseDown(false);
  };

  useEffect(() => {
    if (isCurrent) {
      document.body.addEventListener('mouseup', onMouseUp);
      return () => {
        document.body.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [isMouseDown, current]);

  const props = useSpring({
    XYScaleRotation: [
      offset,
      (index - current) * 12,
      1 - 0.04 * (index - current),
      rotation,
    ],
    opacity: index < Math.floor(current) ? 0 : 1 - 0.2 * (index - current - 1),
  });

  return (
    <animated.div
      onMouseDown={isCurrent ? onMouseDown : null}
      onMouseMove={isCurrent ? onMouseMove : null}
      style={{
        transform: props.XYScaleRotation.interpolate(transform),
        opacity: props.opacity,
        pointerEvents: isCurrent ? 'all' : 'none',
        cursor: isMouseDown ? 'grabbing' : 'grab',
      }}
      className="card"
    >
      {children}
    </animated.div>
  );
};

export default Card;

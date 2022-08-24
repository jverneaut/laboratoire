import React, { useState, useEffect, useRef } from 'react';
import Pane from './Pane';

const SCROLL_MULTIPLIER = 2;
const COLORS = ['#ffffff', '#ffd5c2', '#f28f3b', '#c8553d'];

const App = () => {
  const [scroll, setScroll] = useState(0);

  const containerRef = useRef();
  const containerWidth = useRef(null);
  const targetScroll = useRef(0);
  const mouseDownX = useRef(null);
  const lastTime = useRef(0);
  const isMouseDown = useRef(false);

  const onWheel = e => {
    e.persist();
    const delta = SCROLL_MULTIPLIER * (e.deltaX + e.deltaY);
    targetScroll.current = Math.min(
      Math.max(targetScroll.current + delta, 0),
      containerWidth.current - window.innerWidth
    );
  };

  const onMouseDown = e => {
    isMouseDown.current = true;
    mouseDownX.current = e.clientX;
  };

  const onMouseMove = e => {
    if (!isMouseDown.current) return;

    const delta = -SCROLL_MULTIPLIER * (e.clientX - mouseDownX.current);
    mouseDownX.current = e.clientX;
    targetScroll.current = Math.min(
      Math.max(targetScroll.current + delta, 0),
      containerWidth.current - window.innerWidth
    );
  };

  const onMouseUp = () => (isMouseDown.current = false);

  useEffect(() => {
    const interpolate = time => {
      const deltaTime = time - lastTime.current;

      setScroll(scroll => {
        return Math.round(
          scroll + 2 * (1 / deltaTime) * (targetScroll.current - scroll)
        );
      });
      lastTime.current = time;

      requestAnimationFrame(interpolate);
    };
    requestAnimationFrame(interpolate);
  }, []);

  useEffect(() => {
    const setContainerWidth = () => {
      containerWidth.current = containerRef.current.scrollWidth;
    };
    setContainerWidth();
    window.addEventListener('resize', setContainerWidth);
  }, []);

  return (
    <main
      ref={containerRef}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {COLORS.map((color, index) => (
        <Pane color={color} scroll={scroll} key={color + index} />
      ))}
      <h1>
        <span>Drag</span>
        <span>or</span>
        <span>scroll</span>
      </h1>
    </main>
  );
};

export default App;

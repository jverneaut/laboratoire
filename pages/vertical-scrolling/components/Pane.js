import React, { useRef, useLayoutEffect } from 'react';

const Pane = ({ color, scroll }) => {
  const el = useRef();
  const bounds = useRef([0, 1]);

  useLayoutEffect(() => {
    const setBounds = () => {
      const dimensions = el.current.getBoundingClientRect();
      bounds.current = [dimensions.left + scroll, dimensions.right + scroll];
    };

    setBounds();
    window.addEventListener('resize', setBounds);
  }, []);

  const isVisible =
    scroll > bounds.current[0] - window.innerWidth &&
    scroll < bounds.current[1];

  return (
    <section
      ref={el}
      style={{
        backgroundColor: color,
        transform: isVisible ? `translate3D(${-scroll}px, 0px, 0px)` : '',
        visibility: isVisible ? 'visible' : 'hidden',
      }}
    ></section>
  );
};

export default Pane;

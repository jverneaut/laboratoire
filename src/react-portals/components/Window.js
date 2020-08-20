import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const Ball = ({ time, width, height, x, y, opacity }) => {
  return (
    <div
      className="ball"
      style={{
        left: Math.sin(time * 0.001) * width * 0.5 + width - x,
        top: Math.cos(time * 0.004) * height * 0.5 + height - y,
        opacity,
      }}
    ></div>
  );
};

const Window = ({ x, y, width, height, time }) => {
  const [container] = useState(document.createElement('div'));
  let externalWindow = null;

  const styleElement = document.querySelector('link[rel=stylesheet');

  useEffect(() => {
    externalWindow = window.open(
      '',
      '',
      `width=${width},height=${height},left=${x},top=${y}`
    );

    externalWindow.document.body.appendChild(container);

    const newStyleElement = styleElement.cloneNode();
    newStyleElement.href =
      window.location.origin +
      styleElement.href.replace(window.location.origin, '');
    externalWindow.document.head.appendChild(newStyleElement);

    setTimeout(() => {
      externalWindow.resizeTo(width, height);
      externalWindow.moveTo(x, y);
    }, 1000);

    return () => {
      externalWindow.close();
      externalWindow = null;
    };
  }, []);

  return ReactDOM.createPortal(
    <>
      <Ball time={time} width={width} height={height} x={x} y={y} opacity={1} />
      <Ball
        time={time - 200}
        width={width}
        height={height}
        x={x}
        y={y}
        opacity={0.6}
      />
      <Ball
        time={time - 400}
        width={width}
        height={height}
        x={x}
        y={y}
        opacity={0.3}
      />
      <Ball
        time={time - 600}
        width={width}
        height={height}
        x={x}
        y={y}
        opacity={0.15}
      />
    </>,
    container
  );
};

export default Window;

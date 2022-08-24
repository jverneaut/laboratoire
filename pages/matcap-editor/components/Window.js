import React from 'react';
import Draggable from 'react-draggable';

const Window = ({ title, children, className, topWindow, setTopWindow }) => {
  const onMouseDown = () => {
    setTopWindow(title);
  };

  return (
    <Draggable handle=".title-bar" onMouseDown={onMouseDown}>
      <div
        className={['window', className].join(' ')}
        style={{ zIndex: topWindow === title ? 10 : 1 }}
      >
        <div className="title-bar">
          <div className="title-bar-text">{title}</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>
        <div className="window-body">{children}</div>
      </div>
    </Draggable>
  );
};

export default Window;

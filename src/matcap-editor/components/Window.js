import React from 'react';
import Draggable from 'react-draggable';

const Window = ({ title, children, className }) => {
  return (
    <div className={['window', className].join(' ')}>
      {/* <Draggable> */}
      <div className="title-bar">
        <div className="title-bar-text">{title}</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize"></button>
          <button aria-label="Maximize"></button>
          <button aria-label="Close"></button>
        </div>
      </div>
      {/* </Draggable> */}
      <div className="window-body">{children}</div>
    </div>
  );
};

export default Window;

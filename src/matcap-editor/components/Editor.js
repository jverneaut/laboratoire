import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 512;

const getPos = (e) => {
  const {
    x: elementX,
    y: elementY,
    width: elementWidth,
    height: elementHeight,
  } = e.target.getBoundingClientRect();

  return [
    (e.clientX - elementX) * (CANVAS_WIDTH / elementWidth),
    (e.clientY - elementY) * (CANVAS_HEIGHT / elementHeight),
  ];
};

const Editor = ({ canvasRef, setTexture }) => {
  const canvas = canvasRef.current;

  const [state, setState] = useState({
    mouseDown: false,
    lastPos: [null, null],
    brushSize: 20,
    color: '#ffffff',
  });

  useEffect(() => {
    setTexture(new THREE.CanvasTexture(canvasRef.current));
  }, []);

  const onMouseDown = (e) => {
    const pos = getPos(e);

    setState((state) => ({
      ...state,
      mouseDown: true,
      lastPos: pos,
    }));
  };

  const onMouseMove = (e) => {
    if (!state.mouseDown) return;

    const pos = getPos(e);

    /** @type CanvasRenderingContext2D */
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.strokeStyle = state.color;
    ctx.lineWidth = state.brushSize;
    ctx.moveTo(state.lastPos[0], state.lastPos[1]);
    ctx.lineTo(pos[0], pos[1]);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pos[0], pos[1], 0.5 * state.brushSize, 0, 2 * Math.PI);
    ctx.fillStyle = state.color;
    ctx.fill();

    setState((state) => ({
      ...state,
      mouseDown: true,
      lastPos: pos,
    }));

    setTexture(new THREE.CanvasTexture(canvasRef.current));
  };

  const onMouseUp = () => {
    setState((state) => ({ ...state, mouseDown: false }));
  };

  const clear = () => {
    /** @type CanvasRenderingContext2D */
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTexture(new THREE.CanvasTexture(canvasRef.current));
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="editor"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        width="512"
        height="512"
      ></canvas>

      <button onClick={clear}>Clear</button>

      <div className="field-row">
        <label htmlFor="range25">Volume:</label>
        <label htmlFor="range26">Low</label>
        <input
          id="range26"
          type="range"
          min="8"
          max="200"
          value={state.brushSize}
          onChange={(e) =>
            setState((state) => ({ ...state, brushSize: e.target.value }))
          }
        />
        <label htmlFor="range27">High</label>
      </div>

      <input
        type="color"
        value={state.color}
        onChange={(e) =>
          setState((state) => ({ ...state, color: e.target.value }))
        }
      />

      <fieldset>
        <legend>Today's mood</legend>
        <div className="field-row">
          <input id="radio17" type="radio" name="fieldset-example2" />
          <label htmlFor="radio17">Claire Saffitz</label>
        </div>
        <div className="field-row">
          <input id="radio18" type="radio" name="fieldset-example2" />
          <label htmlFor="radio18">Brad Leone</label>
        </div>
        <div className="field-row">
          <input id="radio19" type="radio" name="fieldset-example2" />
          <label htmlFor="radio19">Chris Morocco</label>
        </div>
        <div className="field-row">
          <input id="radio20" type="radio" name="fieldset-example2" />
          <label htmlFor="radio20">Carla Lalli Music</label>
        </div>
      </fieldset>
    </>
  );
};

export default Editor;

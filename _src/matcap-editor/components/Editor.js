import React, { useState, useEffect } from 'react';
import * as THREE from 'three';

const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 512;

const importAll = (r) => {
  return r.keys().map(r);
};

const matCaps = importAll(
  require.context('../assets/matcaps', false, /\.(png|jpe?g|svg)$/)
);

const ColorPicker = ({ name, label, value, onChange }) => {
  return (
    <div className="control">
      <label>{label}</label>
      <input type="color" value={value} name={name} onChange={onChange} />
    </div>
  );
};

const Range = ({ name, label, value, min, max, onChange: propsOnChange }) => {
  const onChange = (e) => {
    propsOnChange({
      ...e,
      target: { ...e.target, value: parseFloat(e.target.value) },
    });
  };

  return (
    <div className="control">
      <label>{label}</label>
      <label>{min}</label>
      <input
        type="range"
        value={value}
        name={name}
        min={min}
        max={max}
        onChange={onChange}
      />
      <label>{max}</label>
    </div>
  );
};

const getPos = (e) => {
  const {
    x: elementX,
    y: elementY,
    width: elementWidth,
    height: elementHeight,
  } = e.target.getBoundingClientRect();

  const x = e.clientX || e.touches[0].clientX;
  const y = e.clientY || e.touches[0].clientY;

  return [
    (x - elementX) * (CANVAS_WIDTH / elementWidth),
    (y - elementY) * (CANVAS_HEIGHT / elementHeight),
  ];
};

const Editor = ({ setTexture }) => {
  /** @type HTMLCanvasElement */
  let drawingCanvas = null;
  /** @type HTMLCanvasElement */
  let postProcessingCanvas = null;

  const [state, setState] = useState({
    drawing: {
      mouseDown: false,
      lastPos: [null, null],
      width: 50,
      height: 50,
    },
    mouseStyle: {
      top: 0,
      left: 0,
      opacity: 0,
    },
    controls: {
      baseColor: {
        type: 'color',
        label: 'Base Color',
        value: '#dddddd',
      },
      brushColor: {
        type: 'color',
        label: 'Brush Color',
        value: '#000000',
      },
      brushSize: {
        type: 'range',
        label: 'Brush Size',
        value: 50,
        min: 1,
        max: 256,
      },
      blur: {
        type: 'range',
        label: 'Blur Size',
        value: 0,
        min: 0,
        max: 64,
      },
    },
  });

  const clearCanvas = (ctx) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = state.controls.baseColor.value;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  };

  // Post processing
  useEffect(() => {
    const postProcessingCanvasCtx = postProcessingCanvas.getContext('2d');

    const imageURL = drawingCanvas.toDataURL();

    const image = new Image();
    image.onload = () => {
      clearCanvas(postProcessingCanvasCtx);
      postProcessingCanvasCtx.filter = `blur(${state.controls.blur.value}px)`;
      postProcessingCanvasCtx.drawImage(image, 0, 0);

      setTexture(new THREE.CanvasTexture(postProcessingCanvasCtx.canvas));
    };

    image.src = imageURL;
  }, [postProcessingCanvas, state.controls.blur, state.controls.baseColor]);

  // Post processing
  useEffect(() => {
    const postProcessingCanvasCtx = postProcessingCanvas.getContext('2d');
    const imageURL = drawingCanvas.toDataURL();

    const image = new Image();
    image.onload = () => {
      clearCanvas(postProcessingCanvasCtx);
      postProcessingCanvasCtx.drawImage(image, 0, 0);

      setTexture(new THREE.CanvasTexture(postProcessingCanvasCtx.canvas));
    };

    image.src = imageURL;
  }, [postProcessingCanvas, state.drawing.lastPos, state.controls.baseColor]);

  const onMouseEnter = (e) => {
    const pos = getPos(e);

    setState((state) => ({
      ...state,
      drawing: {
        ...state.drawing,
        lastPos: state.drawing.mouseDown ? pos : state.drawing.lastPos,
      },
      mouseStyle: { ...state.mouseStyle, opacity: 1 },
    }));
  };

  const onMouseLeave = () => {
    setState((state) => ({
      ...state,
      mouseStyle: { ...state.mouseStyle, opacity: 0 },
    }));
  };

  const onMouseDown = (e) => {
    const pos = getPos(e);

    setState((state) => ({
      ...state,
      drawing: { ...state.drawing, mouseDown: true, lastPos: pos },
    }));
  };

  const onMouseMove = (e) => {
    const x = e.clientX || e.touches[0].clientX;
    const y = e.clientY || e.touches[0].clientY;

    const {
      x: canvasLeft,
      y: canvasTop,
      width: canvasWidth,
      height: canvasHeight,
    } = e.target.getBoundingClientRect();

    setState((state) => ({
      ...state,
      mouseStyle: {
        ...state.mouseStyle,
        left: x - canvasLeft,
        top: y - canvasTop,
        width: state.controls.brushSize.value * (canvasWidth / CANVAS_WIDTH),
        height: state.controls.brushSize.value * (canvasHeight / CANVAS_HEIGHT),
      },
    }));

    if (!state.drawing.mouseDown) return;

    const pos = getPos(e);

    const drawingCanvasCtx = drawingCanvas.getContext('2d');

    drawingCanvasCtx.beginPath();
    drawingCanvasCtx.strokeStyle = state.controls.brushColor.value;
    drawingCanvasCtx.lineWidth = state.controls.brushSize.value;
    drawingCanvasCtx.moveTo(state.drawing.lastPos[0], state.drawing.lastPos[1]);
    drawingCanvasCtx.lineTo(pos[0], pos[1]);
    drawingCanvasCtx.stroke();

    drawingCanvasCtx.beginPath();
    drawingCanvasCtx.arc(
      pos[0],
      pos[1],
      0.5 * state.controls.brushSize.value,
      0,
      2 * Math.PI
    );
    drawingCanvasCtx.fillStyle = state.controls.brushColor.value;
    drawingCanvasCtx.fill();

    setState((state) => ({
      ...state,
      drawing: {
        ...state.drawing,
        lastPos: pos,
      },
    }));
  };

  useEffect(() => {
    ['mouseup', 'touchend'].forEach((event) => {
      window.addEventListener(event, () => {
        setState((state) => ({
          ...state,
          drawing: { ...state.drawing, mouseDown: false },
        }));
      });
    });
  }, [drawingCanvas]);

  const setMatCapImage = (src) => {
    const drawingCanvasCtx = drawingCanvas.getContext('2d');
    const postProcessingCanvasCtx = postProcessingCanvas.getContext('2d');

    const image = new Image();
    image.onload = () => {
      drawingCanvasCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      postProcessingCanvasCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawingCanvasCtx.drawImage(image, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      setState((state) => ({
        ...state,
        controls: {
          ...state.controls,
          blur: { ...state.controls.blur, value: 0 },
        },
      }));
    };

    image.src = src;
  };

  const clear = () => {
    const drawingCanvasCtx = drawingCanvas.getContext('2d');
    const postProcessingCanvasCtx = postProcessingCanvas.getContext('2d');

    drawingCanvasCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    clearCanvas(postProcessingCanvasCtx);

    setState((state) => ({
      ...state,
      controls: {
        ...state.controls,
        blur: { ...state.controls.blur, value: 0 },
      },
    }));
  };

  const save = () => {
    const downloadLink = document.createElement('a');
    downloadLink.setAttribute('download', 'matcap.png');

    postProcessingCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      downloadLink.setAttribute('href', url);
      downloadLink.click();
    });
  };

  return (
    <>
      <div className="editor">
        <div className="editor-canvas">
          <canvas
            id="post-processing-canvas"
            ref={(element) => (postProcessingCanvas = element)}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
          ></canvas>

          <canvas
            id="drawing-canvas"
            ref={(element) => (drawingCanvas = element)}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onTouchStart={onMouseDown}
            onTouchMove={onMouseMove}
          ></canvas>

          <div className="editor-canvas__guides">
            <div className="editor-canvas__zone"></div>
            <div
              className="editor-canvas__mouse"
              style={{
                ...state.mouseStyle,
                backgroundColor: state.controls.brushColor.value,
              }}
            ></div>
          </div>
        </div>

        <div className="editor-matcaps">
          {matCaps.map((matCap) => (
            <img
              src={matCap.src}
              key={matCap.src}
              onClick={() => setMatCapImage(matCap.src)}
            />
          ))}
          <div className="editor-buttons">
            <button onClick={clear}>Clear</button>
            <button onClick={save}>Save</button>
          </div>
        </div>

        <div className="editor-controls">
          {Object.keys(state.controls).map((controlKey) => {
            const props = {
              ...state.controls[controlKey],
              name: controlKey,
              onChange: (e) =>
                setState((state) => ({
                  ...state,
                  controls: {
                    ...state.controls,
                    [controlKey]: {
                      ...state.controls[controlKey],
                      value: e.target.value,
                    },
                  },
                })),
            };

            switch (state.controls[controlKey].type) {
              case 'color':
                return <ColorPicker {...props} key={controlKey} />;
              case 'range':
                return <Range {...props} key={controlKey} />;
              default:
                return;
            }
          })}
        </div>
      </div>
    </>
  );
};

export default Editor;

import './main.scss';

import Canvas from './Canvas';
import GL from './GL';

import background from './background.jpg';

const image = new Image();

let canvas;
let gl;

const loop = () => {
  canvas.update();
  canvas.draw();

  gl.update(canvas.canvas);
  gl.draw();

  requestAnimationFrame(loop);
};

const setup = () => {
  canvas = new Canvas();
  canvas.draw();
  gl = new GL(image, canvas.canvas);
  loop();
};

image.src = background.src;
image.addEventListener('load', setup);

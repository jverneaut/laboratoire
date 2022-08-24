import './index.scss';

import * as twgl from 'twgl.js';
import createPlane from 'primitive-plane';

import vShaderSource from './shaders/vertex.glsl';
import fShaderSource from './shaders/fragment.glsl';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl');

twgl.setDefaults({ attribPrefix: 'a_' });
twgl.resizeCanvasToDisplaySize(canvas, window.devicePixelRatio);
gl.viewport(0, 0, canvas.width, canvas.height);

const programInfo = twgl.createProgramInfo(gl, [vShaderSource, fShaderSource]);

const plane = createPlane(canvas.clientWidth, canvas.clientHeight, 1, 1);

const arrays = {
  position: plane.positions.flat(),
  indices: plane.cells.flat(),
  texcoord: plane.uvs.flat(),
  color_1: [
    [0.82, 0.26, 0.62, 1], // Bottom left
    [0.92, 0.55, 0.55, 1], // Bottom right
    [0.81, 0.08, 0.53, 1], // Top left
    [0.95, 0.46, 0.69, 1], // Top right
  ].flat(),
  color_2: [
    [0.22, 0.93, 0.89, 1], // Bottom left
    [0.55, 0.83, 0.3, 1], // Bottom right
    [0.22, 0.93, 0.89, 1], // Top left
    [0.68, 0.75, 0.58, 1], // Top right
  ].flat(),
};

const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

const baseUniforms = {
  u_resolution: [canvas.clientWidth, canvas.clientHeight],
  u_time: 0,
};

const objects = [
  {
    bufferInfo,
    programInfo,
    uniforms: {
      ...baseUniforms,
    },
  },
];

const draw = time => {
  time *= 0.001;
  objects.forEach(object => {
    object.uniforms.u_time = time;
  });

  twgl.drawObjectList(gl, objects);
  requestAnimationFrame(draw);
};

requestAnimationFrame(draw);

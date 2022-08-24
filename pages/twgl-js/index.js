// Some links to learn from

// http://twgljs.org/examples/gpgpu-particles.html
// http://twgljs.org/examples/twgl-cube.html
// https://webglsamples.org/field/field.html
// http://www-evasion.imag.fr/Membres/Fabrice.Neyret/demos/Shadertoy/indexImages.html
// https://mattdesl.svbtle.com/glslify
// https://www.youtube.com/watch?v=XaiYKkxvrFM&feature=youtu.be
// https://www.interactiveshaderformat.com/sketches/871

import * as twgl from 'twgl.js';

import vShaderSource from './shaders/vertex.glsl';
import fShaderSource from './shaders/fragment.glsl';

import './main.scss';

const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

const gl = canvas.getContext('webgl');

const programInfo = twgl.createProgramInfo(gl, [vShaderSource, fShaderSource]);

const arrays = {
  position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
};

const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

const render = time => {
  twgl.resizeCanvasToDisplaySize(canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);

  const uniforms = {
    time: time * 0.001,
    resolution: [canvas.width, canvas.height],
  };

  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, bufferInfo);

  requestAnimationFrame(render);
};
requestAnimationFrame(render);

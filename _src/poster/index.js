import './main.scss';

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

const plane = createPlane(canvas.clientWidth, canvas.clientHeight, 2, 2);

const arrays = {
  position: plane.positions.flat(),
  indices: plane.cells.flat(),
  texcoord: plane.uvs.flat(),
};

const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

const baseUniforms = {
  u_resolution: [canvas.clientWidth, canvas.clientHeight],
  u_time: 0,
};

const loadTexture = async src =>
  await new Promise(resolve => {
    let texture;

    texture = twgl.createTexture(gl, { src }, () => resolve(texture));
  });

window.addEventListener('load', async () => {
  const car = document.querySelector('img#car');
  const carCutout = document.querySelector('img#car-cutout');
  const paper = document.querySelector('img#paper');

  const carTexture = await loadTexture(car.src);
  const carCutoutTexture = await loadTexture(carCutout.src);
  const paperTexture = await loadTexture(paper.src);

  const objects = [
    {
      bufferInfo,
      programInfo,
      uniforms: {
        ...baseUniforms,
        u_carTexture: carTexture,
        u_carCutoutTexture: carCutoutTexture,
        u_paperTexture: paperTexture,
      },
    },
  ];

  const draw = time => {
    time *= 0.001;

    objects.forEach(objects => {
      objects.uniforms.u_time = time;
    });

    twgl.drawObjectList(gl, objects);
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
});

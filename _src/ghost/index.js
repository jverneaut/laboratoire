import '../reset.css';
import './main.scss';

const regl = require('regl')();
import head from './ghost.obj';
import mat4 from 'gl-mat4';
import mat3 from 'gl-mat3';

import vert from './shader.vert';
import frag from './shader.frag';
import postVert from './post.vert';
import postFrag from './post.frag';

const fbo = regl.framebuffer({
  color: regl.texture({
    width: 1,
    height: 1,
    wrap: 'clamp',
  }),
  depth: true,
});

const drawGhost = regl({
  vert,
  frag,
  attributes: {
    a_position: head.vertices,
    a_normals: head.vertexNormals,
  },
  uniforms: {
    u_time: ({ tick }) => tick,
    u_model: ({ time }) => {
      const model = mat4.create();
      mat4.rotateY(model, mat4.identity([]), time * 0.5);
      mat4.scale(model, model, [1.5, 1.5, 1.5]);
      mat4.translate(model, model, [0, 3.5, 0]);
      return model;
    },
    u_view: mat4.lookAt([], [0, -3, 30], [0, 0, 0], [0, 1, 0]),
    u_projection: ({ viewportWidth, viewportHeight }) =>
      mat4.perspective(
        [],
        Math.PI / 4,
        viewportWidth / viewportHeight,
        0.01,
        1000
      ),
    u_normals: ({ time }) => {
      const model = mat4.create();
      mat4.rotateY(model, mat4.identity([]), time * 0.5);
      mat4.scale(model, model, [1.5, 1.5, 1.5]);
      mat4.translate(model, model, [0, 3.5, 0]);
      const view = mat4.lookAt([], [0, -3, 30], [0, 0, 0], [0, 1, 0]);

      return mat3.fromMat4(
        [],
        mat4.transpose([], mat4.invert([], mat4.multiply([], model, view)))
      );
    },
  },
  elements: head.indices,
  framebuffer: fbo,
});

const drawProcessed = regl({
  vert: postVert,
  frag: postFrag,
  attributes: {
    a_position: [-4, -4, 4, -4, 0, 4],
  },
  uniforms: {
    u_texture: fbo,
  },

  count: 3,
  depth: {
    enable: false,
  },
});

const loop = regl.frame(({ viewportHeight, viewportWidth }) => {
  fbo.resize(viewportWidth, viewportHeight);

  try {
    regl.clear({
      color: [0, 0, 0, 0],
      depth: true,
      framebuffer: fbo,
    });

    drawGhost();
    drawProcessed();
  } catch (error) {
    loop.cancel();
    throw error;
  }
});

document
  .querySelector('h1')
  .addEventListener(
    'mouseenter',
    () => (document.body.style.background = 'white')
  );
document
  .querySelector('h1')
  .addEventListener('mouseleave', () => (document.body.style.background = ''));

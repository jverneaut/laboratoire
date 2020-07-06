import '../reset.css';
import './main.scss';

const regl = require('regl')();
import head from './ghost.obj';
import mat4 from 'gl-mat4';

import vert from './vert.glsl';
import frag from './frag.glsl';

const draw = regl({
  vert,
  frag,
  attributes: {
    a_position: head.vertices,
    a_normals: head.vertexNormals,
  },
  uniforms: {
    u_time: ({ tick }) => tick,
    u_scale: 1.5,
    u_rotation: ({ time }) => mat4.rotateY([], mat4.identity([]), time),
    u_view: ({ tick }) => {
      const t = 0.01 * tick;
      return mat4.lookAt(
        [],
        [30 * Math.cos(t), 2.5, 30 * Math.sin(t)],
        [0, 0, 0],
        [0, 1, 0]
      );
    },
    u_projection: ({ viewportWidth, viewportHeight }) =>
      mat4.perspective(
        [],
        Math.PI / 4,
        viewportWidth / viewportHeight,
        0.01,
        1000
      ),
  },
  elements: head.indices,
});

const loop = regl.frame(() => {
  try {
    regl.clear({
      color: [0, 0, 0, 0],
    });

    draw();
  } catch (error) {
    loop.cancel();
    throw error;
  }
});

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
    u_scale: 0.05,
    u_rotation: ({ time }) => mat4.rotateY([], mat4.identity([]), time),
  },
  elements: head.indices,
});

const loop = regl.frame(() => {
  try {
    regl.clear({
      color: [0, 0, 0, 1],
    });

    draw();
  } catch (error) {
    loop.cancel();
    throw error;
  }
});

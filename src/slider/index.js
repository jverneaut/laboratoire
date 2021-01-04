import './main.scss';

import * as twgl from 'twgl.js';
import anime from 'animejs';

import vShaderSource from './shaders/vertex.glsl';
import fShaderSource from './shaders/fragment.glsl';

import createPlane from 'primitive-plane';

const settings = {
  originalDimensions: [200, 400],
  activeDimensions: [1100, 600],
  instances: 12,
  gap: 20,
};

const init = () => {
  // Setup
  twgl.setDefaults({ attribPrefix: 'a_' });
  const gl = document.querySelector('canvas').getContext('webgl');
  const programInfo = twgl.createProgramInfo(gl, [
    vShaderSource,
    fShaderSource,
  ]);

  const plane = createPlane(
    settings.originalDimensions[0],
    settings.originalDimensions[1]
  );

  const arrays = {
    position: plane.positions.flat(),
    indices: plane.cells.flat(),
    texcoord: plane.uvs.flat(),
  };

  const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

  const textures = twgl.createTextures(gl, {
    slovenia: { src: document.querySelector('#slovenia').src },
    italy: { src: document.querySelector('#italy').src },
    france: { src: document.querySelector('#france').src },
    ny: { src: document.querySelector('#ny').src },
  });

  const objects = new Array(settings.instances).fill(0).map((_, index) => ({
    bufferInfo,
    programInfo,
    texture:
      textures[
        Object.keys(textures)[
          Math.floor(Math.random() * Object.keys(textures).length)
        ]
      ],
  }));

  const img = document.querySelector('img');

  const uniforms = {
    u_scale: [
      settings.activeDimensions[0] / settings.originalDimensions[0],
      settings.activeDimensions[1] / settings.originalDimensions[1],
    ],
    u_textureScaleOrigin: [
      settings.originalDimensions[0] /
        settings.originalDimensions[1] /
        (img.width / img.height),
      1,
    ],
    u_textureScaleActive: [
      1,
      settings.activeDimensions[1] /
        settings.activeDimensions[0] /
        (img.height / img.width),
    ],
    u_active: 0,
    u_mouseIndex: -999,
    u_position: -999,
  };

  let startX = 0;
  let lastX = 0;
  let targetX = 0;
  let currentX = 0;
  let isMouseDown = false;

  // Render
  const render = time => {
    time *= 0.001;

    currentX += 0.12 * (targetX - currentX);

    uniforms.u_position = currentX / settings.originalDimensions[0];

    // Resize canvas and set viewport accordingly
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    objects.forEach((object, index) => {
      const view = twgl.m4.identity();
      twgl.m4.translate(
        view,
        [
          0.5 * gl.canvas.width +
            index * (settings.originalDimensions[0] + settings.gap),
          0.5 * gl.canvas.height,
          0.0,
          0.0,
        ],
        view
      );

      twgl.m4.translate(
        view,
        [
          uniforms.u_position * (settings.originalDimensions[0] + settings.gap),
          0,
          0,
          0,
        ],
        view
      );

      object.uniforms = {
        ...uniforms,
        u_resolution: [gl.canvas.width, gl.canvas.height],
        u_view: view,
        u_texture: object.texture,
        u_index: index,
      };
    });

    twgl.drawObjectList(gl, objects);

    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);

  let moved = false;
  let active = false;

  gl.canvas.addEventListener('mousedown', e => {
    moved = false;
    isMouseDown = true;
    lastX = currentX;
    startX = e.clientX;
  });

  gl.canvas.addEventListener('mousemove', e => {
    if (isMouseDown) {
      moved = true;
      targetX =
        lastX +
        (e.clientX - startX) /
          ((uniforms.u_active * settings.activeDimensions[0]) /
            settings.originalDimensions[0] +
            (1 - uniforms.u_active));
    }

    const mouseIndex = Math.round(
      (e.clientX - 0.5 * window.innerWidth) /
        (settings.originalDimensions[0] + settings.gap)
    );

    if (
      Math.abs(e.clientY - window.innerHeight / 2) <
      settings.originalDimensions[1] / 2
    ) {
      uniforms.u_mouseIndex = mouseIndex;
    } else {
      uniforms.u_mouseIndex = -999;
    }
  });

  ['mouseleave', 'mouseup'].forEach(event =>
    window.addEventListener(event, () => {
      isMouseDown = false;
      const index = Math.round(targetX / settings.originalDimensions[0]);
      targetX = index * settings.originalDimensions[0];
    })
  );

  gl.canvas.addEventListener('click', () => {
    if (moved) return;

    active = !active;
    anime({
      targets: uniforms,
      u_active: active ? 1 : 0,
      easing: 'easeInOutQuart',
      duration: 1600,
    });
  });
};

window.addEventListener('load', init);

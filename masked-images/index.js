import './main.scss';

import vShaderSource from './shaders/vertex.glsl';
import fShaderSource from './shaders/fragment.glsl';
import { createShader, createProgram, createTexture } from './utils';

const RESOLUTION = 2;

const MESH_WIDTH_SEGMENTS_NUMBER = 2;
const MESH_HEIGHT_SEGMENTS_NUMBER = 2;

const images = document.querySelectorAll('img');
images.forEach(image => {
  image.style.visibility = 'hidden';
});

const init = () => {
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  });
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth * RESOLUTION;
  canvas.height = window.innerHeight * RESOLUTION;

  // Setup WebGL and create program
  const gl = canvas.getContext('webgl');

  const vShader = createShader(gl, gl.VERTEX_SHADER, vShaderSource);
  const fShader = createShader(gl, gl.FRAGMENT_SHADER, fShaderSource);
  const program = createProgram(gl, vShader, fShader);

  gl.useProgram(program);

  // Create textures from DOM images
  const textures = [];

  images.forEach(image => {
    textures.push(createTexture(gl, image));
  });

  // The final mesh will look like this:
  // 0 1 2
  // 3 4 5
  // ...

  // First, we need calculate the position for each number
  const texturePositions = [];
  for (let i = 0; i < MESH_HEIGHT_SEGMENTS_NUMBER; i++) {
    for (let j = 0; j < MESH_WIDTH_SEGMENTS_NUMBER; j++) {
      texturePositions.push([
        j / (MESH_WIDTH_SEGMENTS_NUMBER - 1),
        i / (MESH_HEIGHT_SEGMENTS_NUMBER - 1),
      ]);
    }
  }

  // We will use TRIANGLE_STRIP to draw our shape so we need to compute
  // the correct vertices order to map our texture.
  // ex: 0, 3, 1, 3, 2, 5, ...
  //
  // This site provides a very good introduction as to what we are doing here:
  // https://www.learnopengles.com/tag/triangle-strips/
  const textureIndices = [];
  for (let i = 0; i < MESH_HEIGHT_SEGMENTS_NUMBER; i++) {
    for (let j = 0; j < MESH_WIDTH_SEGMENTS_NUMBER; j++) {
      textureIndices.push(j + i * MESH_WIDTH_SEGMENTS_NUMBER);
      textureIndices.push(j + (i + 1) * MESH_WIDTH_SEGMENTS_NUMBER);
    }

    // Degenerated triangles
    if (i < MESH_HEIGHT_SEGMENTS_NUMBER - 2) {
      textureIndices.push(
        ...[
          (i + 1) * MESH_WIDTH_SEGMENTS_NUMBER + MESH_WIDTH_SEGMENTS_NUMBER - 1,
          (i + 1) * MESH_WIDTH_SEGMENTS_NUMBER,
        ]
      );
    }
  }

  // textureCoords now contains every vertices in the correct order.
  const textureCoords = textureIndices
    .map(index => texturePositions[index])
    .flat();

  // Create a texcoord buffer and attribute
  const texcoordAttributeLocation = gl.getAttribLocation(program, 'a_texcoord');

  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(textureCoords),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(texcoordAttributeLocation);
  gl.vertexAttribPointer(texcoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  let time = 0;

  const mouseLocationUniform = gl.getUniformLocation(program, 'u_time');
  gl.uniform1f(mouseLocationUniform, time);

  const draw = () => {
    images.forEach((image, index) => {
      // First we get the image position relative to the canvas
      const { left, right, top, bottom } = image.getBoundingClientRect();

      const corners = {
        top: 1 - 2 * (top / window.innerHeight),
        bottom: 1 - 2 * (bottom / window.innerHeight),
        left: 2 * (left / window.innerWidth) - 1,
        right: 2 * (right / window.innerWidth) - 1,
      };

      const vertexPositions = [];
      for (let i = 0; i < MESH_HEIGHT_SEGMENTS_NUMBER; i++) {
        for (let j = 0; j < MESH_WIDTH_SEGMENTS_NUMBER; j++) {
          vertexPositions.push([
            corners.left +
              (j * (corners.right - corners.left)) /
                (MESH_WIDTH_SEGMENTS_NUMBER - 1),
            corners.top +
              (i * (corners.bottom - corners.top)) /
                (MESH_HEIGHT_SEGMENTS_NUMBER - 1),
          ]);
        }
      }

      const vertexIndices = [];
      for (let i = 0; i < MESH_HEIGHT_SEGMENTS_NUMBER - 1; i++) {
        for (let j = 0; j < MESH_WIDTH_SEGMENTS_NUMBER; j++) {
          vertexIndices.push(j + i * MESH_WIDTH_SEGMENTS_NUMBER);
          vertexIndices.push(j + (i + 1) * MESH_WIDTH_SEGMENTS_NUMBER);
        }

        // Degenerated triangles
        if (i < MESH_HEIGHT_SEGMENTS_NUMBER - 2) {
          vertexIndices.push(
            ...[
              (i + 1) * MESH_WIDTH_SEGMENTS_NUMBER +
                MESH_WIDTH_SEGMENTS_NUMBER -
                1,
              (i + 1) * MESH_WIDTH_SEGMENTS_NUMBER,
            ]
          );
        }
      }

      const segments = vertexIndices
        .map(index => vertexPositions[index])
        .flat();

      const positionAttributeLocation = gl.getAttribLocation(
        program,
        'a_position'
      );

      const positionsBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(segments),
        gl.STATIC_DRAW
      );
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.vertexAttribPointer(
        positionAttributeLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
      );

      const scrollAttributeLocation = gl.getAttribLocation(program, 'a_scroll');
      const scroll = new Array(segments.length).fill(corners.top);
      const scrollBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, scrollBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(scroll), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(scrollAttributeLocation);
      gl.vertexAttribPointer(scrollAttributeLocation, 1, gl.FLOAT, false, 0, 0);

      gl.bindTexture(gl.TEXTURE_2D, textures[index]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, segments.length / 2);
    });

    requestAnimationFrame(draw);
  };
  draw();
};

window.onload = init;

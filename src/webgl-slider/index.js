import './main.scss';

import anime from 'animejs';
import createPlane from 'primitive-plane';

const WIDTH = 400;
const HEIGHT = 600;

const createTexture = (context, image) => {
  const texture = context.createTexture();
  context.bindTexture(context.TEXTURE_2D, texture);
  context.texParameteri(
    context.TEXTURE_2D,
    context.TEXTURE_WRAP_S,
    context.CLAMP_TO_EDGE
  );
  context.texParameteri(
    context.TEXTURE_2D,
    context.TEXTURE_WRAP_T,
    context.CLAMP_TO_EDGE
  );
  context.texParameteri(
    context.TEXTURE_2D,
    context.TEXTURE_MAG_FILTER,
    context.NEAREST
  );
  context.texParameteri(
    context.TEXTURE_2D,
    context.TEXTURE_MIN_FILTER,
    context.NEAREST
  );
  context.texImage2D(
    context.TEXTURE_2D,
    0,
    context.RGBA,
    context.RGBA,
    context.UNSIGNED_BYTE,
    image
  );

  return texture;
};

const init = () => {
  const images = Array.from(document.querySelectorAll('.img'));

  const textures = [];

  const mask = document.querySelector('#texture');

  const canvas = document.querySelector('canvas');

  canvas.width = WIDTH * 4;
  canvas.height = HEIGHT * 4;
  Object.assign(canvas.style, {
    width: WIDTH + 'px',
    height: HEIGHT + 'px',
  });

  const gl = canvas.getContext('webgl');

  const vShaderSource = `
    precision mediump float;

    attribute vec2 a_position;
    varying vec2 v_position;

    void main() {
      v_position = a_position;

      vec4 position = vec4(a_position.x, a_position.y, 0.0, 1.0);
      gl_Position = position;
    }
  `;

  const fShaderSource = `
    precision mediump float;
    varying vec2 v_position;

    uniform sampler2D u_image0;
    uniform sampler2D u_image1;
    uniform sampler2D u_mask;

    uniform vec2 u_image0Aspect;
    uniform vec2 u_image1Aspect;
    uniform vec2 u_maskAspect;

    uniform float u_progress;

    vec4 toBW(vec4 color) {
      return vec4(vec3(0.21 * color.r + 0.72 * color.g + 0.07 * color.b), 1.0);
    }

    vec4 lighten(vec4 color, float amount) {
      return vec4(vec3(amount) + vec3(1.0 - amount) * color.rgb, 1.0);
    }

    void main() {
      float offset_bg = 0.05;
      float offset_fg = 0.06;
      float zoom_bg = 1.0;
      float zoom_fg = 1.0 - 0.04 * sin(u_progress * 3.14159);

      float zoom_mask = 1.0 + 0.05 * sin(u_progress * 3.14159);

      float opacity = max(0.0, 1.0 / (1.0 - 0.5) * (u_progress - 0.5));

      vec4 image0_bg = lighten(toBW(texture2D(u_image0, vec2(-offset_bg * u_progress, 0.0) + vec2(1.0 / zoom_bg) * vec2(0.5, -0.5) * v_position * u_image0Aspect + 0.5)), 0.75);
      vec4 image0_fg = texture2D(u_image0, vec2(-offset_fg * u_progress, 0.0) + vec2(1.0 / zoom_fg) * vec2(0.5, -0.5) * v_position * u_image0Aspect + 0.5);

      if (
       ( v_position.x) > (1.0 / u_image0Aspect.x)
        ||( v_position.x) < -(1.0 / u_image0Aspect.x)
      ) image0_bg.a = 0.0;

      vec4 image1_bg = lighten(toBW(texture2D(u_image1, vec2(-offset_bg * (u_progress - 1.0), 0.0) + vec2(1.0 / zoom_bg) * vec2(0.5, -0.5) * v_position * u_image1Aspect + 0.5)), 0.75);
      vec4 image1_fg = texture2D(u_image1, vec2(-offset_fg * (u_progress - 1.0), 0.0) + vec2(1.0 / zoom_fg) * vec2(0.5, -0.5) * v_position * u_image1Aspect + 0.5);

      if (
       ( v_position.x) > (1.0 / u_image1Aspect.x)
        ||( v_position.x) < -(1.0 / u_image1Aspect.x)
      ) image1_bg.a = 0.0;

      vec4 bg = vec4((1.0 - opacity) * image0_bg) + vec4(opacity * image1_bg);
      vec4 fg = vec4((1.0 - opacity) * image0_fg) + vec4(opacity * image1_fg);

      vec4 mask = texture2D(u_mask, vec2(1.0 / zoom_mask) * (0.5, -0.5) * v_position * u_maskAspect + 0.5);

      gl_FragColor = bg * mask.r + (1.0 - mask.r) * fg;
    }
  `;

  const vShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vShader, vShaderSource);
  gl.compileShader(vShader);

  const fShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fShader, fShaderSource);
  gl.compileShader(fShader);

  const program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  /** Mesh setup */
  const plane = createPlane(2.0, 2.0);

  const vertices = plane.positions.flat();
  const indices = plane.cells.flat();

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW); // prettier-ignore

  /** Attributes setup */
  const position = gl.getAttribLocation(program, 'a_position');
  gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(position);

  images.forEach((img, index) => {
    textures[index] = createTexture(gl, img);
  });

  const image0 = textures[0];
  const image1 = textures[1];
  const maskTexture = createTexture(gl, mask);

  const u_image0Location = gl.getUniformLocation(program, 'u_image0');
  const u_image1Location = gl.getUniformLocation(program, 'u_image1');
  const u_maskLocation = gl.getUniformLocation(program, 'u_mask');

  // set which texture units to render with.
  gl.uniform1i(u_image0Location, 0); // texture unit 0
  gl.uniform1i(u_image1Location, 1); // texture unit 1
  gl.uniform1i(u_maskLocation, 2); // texture unit 2

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, image0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, image1);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, maskTexture);

  const image0Aspect = gl.getUniformLocation(program, 'u_image0Aspect');
  gl.uniform2f(
    image0Aspect,
    ((images[1].height / images[1].width) * WIDTH) / HEIGHT,
    1.0
  );

  const image1Aspect = gl.getUniformLocation(program, 'u_image1Aspect');
  gl.uniform2f(
    image1Aspect,
    ((images[1].height / images[1].width) * WIDTH) / HEIGHT,
    1.0
  );

  const maskAspect = gl.getUniformLocation(program, 'u_maskAspect');
  gl.uniform2f(maskAspect, WIDTH / HEIGHT, 1.0);

  const progressUniform = gl.getUniformLocation(program, 'u_progress');

  /** Draw */
  const draw = (progress = 0) => {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1f(progressUniform, progress);

    gl.drawElements(gl.TRIANGLE_STRIP, indices.length, gl.UNSIGNED_SHORT, 0);
  };
  draw();

  let index = 0;
  let isAnimating = false;
  document.addEventListener('keydown', () => {
    if (!isAnimating) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[index % textures.length]);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, textures[(index + 1) % textures.length]);

      const properties = {
        progress: 0,
      };

      anime({
        targets: properties,
        progress: 1,
        easing: 'easeInOutSine',
        duration: 700,
        update: function() {
          draw(properties.progress);
        },
        begin: function() {
          isAnimating = true;
        },
        complete: function() {
          isAnimating = false;
          index += 1;
        },
      });
    }
  });
};

window.addEventListener('load', () => {
  init();
});

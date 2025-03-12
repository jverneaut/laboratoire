import './main.scss';
import anime from 'animejs';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/all';

gsap.registerPlugin(ScrollTrigger);

const h1 = document.querySelector('.title');

gsap.to(h1, {
  scrollTrigger: {
    trigger: h1,
    start: 'top 10%',
    end: 'top -50%',
    scrub: true,
  },
  scale: 0.125,
  top: '2vw',
});

const lenis = new Lenis({
  smooth: true,
  touchMultiplier: 1,
  wheelMultiplier: 0.5,
});

const raf = (time) => {
  lenis.raf(time);
  ScrollTrigger.update();
  requestAnimationFrame(raf);
};

requestAnimationFrame(raf);

const vShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texcoord;
  varying vec2 v_texcoord;

  void main() {
    v_texcoord = a_texcoord;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fShaderSource = `
  precision mediump float;
  varying vec2 v_texcoord;
  uniform sampler2D u_texture;
  uniform float pixelation;

  void main() {
    vec2 pos = vec2(v_texcoord.xy);

    if (pixelation > 0.0) {
      float offsetY = -1.0 * mod(pos.y, pixelation);
      pos.y += offsetY;
    }

    gl_FragColor = texture2D(u_texture, pos);
  }
`;

const loadTexture = (gl, image) => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  return texture;
};

const initImageCanvas = (img) => {
  const container = img.parentElement;
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  img.style.display = 'none';

  const gl = canvas.getContext('webgl');
  canvas.width = img.width;
  canvas.height = img.height;
  gl.viewport(0, 0, canvas.width, canvas.height);

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

  const texture = loadTexture(gl, img);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1, 0.0, 1.0, 1, -1, 1.0, 1.0, -1, 1, 0.0, 0.0, 1, 1, 1.0, 0.0,
    ]),
    gl.STATIC_DRAW
  );

  const positionLoc = gl.getAttribLocation(program, 'a_position');
  const texcoordLoc = gl.getAttribLocation(program, 'a_texcoord');
  const pixelationLoc = gl.getUniformLocation(program, 'pixelation');

  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 4 * 4, 0);
  gl.enableVertexAttribArray(texcoordLoc);
  gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 4 * 4, 2 * 4);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);

  gl.uniform1f(pixelationLoc, 0.2);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  const animateEffect = () => {
    anime({
      targets: { pixelation: 0.2 },
      pixelation: 0,
      duration: 900,
      easing: 'steps(12)',
      update: (anim) => {
        gl.uniform1f(pixelationLoc, anim.animations[0].currentValue);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
    });
  };

  const resetEffect = () => {
    anime({
      targets: { pixelation: 0 },
      pixelation: 0.2,
      duration: 900,
      easing: 'steps(12)',
      update: (anim) => {
        gl.uniform1f(pixelationLoc, anim.animations[0].currentValue);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
    });
  };

  ScrollTrigger.create({
    trigger: container,
    start: 'top 90%',
    end: 'bottom 10%',
    onEnter: animateEffect,
    onEnterBack: animateEffect,
    onLeave: resetEffect,
    onLeaveBack: resetEffect,
    markers: false,
  });
};

const init = () => {
  const images = Array.from(document.querySelectorAll('.image-container img'));
  images.forEach(initImageCanvas);
};

window.addEventListener('load', init);

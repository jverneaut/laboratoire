import './main.scss';

import mat4 from 'gl-mat4';
import createPlane from 'primitive-plane';

import vertexShaderSource from './vertex.glsl';
import fragmentShaderSource from './fragment.glsl';

const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.appendChild(canvas);

const gl = canvas.getContext('webgl');
gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);

/** Program setup */
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

/** Mesh setup */
const plane = createPlane(1.0, 1.0, 20, 20);

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

/** Uniforms setup */
const model = mat4.create();
mat4.scale(model, model, [0.5, 0.5, 0.5]);

const modelUniform = gl.getUniformLocation(program, 'u_model');
gl.uniformMatrix4fv(modelUniform, false, new Float32Array(model));

const projection = mat4.perspective(
  mat4.create(),
  Math.PI / 2,
  canvas.width / canvas.height,
  0.01,
  10
);

const projectionUniform = gl.getUniformLocation(program, 'u_projection');
gl.uniformMatrix4fv(projectionUniform, false, new Float32Array(projection));

const view = mat4.lookAt([], [0, 0, -0.5], [0, 0, 0], [0, 1, 0]);
const viewUniform = gl.getUniformLocation(program, 'u_view');
gl.uniformMatrix4fv(viewUniform, false, new Float32Array(view));

const mouse = [0, 0];
document.addEventListener('mousemove', e => {
  mouse[0] = (-2 * (e.clientX - window.innerWidth / 2)) / window.innerWidth;
  mouse[1] = (-2 * (e.clientY - window.innerHeight / 2)) / window.innerHeight;
});
const mouseUniform = gl.getUniformLocation(program, 'u_mouse');

/** Draw loop */
let time = 0;
const draw = () => {
  time += 1;
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.uniform2f(mouseUniform, mouse[0], mouse[1]);

  gl.drawElements(gl.POINTS, indices.length, gl.UNSIGNED_SHORT, 0);
  requestAnimationFrame(draw);
};
requestAnimationFrame(draw);

import './main.scss';
import DAT from 'dat.gui';

const presets = [
  {
    plane_width: 0.4,
    plane_height: 1,
    points: 10000,
    pointSize: 2.0,
    pointColor: [255, 255, 255],
    bgColor: [69, 72, 120],
    sinTimeFactorX: -0.05,
    cosTimeFactorX: 0.05,
    sinTimeFactorY: 0.1,
    cosTimeFactorY: 0.1,
    sinFactorX: 30,
    cosFactorX: 10,
    sinFactorY: 100,
    cosFactorY: 0,
  },
  {
    plane_width: 1.2,
    plane_height: 1.7,
    points: 100000,
    pointSize: 1.3,
    pointColor: [70, 173, 255],
    bgColor: [19, 23, 97],
    sinTimeFactorX: -0.11,
    cosTimeFactorX: 0,
    sinTimeFactorY: 0.07,
    cosTimeFactorY: 0.1,
    sinFactorX: -40,
    cosFactorX: 1140,
    sinFactorY: 100,
    cosFactorY: 110,
  },
  {
    plane_width: 1,
    plane_height: 1,
    points: 40000,
    pointSize: 1.5,
    pointColor: [0, 0, 0],
    bgColor: [255, 255, 255],
    sinTimeFactorX: 0.1,
    cosTimeFactorX: 0.1,
    sinTimeFactorY: 0.1,
    cosTimeFactorY: 0.1,
    sinFactorX: -55,
    cosFactorX: 67,
    sinFactorY: 70,
    cosFactorY: 40,
  },
  {
    plane_width: 1.4,
    plane_height: 0.5,
    points: 12000,
    pointSize: 1.8,
    pointColor: [255, 255, 255],
    bgColor: [0, 0, 0],
    sinTimeFactorX: 0,
    cosTimeFactorX: 0.04,
    sinTimeFactorY: 0,
    cosTimeFactorY: 0,
    sinFactorX: 0,
    cosFactorX: 65,
    sinFactorY: 30,
    cosFactorY: 30,
  },
];

let currentPreset = 0;
const options = { ...presets[currentPreset] };

const gui = new DAT.GUI({ closeOnTop: true });
gui.close();

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const vShaderSource = `
  attribute vec2 a_position;
  uniform float u_time;
  uniform float u_pointSize;

  uniform float u_sinTimeFactorX;
  uniform float u_cosTimeFactorX;
  uniform float u_sinTimeFactorY;
  uniform float u_cosTimeFactorY;

  uniform float u_sinFactorX;
  uniform float u_cosFactorX;
  uniform float u_sinFactorY;
  uniform float u_cosFactorY;

  void main() {
    vec4 position = vec4(a_position.x, a_position.y, 0.0, 1.0);
    position.x += 0.01 * sin(u_time * u_sinTimeFactorX + u_sinFactorX * a_position.x);
    position.x += 0.01 * cos(u_time * u_cosTimeFactorX + u_cosFactorX * a_position.y);
    position.y += 0.01 * sin(u_time * u_sinTimeFactorY + u_sinFactorY * a_position.x);
    position.y += 0.01 * cos(u_time * u_cosTimeFactorY + u_cosFactorY * a_position.y);

    gl_Position = position;
    gl_PointSize = u_pointSize;
  }
`;

const fShaderSource = `
  precision mediump float;
  uniform vec4 u_color;

  void main() {
    gl_FragColor = u_color;
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

const points = [];

const pointsBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

const position = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(position);
gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

const updatePoints = () => {
  const points = [];
  const axisPoints = Math.floor(Math.sqrt(options.points));

  for (let i = 0; i < options.points; i += 1) {
    points[i * 2] =
      options.plane_width * ((i % axisPoints) / axisPoints) -
      0.5 * options.plane_width;
    points[i * 2 + 1] =
      options.plane_height * (Math.floor(i / axisPoints) / axisPoints) -
      0.5 * options.plane_height;
  }

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
};

/** Uniforms */
let tick = 0;
const time = gl.getUniformLocation(program, 'u_time');
gl.uniform1f(time, tick);

const pointSize = gl.getUniformLocation(program, 'u_pointSize');
gl.uniform1f(pointSize, options.pointSize);

const color = gl.getUniformLocation(program, 'u_color');
gl.uniform4f(color, ...options.pointColor, 1);

const uniforms = {};
const uniformNames = [
  'sinTimeFactorX',
  'cosTimeFactorX',
  'sinTimeFactorY',
  'cosTimeFactorY',
  'sinFactorX',
  'cosFactorX',
  'sinFactorY',
  'cosFactorY',
];

uniformNames.forEach(name => {
  uniforms[name] = gl.getUniformLocation(program, 'u_' + name);
  gl.uniform1f(uniforms[name], options[name]);
});

/** Draw */
gl.viewport(0, 0, canvas.width, canvas.height);
const draw = () => {
  tick += 1;
  gl.uniform1f(time, tick);

  gl.clearColor(
    options.bgColor[0] / 255,
    options.bgColor[1] / 255,
    options.bgColor[2] / 255,
    1
  );
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, options.points);

  requestAnimationFrame(draw);
};

updatePoints();
requestAnimationFrame(draw);

gui
  .add(options, 'plane_width')
  .min(0)
  .max(2)
  .onChange(updatePoints)
  .listen();

gui
  .add(options, 'plane_height')
  .min(0)
  .max(2)
  .onChange(updatePoints);

gui.add(options, 'points').onChange(updatePoints);

gui
  .add(options, 'pointSize')
  .min(0)
  .max(4)
  .onChange(() => {
    gl.uniform1f(pointSize, options.pointSize);
  });

gui.addColor(options, 'pointColor').onChange(() => {
  gl.uniform4f(
    color,
    options.pointColor[0] / 255,
    options.pointColor[1] / 255,
    options.pointColor[2] / 255,
    1
  );
});

gui.addColor(options, 'bgColor');

uniformNames.forEach(uniformName => {
  gui.add(options, uniformName).onChange(() => {
    uniformNames.forEach(name => {
      gl.uniform1f(uniforms[name], options[name]);
    });
  });
});

presets.forEach((preset, index) => {
  const button = document.createElement('button');
  button.innerHTML = index + 1;
  button.className = index === currentPreset ? 'active' : '';

  button.addEventListener('click', () => {
    currentPreset = index;
    Object.assign(options, preset);
    gui.__controllers.forEach(controller => {
      controller.setValue(controller.getValue());
    });

    Array.from(document.querySelectorAll('.switcher button')).forEach(
      (button, index) => {
        button.className = index === currentPreset ? 'active' : '';
      }
    );
  });

  document.querySelector('.switcher').appendChild(button);
});

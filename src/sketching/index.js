import './main.scss';

const img = document.querySelector('img');
const dimensions = [
  devicePixelRatio * 400,
  (devicePixelRatio * (400 * img.height)) / img.width,
];

const sketch = document.querySelector('canvas.sketch');
sketch.width = dimensions[0];
sketch.height = dimensions[1];

const ctx = sketch.getContext('2d');
const points = [];

const lifespan = 2000;
const drawFrequency = 120;
const perBatch = 5;

const speed = 0.06;
const directionBase = 0.1 * Math.PI;
const directionSpan = 0.3 * Math.PI;
const brushSize = 1;
const opacity = 0.995;
const waviness = 8;
const zigouigouispeed = 0.023;

let lastTime = 0;
let lastDrawTime = 0;
const draw = time => {
  if (time - lastDrawTime > drawFrequency) {
    for (let i = 0; i < perBatch; i++) {
      points.push({
        x: Math.random() * dimensions[0],
        y: Math.random() * dimensions[1],
        direction:
          directionBase + (0.5 - Math.random()) * directionSpan * Math.PI,
        color: Math.random() > 0.5 ? 'white' : 'black',
        time,
      });
    }
    lastDrawTime = time;
  }

  points.forEach((point, index) => {
    if (point.time + lifespan < time) {
      points.splice(index, 1);
    } else {
      ctx.fillStyle = point.color;
      ctx.fillRect(
        point.x +
          speed * Math.sin(point.direction) * (time - point.time) +
          waviness *
            Math.cos(point.direction) *
            Math.cos(zigouigouispeed * (time - point.time)),
        point.y +
          speed * Math.cos(point.direction) * (time - point.time) +
          waviness *
            Math.sin(point.direction) *
            Math.cos(zigouigouispeed * (time - point.time)),
        brushSize * devicePixelRatio,
        brushSize * devicePixelRatio
      );
    }
  });

  const imgData = ctx.getImageData(0, 0, ...dimensions);
  for (let i = 0; i < imgData.data.length; i += 4) {
    imgData.data[i + 3] = opacity * imgData.data[i + 3] - 1;
  }

  ctx.putImageData(imgData, 0, 0);

  lastTime = time;
  requestAnimationFrame(draw);
};
requestAnimationFrame(draw);

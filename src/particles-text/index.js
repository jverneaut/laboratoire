import './style.css';

import { fromEvent } from 'rxjs';
import { map, scan, startWith } from 'rxjs/operators';

const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

let width = window.innerWidth * 1.5;
let height = window.innerHeight * 1.5;

canvas.width = width;
canvas.height = height;

const input = fromEvent(window.top, 'keydown');

const text = input.pipe(
  map((e) => e.key),
  scan((acc, curr) => {
    if (curr.length === 1) {
      return acc + curr;
    } else {
      if (curr === 'Backspace') {
        return acc.slice(0, acc.length - 1);
      } else {
        return acc;
      }
    }
  }),
  startWith('Type Something')
);

const drawText = (str) => {
  context.beginPath();
  context.fillStyle = 'black';
  context.font = 'bold ' + width / 8 + 'px Bebas Neue';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(str, width / 2, height / 2);
};

const clear = () => {
  context.beginPath();
  context.clearRect(0, 0, width, height);
};

let positions = [];
let particles = [];

const createParticles = () => {
  particles = [];
  positions = [];
  const imgData = context.getImageData(0, 0, width, height);
  clear();

  for (let i = 0; i < imgData.data.length; i += 4) {
    const greyLevel =
      (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
    const alpha = imgData.data[i + 3];

    if (greyLevel === 0 && alpha === 255) {
      positions.push({
        x: (i / 4) % imgData.width,
        y: Math.floor(i / 4 / imgData.width),
      });
    }
  }

  for (let i = 0; i < positions.length * 0.13; i++) {
    const pos = positions[Math.floor(Math.random() * positions.length)];
    const rotation = Math.random() * Math.PI * 2;
    const timeMultiplicator = Math.sin(Math.random() * Math.PI * 2);
    const offsetMulitplicator =
      Math.random() < 0.14
        ? 3 * Math.sin(Math.random() * Math.PI * 2)
        : 1.02 * Math.sin(Math.random() * Math.PI * 2);

    particles.push({
      x: pos.x,
      y: pos.y,
      color: `rgb(${(pos.x / width) * 255}, 0, ${255 - (pos.x / width) * 255})`,
      color: `hsl(${(360 * pos.x) / width}, 50%, 50%)`,
      rotation,
      timeMultiplicator,
      offsetMulitplicator,
    });
  }
};

text.subscribe((value) => {
  clear();
  drawText(value);
  createParticles();
});

const OFFSET = width / 200;

const mouse = [];
document.addEventListener('mousemove', (e) => {
  mouse[0] = e.clientX * 1.5;
  mouse[1] = e.clientY * 1.5;
});

let time = 0;
const anim = () => {
  clear();

  particles.forEach((particle) => {
    const offsetX = Math.sin(
      particle.rotation + 0.02 * time * particle.timeMultiplicator
    );
    const offsetY = Math.cos(
      particle.rotation + 1.5 * 0.02 * time * particle.timeMultiplicator
    );

    context.beginPath();
    context.fillStyle = particle.color;
    context.fillRect(
      particle.x + offsetX * OFFSET * particle.offsetMulitplicator,
      particle.y + offsetY * OFFSET * particle.offsetMulitplicator,
      width / 1100,
      width / 1100
    );
  });

  time += 1;
  requestAnimationFrame(anim);
};

anim();

import './style.css';
import videoSrc from './black-ink-liquid-flow-on-white.mp4';

const width = 1920 / 4;
const height = 1080 / 4;

const video = document.querySelector('video');
video.src = videoSrc;

const canvas = document.querySelector('canvas');
canvas.width = width;
canvas.height = height;

const context = canvas.getContext('2d');

let hue = 0;
let time = 0;

const anim = () => {
  time += 1;
  hue = (time / 1000) * 360;

  document.body.style.backgroundColor = `hsl(${hue}, 80%, 90%)`;

  context.drawImage(video, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);

  for (let i = 0; i < imageData.data.length; i += 4) {
    const greyLevel =
      (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
    imageData.data[i + 3] = 255 - greyLevel;
  }

  context.putImageData(imageData, 0, 0);

  requestAnimationFrame(anim);
};
anim();

import './style.css';

import videoSrc from './rosheim.mp4'; // 1280 x 720
import tvSrc from './devices/tv.png'; // 1087 x 800
import iPhoneSrc from './devices/iphone.png'; // 2880 × 5664
import macSrc from './devices/macbook.png'; // 2573 × 1495
import nokiaSrc from './devices/nokia.png'; // 600 x 828

const video = document.querySelector('video');
video.src = videoSrc;

const devices = [
  {
    src: tvSrc,
    pos: { x: 0.45, y: 0.4, width: 0.8, height: (0.8 * 755) / 1200 }, // in percent
    screen: { x0: 0, y0: 0, x1: 1, y1: 0.9 }, // in percent
    img: null,
    parallax: 0,
  },
  {
    src: macSrc,
    pos: { x: 0.6, y: 0.6, width: 0.5, height: (0.5 * 1495) / 2573 }, // in percent
    screen: { x0: 0.12, y0: 0.05, x1: 0.88, y1: 0.92 }, // in percent
    img: null,
    parallax: 0.1,
  },
  {
    src: nokiaSrc,
    pos: { x: 0.33, y: 0.65, width: 0.12, height: (0.12 * 828) / 600 }, // in percent
    screen: { x0: 0.28, y0: 0.265, x1: 0.72, y1: 0.48 }, // in percent
    img: null,
    parallax: 0.16,
  },
  {
    src: iPhoneSrc,
    pos: { x: 0.4, y: 0.65, width: 0.12, height: (0.12 * 5664) / 2880 }, // in percent
    screen: { x0: 0.08, y0: 0.035, x1: 0.92, y1: 0.965 }, // in percent
    img: null,
    parallax: 0.3,
  },
];

const width = window.innerWidth;
const height = window.innerHeight;

const canvas = document.querySelector('canvas');
canvas.width = width;
canvas.height = height;

const context = canvas.getContext('2d');

let scroll = 0;
const anim = () => {
  context.clearRect(0, 0, width, height);

  devices.forEach(device => {
    const deviceX = device.pos.x * width - 0.5 * device.pos.width * width;
    const deviceY = device.pos.y * height - 0.5 * device.pos.height * width;
    const deviceWidth = device.pos.width * width;
    const deviceHeight = device.pos.height * width;

    const videoX = 0;
    const videoY = 0;
    const videoWidth = 1280;
    const videoHeight = 720;

    const offsetX = device.parallax * scroll * (device.pos.x - 0.5) * width;
    const offsetY = device.parallax * scroll * (device.pos.y - 0.5) * height;

    const scale = 1 + scroll * device.parallax;

    context.drawImage(
      video,
      videoX,
      videoY,
      videoWidth,
      videoHeight,
      deviceX + device.screen.x0 * (deviceWidth * scale) + offsetX,
      deviceY + device.screen.y0 * (deviceHeight * scale) + offsetY,
      scale * (deviceWidth * (device.screen.x1 - device.screen.x0)),
      scale * (deviceHeight * (device.screen.y1 - device.screen.y0))
    );

    context.drawImage(
      device.img,
      deviceX + offsetX,
      deviceY + offsetY,
      scale * deviceWidth,
      scale * deviceHeight
    );
  });

  requestAnimationFrame(anim);
};

const init = async () => {
  video.load();
  // Load video
  await new Promise(resolve => video.addEventListener('loadeddata', resolve));

  // Load images
  await Promise.all(
    devices.map(
      device =>
        new Promise(async resolve => {
          const img = document.createElement('img');
          img.src = device.src;
          device.img = img;
          img.onload = resolve;
        })
    )
  );

  document.addEventListener('scroll', () => {
    scroll = window.scrollY / window.innerHeight;
  });

  anim();
};

init();

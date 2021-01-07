import './main.scss';

import anime from 'animejs';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const video = document.querySelector('video');
const bar = document.querySelector('div');

const TIME = 8000;
const DELAY = 500;
const BAND_HEIGHT = 3;

const animData = {
  progress: 0,
};

let animation;

const drawBand = progress => {
  ctx.drawImage(
    video,
    0,
    progress * video.videoHeight,
    video.videoWidth,
    BAND_HEIGHT,
    0,
    progress * canvas.height,
    canvas.width,
    (BAND_HEIGHT * canvas.height) / video.videoHeight
  );
};

const anim = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (animation) {
    animation.pause();
  }

  animData.progress = 0;

  animation = anime({
    targets: animData,
    progress: 1,
    duration: TIME,
    delay: DELAY,
    easing: 'linear',
    begin: () => {
      bar.style.opacity = 1;
      drawBand(0);
    },
    update: () => {
      bar.style.top = `calc(50% + ${(animData.progress - 0.5) *
        canvas.height}px)`;
      drawBand(animData.progress);
    },
    complete: () => {
      bar.style.opacity = 0;
      drawBand((canvas.height - BAND_HEIGHT) / canvas.height);
    },
  });
};

const init = async stream => {
  video.srcObject = stream;
  await video.play();

  canvas.width = video.clientWidth;
  canvas.height = video.clientHeight;

  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      anim();
    }
  });

  canvas.addEventListener('click', anim);
};

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
    })
    .then(init);
}

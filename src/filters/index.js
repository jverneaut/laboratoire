import Video from './Video';
import FaceDetection from './FaceDetection';

import './main.scss';

const FACE_DETECTION_RATE = 100;

const videoHTMLElement = document.querySelector('video');
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const dimensions = { x: 0.4 * 900, y: 0.4 * 1600 };

canvas.width = dimensions.x;
canvas.height = dimensions.y;

const init = async () => {
  const video = new Video(videoHTMLElement);
  await video.getStream();
  video.play();

  const faceDetection = new FaceDetection(canvas);
  faceDetection.loadModels();

  let lastTime = 0;

  const draw = (dt) => {
    video.draw(ctx, dimensions);

    if (dt - lastTime > FACE_DETECTION_RATE) {
      faceDetection.detectFace();
      lastTime = dt;
    }

    faceDetection.detectLandmarks();
    faceDetection.draw();

    requestAnimationFrame(draw);
  };

  setTimeout(() => {
    requestAnimationFrame(draw);
  }, 4000);
};

window.addEventListener('load', init);

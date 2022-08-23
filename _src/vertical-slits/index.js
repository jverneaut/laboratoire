import './main.scss';

const tmpCanvas = document.querySelector('canvas#tmp');
/** @type {CanvasRenderingContext2D} */
const tmpCtx = tmpCanvas.getContext('2d');

const imageCanvas = document.querySelector('canvas#image');
/** @type {CanvasRenderingContext2D} */
const imageCtx = imageCanvas.getContext('2d');

const stripesCanvas = document.querySelector('canvas#stripes');
/** @type {CanvasRenderingContext2D} */
const stripesCtx = stripesCanvas.getContext('2d');

let frames = 5;
const rectRatio = 0.33;

const { width, height } = tmpCanvas.getBoundingClientRect();
const setDimensions = () => {
  tmpCanvas.width = width;
  tmpCanvas.height = height;

  imageCanvas.width = width;
  imageCanvas.height = height;

  stripesCanvas.width = width;
  stripesCanvas.height = height;
};
setDimensions();

const drawImage = () => {
  imageCtx.clearRect(0, 0, width, height);
  tmpCtx.clearRect(0, 0, width, height);

  for (let i = 0; i < frames; i++) {
    tmpCtx.save();
    tmpCtx.translate(width * 0.5, height * 0.5);

    tmpCtx.rotate((((i * 360) / frames) * Math.PI) / 180);
    tmpCtx.fillRect(
      -rectRatio * width * 0.5,
      -rectRatio * width * 0.5,
      rectRatio * width,
      rectRatio * width
    );
    tmpCtx.restore();

    const imageData = tmpCtx.getImageData(0, 0, width, height);
    for (let j = 0; j < imageData.data.length; j += 4) {
      const col = (0.25 * j) % imageData.width;
      if (col % frames !== i) {
        imageData.data[j + 3] = 0;
      }
    }
    tmpCtx.putImageData(imageData, 0, 0);

    imageCtx.drawImage(tmpCanvas, 0, 0);
  }
};

drawImage();

const drawStripes = () => {
  stripesCtx.clearRect(0, 0, width, height);

  for (let i = 0; i < width; i++) {
    stripesCtx.fillRect(i * frames, 0, frames - 1, height);
  }
};

drawStripes();

const moveStripes = e => {
  const translateX = Math.floor(
    (0.1 * width * (e.clientX - 0.5 * width)) / width
  );
  const translateY = e.clientY;

  stripesCanvas.style.transform = `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px))`;
};

document.body.addEventListener('mousemove', moveStripes);

document.querySelector('input').addEventListener('input', e => {
  frames = e.target.value;
  document.querySelector('label').innerHTML = `Frames: ${frames}`;

  drawImage();
  drawStripes();
});

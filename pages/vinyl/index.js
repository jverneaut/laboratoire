import './index.scss';

const W = window.innerWidth;
const H = window.innerHeight;

const canvas = document.createElement('canvas');
canvas.width = W;
canvas.height = H;

const temp = canvas.cloneNode();
const tempCtx = temp.getContext('2d');

document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');

const drawText = text => {
  ctx.fillStyle = '#000000';
  ctx.font = '80px serif';
  ctx.fillText(text, W / 6, H / 2 + 20);
};

const strokeWidth = 40;
const drawCircle = (width = 10, stroke = strokeWidth, color = 'red') => {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.arc(W / 8, H / 2, width, 0, 2 * Math.PI);
  ctx.lineWidth = stroke;
  ctx.stroke();
};

const imgDataHeight = H / 12;

const getSharedImgData = i => {
  ctx.clearRect(0, 0, W, H);
  drawText("Je m'appelle Julien");

  const textImageData = ctx.getImageData(
    0,
    H / 2 - imgDataHeight / 2,
    W,
    imgDataHeight
  );

  drawCircle(((i * 2 + 1) * strokeWidth) / 2);
  const circleImageData = ctx.getImageData(
    0,
    H / 2 - imgDataHeight / 2,
    W,
    imgDataHeight
  );

  for (let i = 0; i < textImageData.data.length; i += 4) {
    const blackLevel = textImageData.data[i];
    const alpha = textImageData.data[i + 3];

    if (blackLevel === 0 && alpha === 255) {
      if (circleImageData.data[i] === 255) {
        textImageData.data[i] = 255;
        textImageData.data[i + 1] = 255;
        textImageData.data[i + 2] = 255;
        textImageData.data[i + 3] = 255;
      } else {
        textImageData.data[i] = 0;
        textImageData.data[i + 1] = 0;
        textImageData.data[i + 2] = 0;
        textImageData.data[i + 3] = 0;
      }
    } else {
      textImageData.data[i] = 0;
      textImageData.data[i + 1] = 0;
      textImageData.data[i + 2] = 0;
      textImageData.data[i + 3] = 0;
    }
  }

  ctx.clearRect(0, 0, W, H);

  return textImageData;
};

const sharedImgDatas = [];
for (let i = 0; i < 20; i++) {
  sharedImgDatas.push(getSharedImgData(i));
}

const decorate = () => {
  ctx.beginPath();
  for (let i = 0; i < 20; i++) {
    drawCircle(
      ((i * 2 + 1) * strokeWidth) / 2,
      strokeWidth,
      `rgba(${255 - i * 10}, ${i * 10}, 255, ${0.5 * (i / 20)})`
    );
    drawCircle(
      ((i * 2 + 1) * strokeWidth) / 2 - strokeWidth / 2,
      1,
      'rgba(255, 255, 255, 0.1)'
    );
  }
};

let time = 0;
const anim = () => {
  ctx.fillStyle = 'rgb(20, 50, 120)';
  ctx.fillRect(0, 0, W, H);
  decorate();

  for (let i = 0; i < sharedImgDatas.length; i++) {
    let rotation = Math.min(0, ((time * 12) % 5000) - i * (5000 / 17));
    rotation = (rotation * Math.PI) / 180;

    tempCtx.clearRect(0, 0, W, H);
    tempCtx.putImageData(sharedImgDatas[i], 0, H / 2 - imgDataHeight / 2);
    ctx.translate(W / 6, H / 2);
    ctx.rotate(-rotation);
    ctx.translate(-W / 6, -H / 2);
    ctx.drawImage(temp, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  time += 1;
  requestAnimationFrame(anim);
};

anim();

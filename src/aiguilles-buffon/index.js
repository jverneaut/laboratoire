import './style.css';

const piCanvas = document.querySelector('#pi');
const ctx = piCanvas.getContext('2d');

const RESOLUTION = 2;

const WIDTH = 400 * RESOLUTION;
const HEIGHT = 400 * RESOLUTION;

piCanvas.width = WIDTH;
piCanvas.height = HEIGHT;

const ALL_LENGTH = 40 * RESOLUTION;

const floorWidth = ALL_LENGTH;

class Match {
  constructor() {
    this.centerX = Math.random() * (WIDTH - ALL_LENGTH) + ALL_LENGTH / 2;
    this.centerY = Math.random() * (HEIGHT - ALL_LENGTH) + ALL_LENGTH / 2;

    this.rotation_d = Math.random() * 360;
    this.rotation_r = (this.rotation_d * Math.PI) / 180;

    this.x1 = this.centerX + (Math.sin(this.rotation_r) * ALL_LENGTH) / 2;
    this.y1 = this.centerY + (Math.cos(this.rotation_r) * ALL_LENGTH) / 2;

    this.x2 = this.centerX - (Math.sin(this.rotation_r) * ALL_LENGTH) / 2;
    this.y2 = this.centerY - (Math.cos(this.rotation_r) * ALL_LENGTH) / 2;

    this.left = Math.min(this.x1, this.x2);
    this.right = Math.max(this.x1, this.x2);

    this.length = this.right - this.left;

    this.leftMod = this.left % floorWidth;

    this.intersect = this.leftMod + this.length > floorWidth;
  }

  draw(ctx) {
    if (this.intersect) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
    } else {
      ctx.strokeStyle = 'rgba(125, 125, 125, 1)';
    }
    ctx.beginPath();
    ctx.lineWidth = RESOLUTION;
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();
  }
}

const graph = document.querySelector('#graph');
graph.width = WIDTH;
graph.height = HEIGHT / 2;

const graphCtx = graph.getContext('2d');

const graphRes = (1.5 * WIDTH) / RESOLUTION;
const graphMin = 0;
const graphMax = 0.001;

document.querySelector('.graph span:nth-of-type(1)').innerHTML =
  graphMax * 100 + '%';
document.querySelector('.graph span:nth-of-type(2)').innerHTML =
  0.5 * (graphMin + graphMax) * 100 + '%';
document.querySelector('.graph span:nth-of-type(3)').innerHTML =
  graphMin * 100 + '%';

document.querySelector('h2').innerHTML =
  '&nbsp;&nbsp;&nbsp;&nbsp;' +
  Math.floor(Math.PI * 1000000000) / 1000000000 +
  '<span>etc</span>';

let graphPoints = new Array(graphRes).fill(null);

const newMatchesNumber = 2000;

let totalMatches = 0;
let intersectingMatches = 0;

const ds = document.querySelectorAll('.d');
const digits = ['3', '1', '4', '1', '5', '9', '2', '6', '5', '3'];

const draw = () => {
  const matches = new Array(newMatchesNumber).fill(0).map(() => {
    const match = new Match();
    return match;
  });

  ctx.fillStyle = 'rgba(240, 240, 240, 0.25)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  new Array(20).fill(0).forEach((floor, index) => {
    ctx.beginPath();
    ctx.lineWidth = RESOLUTION;
    ctx.moveTo(index * floorWidth, 0);
    ctx.lineTo(index * floorWidth, HEIGHT);
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
    ctx.stroke();
  });

  matches
    .slice(matches.length - newMatchesNumber, matches.length)
    .forEach(match => {
      match.draw(ctx);
    });

  intersectingMatches += matches.filter(match => match.intersect).length;
  totalMatches += matches.length;

  const estimate =
    (2 * ALL_LENGTH * totalMatches) / (intersectingMatches * floorWidth);

  const piStr =
    estimate.toString().slice(0, 1) + estimate.toString().slice(2, 11);
  for (let i = 0; i < digits.length; i += 1) {
    if (piStr[i] === digits[i]) {
      ds[i].classList.add('true');
    } else {
      ds[i].classList.remove('true');
      break;
    }
  }

  document.querySelector('h1').innerHTML =
    'π ≈ ' + Math.floor(estimate * 1000000000) / 1000000000;
  document.querySelector('h3').innerHTML =
    totalMatches.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') +
    ' aiguilles';

  const error = Math.abs(Math.PI - estimate) / Math.PI;

  document.querySelector('h4').innerHTML =
    'Erreur : ' + Math.round(error * 100 * 10000) / 10000 + '%';

  graphPoints = [...graphPoints.slice(1, graphRes - 1), error];

  graphCtx.fillStyle = 'rgba(240, 240, 240, 1)';
  graphCtx.fillRect(0, 0, WIDTH, HEIGHT / 2);
  graphPoints.forEach((graphPoint, index) => {
    if (graphPoint === null) return;
    const point = Math.max(
      0,
      (HEIGHT / 2) * (1 - (graphPoint - graphMin) / graphMax)
    );
    const prevPoint = graphPoints[index - 1]
      ? Math.max(
          0,
          (HEIGHT / 2) * (1 - (graphPoints[index - 1] - graphMin) / graphMax)
        )
      : 0;

    graphCtx.fillStyle = 'rgba(50, 50, 50, 0.2)';
    graphCtx.fillRect((WIDTH * index) / graphRes, point - 1, 1, HEIGHT / 2);

    graphCtx.beginPath();
    graphCtx.lineWidth = RESOLUTION;
    graphCtx.strokeStyle = 'black';
    graphCtx.moveTo((WIDTH * (index - 1)) / graphRes, prevPoint);
    graphCtx.lineTo((WIDTH * index) / graphRes, point);
    graphCtx.stroke();
  });

  requestAnimationFrame(draw);
};

draw();

import './main.scss';
import {
  map,
  mapTo,
  distinctUntilChanged,
  startWith,
  scan,
  last,
} from 'rxjs/operators';
import { fromEvent, merge, zip, combineLatest } from 'rxjs';

const body = document.body;
const container = document.querySelector('.container');
const canvas = document.querySelector('canvas');
const stick = document.querySelector('.stick');
const glow = document.querySelector('.glow');

const $bodyMouseMove = fromEvent(body, 'mousemove');
const $bodyMouseUp = fromEvent(body, 'mouseup');
const $bodyMouseDown = fromEvent(body, 'mousedown');
const $canvasMouseMove = fromEvent(canvas, 'mousemove');

const MOUSE_STATE_DOWN = 'mouse_down';
const MOUSE_STATE_UP = 'mouse_up';

const $mouseState = merge(
  $bodyMouseDown.pipe(mapTo(MOUSE_STATE_DOWN)),
  $bodyMouseUp.pipe(mapTo(MOUSE_STATE_UP))
).pipe(startWith(MOUSE_STATE_UP), distinctUntilChanged());

const $mouseBodyPosition = $bodyMouseMove.pipe(
  map(e => ({ x: e.pageX, y: e.pageY })),
  distinctUntilChanged()
);

$mouseBodyPosition.subscribe(e => {
  container.style.transform = `rotateX(${-4 *
    2 *
    (e.y / window.innerHeight - 0.5)}deg) rotateY(${4 *
    2 *
    (e.x / window.innerWidth - 0.5)}deg)`;
  stick.style.transform = `translate(calc(-50% + ${e.x}px), ${
    e.y
  }px) rotate(${(-180 * (e.x - 0.5 * window.innerWidth)) /
    window.innerWidth}deg)`;

  glow.style.transform = `translateY(-${(200 * e.x) / window.innerWidth}px)`;
});

const $mouseCanvasPosition = $canvasMouseMove.pipe(
  map(e => ({
    x: e.pageX - e.target.getBoundingClientRect().left,
    y: e.pageY - e.target.getBoundingClientRect().top,
  })),
  distinctUntilChanged()
);

const $drawingPoints = combineLatest($mouseCanvasPosition, $mouseState).pipe(
  map(([canvasPos, state]) => [{ ...canvasPos, timestamp: Date.now() }, state]),
  scan((acc, [canvasPos, state]) => {
    if (state === MOUSE_STATE_UP) return [];
    if (acc.length === 0) return [canvasPos, canvasPos];
    return [...acc, canvasPos];
  }, [])
);

const ctx = canvas.getContext('2d');

$drawingPoints.subscribe(points => {
  if (points.length > 1) {
    const lastPoint = points[points.length - 1];
    const prevPoint = points[points.length - 2];

    ctx.beginPath();
    ctx.strokeStyle = `hsl(${(2 * 360 * lastPoint.x) /
      canvas.width}, 100%, 55%)`;
    ctx.lineWidth = 3;
    ctx.moveTo(prevPoint.x, prevPoint.y);
    ctx.lineTo(lastPoint.x, lastPoint.y);
    ctx.fill();
    ctx.stroke();
  }
});

import './main.scss';

import {
  Engine,
  Render,
  World,
  Bodies,
  Mouse,
  MouseConstraint,
} from 'matter-js';

const engine = Engine.create({});

const render = Render.create({
  element: document.querySelector('.world'),
  engine,
  options: {
    wireframes: false,
    background: 'transparent',
    width: window.innerWidth,
    height: window.innerHeight,
  },
});

const ballsRadius = 60;

const ballsCoordinates = [
  {
    x: window.innerWidth * 0.75,
    y: window.innerHeight * 0.2,
    radius: ballsRadius,
  },
  {
    x: window.innerWidth * 0.75,
    y: window.innerHeight * 0.4,
    radius: ballsRadius,
  },
  {
    x: window.innerWidth * 0.75,
    y: window.innerHeight * 0.6,
    radius: ballsRadius,
  },
];

const balls = ballsCoordinates.map(({ x, y, radius }) => {
  const body = Bodies.circle(x, y, radius);
  body.restitution = 0.8;

  return body;
});

const wallsThickness = 100;

const floor = Bodies.rectangle(
  window.innerWidth * 0.5,
  window.innerHeight + 0.5 * wallsThickness,
  window.innerWidth,
  wallsThickness,
  {
    isStatic: true,
  }
);

const ceiling = Bodies.rectangle(
  window.innerWidth * 0.5,
  -0.5 * wallsThickness,
  window.innerWidth,
  wallsThickness,
  {
    isStatic: true,
  }
);

const leftWall = Bodies.rectangle(
  -0.5 * wallsThickness,
  0.5 * window.innerHeight,
  wallsThickness,
  window.innerHeight,
  {
    isStatic: true,
  }
);

const rightWall = Bodies.rectangle(
  window.innerWidth + 0.5 * wallsThickness,
  0.5 * window.innerHeight,
  wallsThickness,
  window.innerHeight,
  {
    isStatic: true,
  }
);

const walls = [floor, ceiling, leftWall, rightWall];

const bodies = [...balls, ...walls];

const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: {
    stiffness: 0.2,
    render: {
      visible: false,
    },
  },
});

World.add(engine.world, mouseConstraint);
World.add(engine.world, bodies);
Engine.run(engine);
Render.run(render);

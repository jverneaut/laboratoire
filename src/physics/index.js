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

const balls = new Array(100).fill(0).map(() => {
  const body = Bodies.circle(
    Math.random() * window.innerWidth,
    Math.random() * window.innerHeight,
    Math.random() < 0.7
      ? Math.sqrt(window.innerWidth * window.innerHeight) * 0.03
      : Math.random() < 0.7
      ? Math.sqrt(window.innerWidth * window.innerHeight) * 0.01
      : Math.sqrt(window.innerWidth * window.innerHeight) * 0.05
  );
  body.restitution = 0.5;

  return body;
});

const paddle = Bodies.rectangle(
  window.innerWidth * 0.5,
  window.innerHeight * 0.5,
  Math.min(window.innerWidth * 0.1, 60),
  Math.min(window.innerWidth * 0.5, 400),
  {
    render: {
      fillStyle: 'white',
      strokeStyle: '#999',
      lineWidth: 1,
    },
  }
);

const wallsThickness = 1000;

const floor = Bodies.rectangle(
  window.innerWidth * 0.5,
  window.innerHeight + 0.5 * wallsThickness,
  window.innerWidth * 2,
  wallsThickness,
  {
    isStatic: true,
  }
);

const ceiling = Bodies.rectangle(
  window.innerWidth * 0.5,
  -0.5 * wallsThickness,
  window.innerWidth * 2,
  wallsThickness,
  {
    isStatic: true,
  }
);

const leftWall = Bodies.rectangle(
  -0.5 * wallsThickness,
  0.5 * window.innerHeight,
  wallsThickness,
  window.innerHeight * 2,
  {
    isStatic: true,
  }
);

const rightWall = Bodies.rectangle(
  window.innerWidth + 0.5 * wallsThickness,
  0.5 * window.innerHeight,
  wallsThickness,
  window.innerHeight * 2,
  {
    isStatic: true,
  }
);

const walls = [floor, ceiling, leftWall, rightWall];

const bodies = [...balls, paddle, ...walls];

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

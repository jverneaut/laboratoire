import './main.scss';

const container = document.querySelector('#map');
const animateButton = document.querySelector('#animate');

const c = (state) => ({
  state,
  x: 0,
  y: 0,
  topLeftDistance: 0,
  topRightDistance: 0,
  bottomLeftDistance: 0,
  bottomRightDistance: 0,
  distance: 0,
});

// const grid = [
//   [c(1), c(1), c(0), c(0)],
//   [c(1), c(1), c(0), c(1)],
//   [c(1), c(1), c(0), c(0)],
// ];

// const grid = [
//   [c(1), c(0), c(1), c(1), c(1), c(1), c(1), c(1)],
//   [c(1), c(0), c(1), c(1), c(1), c(1), c(1), c(1)],
//   [c(1), c(1), c(1), c(1), c(1), c(1), c(1), c(1)],
//   [c(1), c(1), c(1), c(1), c(1), c(1), c(1), c(1)],
//   [c(1), c(1), c(0), c(1), c(0), c(1), c(1), c(1)],
//   [c(1), c(1), c(1), c(1), c(1), c(1), c(0), c(1)],
//   [c(1), c(1), c(0), c(1), c(1), c(1), c(1), c(1)],
//   [c(1), c(1), c(1), c(1), c(1), c(0), c(1), c(1)],
//   [c(1), c(1), c(1), c(1), c(1), c(1), c(1), c(1)],
//   [c(1), c(0), c(1), c(1), c(1), c(1), c(1), c(1)],
//   [c(1), c(0), c(1), c(1), c(1), c(1), c(1), c(1)],
//   [c(1), c(1), c(1), c(1), c(1), c(1), c(1), c(1)],
//   [c(1), c(1), c(1), c(1), c(1), c(1), c(1), c(1)],
// ];

const upscale = 2;

const STROKE_WIDTH = 2;
const CELL_WIDTH = upscale * 6;
const CELL_HEIGHT = upscale * 6;

const COLUMNS = 60;
const ROWS = 120;

// const probability = 0.1;
const probability = 0.05;

const grid = [...new Array(ROWS)].map(() =>
  [...new Array(COLUMNS)].map(() => c(Math.random() < probability ? 0 : 1))
);

grid.forEach((row, y) => {
  row.forEach((cell, x) => {
    cell.x = x;
    cell.y = y;
  });
});

const baseCanvas = document.createElement('canvas');
baseCanvas.style.width = `${(1 / upscale) * grid[0].length * CELL_WIDTH}px`;
baseCanvas.style.height = `${(1 / upscale) * grid.length * CELL_HEIGHT}px`;

baseCanvas.width = grid[0].length * CELL_WIDTH;
baseCanvas.height = grid.length * CELL_HEIGHT;

container.appendChild(baseCanvas);

grid.forEach((row, y) => {
  row.forEach((cell, x) => {
    const ctx = baseCanvas.getContext('2d');
    ctx.fillStyle = cell.state === 1 ? 'black' : 'white';
    ctx.fillRect(x * CELL_WIDTH, y * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
  });
});

const lookup = (cell, key, dX, dY) => {
  const targetX = cell.x + dX;
  if (targetX < 0 || targetX >= grid[0].length) {
    return 0;
  }

  const targetY = cell.y + dY;
  if (targetY < 0 || targetY >= grid.length) {
    return 0;
  }

  return grid[targetY][targetX].state === 1 ? grid[targetY][targetX][key] : 0;
};

const computeTopLeftDistances = () => {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      grid[y][x].topLeftDistance = 0;
    }
  }

  // Compute top left distance
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x];
      cell.topLeftDistance =
        cell.state === 0
          ? 0
          : Math.min(
              lookup(cell, 'topLeftDistance', 0, -1),
              lookup(cell, 'topLeftDistance', -1, 0),
              lookup(cell, 'topLeftDistance', -1, -1)
            ) + 1;
    }
  }
};

computeTopLeftDistances();

// // Render canvases
// const colors = {
//   topLeftDistance: [160, 0, 0],
// };

// Array.from(Object.keys(colors)).forEach((key) => {
//   const canvas = document.createElement('canvas');
//   canvas.width = grid[0].length * CELL_WIDTH;
//   canvas.height = grid.length * CELL_HEIGHT;

//   container.appendChild(canvas);

//   grid.forEach((row, y) => {
//     row.forEach((cell, x) => {
//       if (cell.state !== 1) return;

//       const ctx = canvas.getContext('2d');

//       const colorValue =
//         (cell[key] + 1) / Math.max(grid.length, grid[0].length);

//       ctx.fillStyle = `rgb(${colors[key]
//         .map((c) => c * colorValue + 255 * (1 - colorValue))
//         .join(', ')})`;

//       ctx.fillRect(x * CELL_WIDTH, y * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);

//       ctx.fillStyle = `rgb(${colors[key].join(', ')})`;
//       ctx.fillText(
//         cell[key],
//         x * CELL_WIDTH + 0.5 * CELL_WIDTH,
//         y * CELL_HEIGHT + 0.5 * CELL_HEIGHT
//       );
//     });
//   });
// });

const squares = [];

const hasNotSquared = (grid) =>
  grid
    .flat()
    .flat()
    .filter((cell) => cell.state === 1).length > 0;

let iterations = 0;

do {
  iterations += 1;

  computeTopLeftDistances();
  const flat = grid.flat().flat();

  const maxDistance = Math.max(...flat.map((cell) => cell.topLeftDistance));
  const maxDistanceCells = flat.filter(
    (cell) => cell.topLeftDistance === maxDistance
  );

  const maxDistanceCell = maxDistanceCells.sort((a, b) => {
    const aDistanceToBottomRight = Math.sqrt(
      Math.pow(grid.length - a.y, 2) + Math.pow(grid[0].length - a.x, 2)
    );

    const bDistanceToBottomRight = Math.sqrt(
      Math.pow(grid.length - b.y, 2) + Math.pow(grid[0].length - b.x, 2)
    );

    return aDistanceToBottomRight - bDistanceToBottomRight;
  })[0];

  const square = {
    x: maxDistanceCell.x - maxDistance + 1,
    y: maxDistanceCell.y - maxDistance + 1,
    width: maxDistance,
    height: maxDistance,
  };

  squares.push(square);

  for (let y = square.y; y < square.y + square.height; y++) {
    for (let x = square.x; x < square.x + square.width; x++) {
      grid[y][x].state = 0;
    }
  }
} while (hasNotSquared(grid));

console.log({ iterations });

const ctx = baseCanvas.getContext('2d');
ctx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);

const colors = {
  '#fff001': 1,
  '#ff0101': 1,
  '#0101fd': 1,
  '#f9f9f9': 3,
  // '#30303a': 1,
  black: 1,
};

const colorsArray = Object.keys(colors)
  .map((color) => [...new Array(colors[color])].fill(color))
  .flat();

squares.forEach((square) => {
  square.rnd1 = Math.random();
  square.rnd2 = Math.random();
  square.rnd3 = Math.random();
  square.rnd4 = Math.random();
  square.rnd5 = Math.random();
  square.dir = Math.random() > 0.5;

  square.color = colorsArray[Math.floor(Math.random() * colorsArray.length)];
  square.animColor =
    colorsArray[Math.floor(Math.random() * colorsArray.length)];
});

const draw = () => {
  ctx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
  squares.forEach((square) => {
    ctx.fillStyle = square.color;
    ctx.fillRect(
      square.x * CELL_WIDTH,
      square.y * CELL_HEIGHT,
      square.width * CELL_WIDTH,
      square.height * CELL_HEIGHT
    );

    ctx.lineWidth = upscale * STROKE_WIDTH;
    ctx.strokeStyle = 'black';
    ctx.strokeRect(
      square.x * CELL_WIDTH,
      square.y * CELL_HEIGHT,
      square.width * CELL_WIDTH,
      square.height * CELL_HEIGHT
    );

    ctx.strokeRect(
      0.5 * STROKE_WIDTH,
      0.5 * STROKE_WIDTH,
      baseCanvas.width - STROKE_WIDTH,
      baseCanvas.height - STROKE_WIDTH
    );
  });
};

draw();

let time = 0;
let animating = false;

const animate = () => {
  time += 1;

  draw();

  squares.forEach((square) => {
    // const width = Math.pow(
    //   0.5 * (1 + Math.tan(0.1 * square.rnd2 * time + square.rnd1)),
    //   3
    // );

    // const sine = Math.sin(
    //   (0.02 + square.rnd2 * 0.02) * time + Math.PI * square.rnd1
    // );
    // const width = Math.pow(sine, 5);

    // const sine = Math.sin(0.02 * time + Math.PI);
    // const rounded = 0.5 * (1 + sine);
    // const width = Math.pow(rounded, 0.5);

    // const time = 0.1 * time;
    // const k = 1;
    // const width =
    //   (0.5 + Math.sin(time * Math.PI - Math.PI / 2) / 2) ^
    //   ((2 * (1 - time)) ^ k);

    // // Good!
    // const dt = (0.02 + 0.01 * square.rnd2) * time;
    // const sine = Math.sign(Math.sin(dt)) * Math.sqrt(Math.abs(Math.sin(dt)));
    // const width = 0.5 * sine + 0.5;

    const dt = 0.4 * ((0.01 + 0.03 * square.rnd2) * time + square.rnd4 * 1000);
    const sine = Math.sin(dt);

    const k = 2 + square.rnd4 * 3;
    const curve = Math.atan(sine * k) / Math.atan(k);

    const width = 9 * (0.5 * curve);

    const range = 100 + square.y * 10;
    // const factor = Math.max((range - time) / range, 0);
    // const factor = Math.sin(time * 0.1 + 0.01 * square.y);
    const factor = Math.sin(time * 0.01 + 0.2 * square.y);

    const scale = width * factor;

    // 𝑓𝑘(𝑥)=arctan(𝑘⋅sin𝑥)/arctan𝑘

    ctx.fillStyle = square.animColor;
    ctx.fillRect(
      square.x * CELL_WIDTH,
      square.y * CELL_HEIGHT,
      (square.dir ? scale : 1) * square.width * CELL_WIDTH,
      (square.dir ? 1 : scale) * square.height * CELL_HEIGHT
    );

    ctx.lineWidth = upscale * STROKE_WIDTH;
    ctx.strokeStyle = 'black';
    ctx.strokeRect(
      square.x * CELL_WIDTH,
      square.y * CELL_HEIGHT,
      (square.dir ? scale : 1) * square.width * CELL_WIDTH,
      (square.dir ? 1 : scale) * square.height * CELL_HEIGHT
    );
  });

  if (animating) {
    requestAnimationFrame(animate);
  }
};

animateButton.addEventListener('click', () => {
  if (!animating) {
    animating = true;
    animate();
  } else {
    animating = false;
  }
});

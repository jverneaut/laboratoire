import './style.css';

const container = document.querySelector('main');

const tiles = [
  { x: 0, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: 2 },
  { x: 1, y: 2 },
  { x: 1, y: 3 },
  { x: 0, y: 3 },
  { x: 0, y: 4 },
  { x: 1, y: 4 },
  { x: 2, y: 4 },
  { x: 2, y: 3 },
  { x: 2, y: 2 },
  { x: 2, y: 1 },
  { x: 2, y: 0 },
  { x: 1, y: 0 },
].map((tile, index, tilesArr) => {
  const currentTile = tile;
  const nextTile =
    tilesArr[(index + tilesArr.length + 1) % tilesArr.length] || {};

  let dir;
  if (currentTile.x !== nextTile.x) {
    if (currentTile.x < nextTile.x) {
      dir = 'right';
    } else {
      dir = 'left';
    }
  } else {
    if (currentTile.y < nextTile.y) {
      dir = 'down';
    } else {
      dir = 'up';
    }
  }

  return {
    ...tile,
    dir,
  };
});

let width = window.innerWidth;
let height = window.innerHeight;

tiles.forEach((tile, index) => {
  const tileEl = document.createElement('section');
  tileEl.innerHTML = `<h2>${index}<span>${tile.dir}</span></h2>`;
  tileEl.className = tile.dir;

  container.appendChild(tileEl);
});

const positionTiles = () => {
  document.querySelectorAll('section').forEach((tile, index) => {
    Object.assign(tile.style, {
      width: width + 'px',
      height: height + 'px',
      left: tiles[index].x * width + 'px',
      top: tiles[index].y * height + 'px',
    });
  });
};

const setSizes = () => {
  width = window.innerWidth;
  height = window.innerHeight;
  positionTiles();
};

setSizes();
window.onresize = setSizes;

let scroll = 0;
document.onwheel = e => {
  scroll += e.deltaY;
};

const animate = () => {
  const currentTileIndex = Math.floor(scroll / height);

  const currentTile =
    tiles[(currentTileIndex + tiles.length) % tiles.length] || {};
  const nextTile =
    tiles[(currentTileIndex + tiles.length + 1) % tiles.length] || {};

  const scrollX = currentTile.x * width;
  const scrollY = currentTile.y * height;

  const tileScroll = scroll - currentTileIndex * height;

  let dir;
  if (currentTile.x !== nextTile.x) {
    if (currentTile.x < nextTile.x) {
      dir = 'right';
    } else {
      dir = 'left';
    }
  } else {
    if (currentTile.y < nextTile.y) {
      dir = 'down';
    } else {
      dir = 'up';
    }
  }

  switch (dir) {
    case 'down':
      container.style.transform = `translate3d(${-scrollX}px, ${-(
        scrollY + tileScroll
      )}px, 0)`;
      break;
    case 'up':
      container.style.transform = `translate3d(${-scrollX}px, ${-(
        scrollY - tileScroll
      )}px, 0)`;
      break;
    case 'right':
      container.style.transform = `translate3d(${-(
        scrollX +
        (width * tileScroll) / height
      )}px, ${-scrollY}px, 0)`;
      break;
    case 'left':
      container.style.transform = `translate3d(${-(
        scrollX -
        (width * tileScroll) / height
      )}px, ${-scrollY}px, 0)`;
      break;
    default:
      break;
  }

  requestAnimationFrame(animate);
};

requestAnimationFrame(animate);

import './style.css';

const list = document.querySelector('ul');

let xStart = 0;
let scrollStart = 0;

const setScroll = e => {
  list.scroll(xStart - e.clientX + scrollStart, 0);
  list.scrollTo(xStart - e.clientX + scrollStart, 0);
};

list.addEventListener('mousedown', e => {
  list.style.cursor = 'grabbing';
  list.style.scrollSnapType = 'none';
  xStart = e.clientX;
  scrollStart = list.scrollLeft;
  document.addEventListener('mousemove', setScroll);
});

list.addEventListener('mouseup', () => {
  list.style.cursor = 'grab';
  list.style.scrollSnapType = 'x mandatory';
  document.removeEventListener('mousemove', setScroll);
});

import './main.scss';

document.body.addEventListener('click', e => {
  if (document.querySelector('h1')) {
    document.querySelector('h1').remove();
  }
  createCircleText(e.clientX, e.clientY);
});

let timeoutId;
const createCircleText = (x, y) => {
  const radius = 80;

  const text = 'Lorem ipsum dolor sit amet - 2020';
  const container = document.createElement('div');
  container.style.width = 2 * radius + 'px';
  container.style.height = 2 * radius + 'px';
  container.style.position = 'absolute';
  container.style.left = x + 'px';
  container.style.top = y + 'px';

  const letters = text.split('');

  letters.forEach((letter, index) => {
    const span = document.createElement('span');
    span.innerHTML = letter;
    span.style.position = 'absolute';

    const radians = Math.PI / 2 + index / 6;

    span.style.left = Math.cos(radians) * radius + 'px';
    span.style.top = Math.sin(radians) * radius + 'px';
    span.style.transform = `translate(-50%, -50%) rotate(${0.5 * Math.PI +
      radians}rad)`;

    container.appendChild(span);
  });

  document.body.appendChild(container);

  const img = document.querySelector('img');
  img.style.visibility = 'visible';
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    img.style.visibility = 'hidden';
  }, 1700);
};

import './main.scss';

const list = document.querySelector('ul');
const links = document.querySelectorAll('a');

links.forEach(link => {
  link.addEventListener('mouseenter', () => {
    links.forEach(link => {
      link.style.filter = 'blur(20px)';
      link.style.opacity = 0.5;
      link.style.transform = '';
    });

    link.style.filter = '';
    link.style.opacity = '';
    link.style.transform = 'translateX(-8px)';
  });

  link.addEventListener('mouseleave', () => {
    links.forEach(link => {
      link.style.filter = '';
      link.style.opacity = '';
      link.style.transform = '';
    });
  });
});

let mousePos = [window.innerWidth / 2, window.innerHeight / 2];
let calculatedMousePos = mousePos;

document.body.addEventListener('mousemove', e => {
  mousePos = [e.clientX, e.clientY];
});

const anim = () => {
  calculatedMousePos[0] += 0.06 * (mousePos[0] - calculatedMousePos[0]);
  calculatedMousePos[1] += 0.06 * (mousePos[1] - calculatedMousePos[1]);

  list.style.transform = `translate(${(100 *
    (calculatedMousePos[0] - window.innerWidth / 2)) /
    window.innerWidth}px, ${(200 *
    (calculatedMousePos[1] - window.innerHeight / 2)) /
    window.innerHeight}px)`;

  requestAnimationFrame(anim);
};
anim();

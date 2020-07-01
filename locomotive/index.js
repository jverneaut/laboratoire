import './scss/main.scss';

import LocomotiveScroll from 'locomotive-scroll';
const scroll = new LocomotiveScroll({
  el: document.querySelector('[data-scroll-container]'),
  smooth: true,
});

const sections = Array.from(document.querySelectorAll('.section'));
const imagesContainers = Array.from(document.querySelectorAll('.section__img'));
const images = Array.from(document.querySelectorAll('.section__img img'));
const contentContainers = Array.from(
  document.querySelectorAll('.section__content-container')
);

const setImagesStyles = e => {
  imagesContainers.forEach((imageContainer, index) => {
    const imagePosition = imageContainer.offsetTop + sections[index].offsetTop;
    const percent = -(imagePosition - e.scroll.y - window.innerHeight) / 1000;

    imageContainer.style.transform = imageContainer.style.transform.replace(
      /rotate\(-?\d*\.?\d*deg\)/,
      ''
    );
    imageContainer.style.transform += `rotate(${percent * -5}deg)`;

    images[index].style.transform = `scale(${1.05 + (1 - percent) / 6})`;

    contentContainers[
      index
    ].style.transform = imageContainer.style.transform.replace(
      /rotate\(-?\d*\.?\d*deg\)/,
      ''
    );
    contentContainers[index].style.transform += `rotate(${percent * 5}deg)`;
  });
};

scroll.on('scroll', setImagesStyles);

window.addEventListener('load', () => {
  setImagesStyles({ scroll: { y: 0 } });
  document.querySelector('main').classList.remove('loading');
});

import './main.scss';

import Slider from './Slider';

const canvas = document.querySelector('canvas');

window.addEventListener('load', () => {
  const images = document.querySelectorAll('img');
  const slider = new Slider(canvas);

  images.forEach(image => {
    slider.addSlide({
      src: image.src,
      width: image.width,
      height: image.height,
    });
  });
});

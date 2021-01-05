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

  let open = false;
  window.addEventListener('keydown', e => {
    if (['Space', 'Enter'].includes(e.code)) {
      open = !open;

      if (open) {
        slider.open();
      } else {
        slider.close();
      }
    }

    if (e.code == 'ArrowRight') {
      slider.next();
    }

    if (e.code == 'ArrowLeft') {
      slider.prev();
    }
  });
});

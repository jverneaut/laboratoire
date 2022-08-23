import * as twgl from 'twgl.js';
import createPlane from 'primitive-plane';
import anime from 'animejs';

import vShaderSource from './shaders/vertex.glsl';
import fShaderSource from './shaders/fragment.glsl';

const defaultOptions = {
  base: {
    subdivisions: [30, 30],
    dimensions: [240, 400],
    zoom: 1.5,
    upscale: 1,
    gap: 20,
  },
  open: {
    gap: 160,
  },
};

const mix = (a, b, y) => a * (1 - y) + b * y;

export default class Slider {
  constructor(canvas, optionsOverrides = {}) {
    this.canvas = canvas;
    this.options = Object.assign(defaultOptions, optionsOverrides);

    this.setup();
    this.resize();

    this.slides = [];
    this.animatedProperties = {
      open: 0,
      index: 0,
    };

    this.canvas.addEventListener('mousemove', this.hover.bind(this));

    this.currentX = 0;
    this.targetX = this.currentX;

    this.canvas.addEventListener('mousedown', this.mousedown.bind(this));
    this.canvas.addEventListener('mousemove', this.mousemove.bind(this));
    this.canvas.addEventListener('mouseup', this.mouseup.bind(this));

    window.addEventListener('keydown', this.keydown.bind(this));

    window.addEventListener('resize', this.resize.bind(this));
    requestAnimationFrame(this.update.bind(this));
  }

  setup() {
    this.gl = this.canvas.getContext('webgl');

    twgl.setDefaults({ attribPrefix: 'a_' });

    this.programInfo = twgl.createProgramInfo(this.gl, [
      vShaderSource,
      fShaderSource,
    ]);

    this.plane = createPlane(
      ...this.options.base.dimensions,
      ...this.options.base.subdivisions
    );

    this.arrays = {
      position: this.plane.positions.flat(),
      indices: this.plane.cells.flat(),
      texcoord: this.plane.uvs.flat(),
    };

    this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, this.arrays);

    this.uniforms = {
      u_resolution: [
        this.canvas.width * this.options.base.upscale * window.devicePixelRatio,
        this.canvas.height *
          this.options.base.upscale *
          window.devicePixelRatio,
      ],
      u_scale: this.options.base.upscale * window.devicePixelRatio,
    };
  }

  getTextureScale(containerDimensions, textureDimensions) {
    if (
      containerDimensions[0] / containerDimensions[1] <
      textureDimensions[0] / textureDimensions[1]
    ) {
      return [
        containerDimensions[0] /
          containerDimensions[1] /
          (textureDimensions[0] / textureDimensions[1]),
        1,
      ];
    } else {
      return [
        1,
        containerDimensions[1] /
          containerDimensions[0] /
          (textureDimensions[1] / textureDimensions[0]),
      ];
    }
  }

  resize() {
    twgl.resizeCanvasToDisplaySize(
      this.canvas,
      this.options.base.upscale * window.devicePixelRatio
    );
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    this.uniforms = {
      ...this.uniforms,
      u_resolution: [
        this.canvas.width * this.options.base.upscale * window.devicePixelRatio,
        this.canvas.height *
          this.options.base.upscale *
          window.devicePixelRatio,
      ],
      u_scale: this.options.base.upscale * window.devicePixelRatio,
    };
  }

  addSlide(options) {
    const texture = twgl.createTexture(this.gl, options);

    const slide = {
      bufferInfo: this.bufferInfo,
      programInfo: this.programInfo,
      texture,
      width: options.width,
      height: options.height,
      hover: 0,
    };

    this.slides.push(slide);
  }

  open() {
    if (this.hoveredIndex !== null) {
      anime({
        targets: this.animatedProperties,
        index: this.hoveredIndex,
        easing: 'easeInOutSine',
        duration: 800,
      });
    }

    anime({
      targets: this.animatedProperties,
      open: 1,
      easing: 'easeInOutQuart',
      duration: 1800,
    });
  }

  close() {
    anime({
      targets: this.animatedProperties,
      open: 0,
      easing: 'easeInOutQuart',
      duration: 1800,
    });
  }

  next() {
    anime({
      targets: this.animatedProperties,
      index: Math.round(this.animatedProperties.index) + 1,
      easing: 'easeOutQuart',
      duration: 800,
    });
  }

  prev() {
    anime({
      targets: this.animatedProperties,
      index: Math.round(this.animatedProperties.index) - 1,
      easing: 'easeOutQuart',
      duration: 800,
    });
  }

  hover(e) {
    const hoveredIndex = Math.floor(
      (e.clientX -
        0.5 * window.innerWidth +
        0.5 * this.options.base.dimensions[0] +
        0.5 * this.options.base.gap) /
        (this.options.base.dimensions[0] + this.options.base.gap) +
        this.animatedProperties.index
    );

    if (
      hoveredIndex > -1 &&
      hoveredIndex < this.slides.length &&
      Math.abs(e.clientY - 0.5 * window.innerHeight) <
        0.5 * this.options.base.dimensions[1]
    ) {
      document.body.style.cursor = 'pointer';
      if (hoveredIndex !== this.hoveredIndex) {
        this.slides.forEach((slide, index) => {
          anime({
            targets: slide,
            hover: index == hoveredIndex ? 0 : 1,
            easing: 'easeOutQuart',
            duration: 600,
          });
        });
      }
      this.hoveredIndex = hoveredIndex;
    } else {
      document.body.style.cursor = '';
      this.slides.forEach((slide, index) => {
        anime({
          targets: slide,
          hover: 0,
          easing: 'easeOutQuart',
          duration: 600,
        });
      });
      this.hoveredIndex = null;
    }
  }

  mousedown(e) {
    this.moved = false;
    this.isMousedown = true;
    this.startX = e.clientX;
    this.lastX = this.currentX;
  }

  mousemove(e) {
    if (this.isMousedown) {
      this.moved = true;
      this.targetX = this.lastX + (e.clientX - this.startX);
      document.body.style.cursor = 'grabbing';
    }
  }

  mouseup() {
    this.isMousedown = false;

    if (this.moved === false) {
      if (this.animatedProperties.open === 0) {
        this.open();
      } else if (this.animatedProperties.open === 1) {
        this.close();
      }
    }

    if (this.hoveredIndex) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = '';
    }

    this.moved = false;
  }

  keydown(e) {
    if (['Space', 'Enter'].includes(e.code)) {
      if (this.animatedProperties.open === 0) {
        this.open();
      } else if (this.animatedProperties.open === 1) {
        this.close();
      }
    }

    if (e.code == 'ArrowRight') {
      this.next();
    }

    if (e.code == 'ArrowLeft') {
      this.prev();
    }
  }

  draw(time) {
    this.slides.forEach((slide, index) => {
      const scale = [
        mix(
          1,
          window.innerWidth / this.options.base.dimensions[0],
          this.animatedProperties.open
        ),
        mix(
          1,
          window.innerHeight / this.options.base.dimensions[1],
          this.animatedProperties.open
        ),
      ];

      const pos = [
        (0.5 * window.innerWidth) / scale[0] +
          (index - this.animatedProperties.index) *
            (this.options.base.dimensions[0] +
              mix(
                this.options.base.gap,
                this.options.open.gap,
                this.animatedProperties.open
              ) /
                scale[0]),
        (0.5 * window.innerHeight) / scale[1],
      ];

      const view = twgl.m4.identity();
      twgl.m4.scale(view, [...scale, 1, 1], view);
      twgl.m4.translate(view, [this.currentX, 0, 0, 0], view);
      twgl.m4.translate(view, [...pos, 0, 0], view);

      const textureScale = [
        ...this.getTextureScale(
          [
            this.options.base.dimensions[0] * scale[0],
            this.options.base.dimensions[1] * scale[1],
          ],
          [slide.width, slide.height]
        ),
      ];

      slide.uniforms = {
        ...this.uniforms,
        u_texture: slide.texture,
        u_textureScale: textureScale,
        u_time: time,
        u_view: view,
        u_open: this.animatedProperties.open,
        u_zoom: mix(this.options.base.zoom, 1, this.animatedProperties.open),
        u_hover: slide.hover,
      };
    });

    twgl.drawObjectList(this.gl, this.slides);
  }

  update(time) {
    time *= 0.001;

    if (Math.abs(this.currentX - this.targetX) > 1) {
      this.currentX += 0.12 * (this.targetX - this.currentX);
    }

    if (Math.abs(this.currentX - this.targetX) < 1 && this.targetX !== 0) {
      const index =
        -this.currentX /
        (this.options.base.dimensions[0] + this.options.base.gap);
      this.targetX = 0;
      this.currentX = 0;
      this.animatedProperties.index += index;

      if (this.settleAnimation?.remove) {
        this.settleAnimation.remove(this.animatedProperties);
      }
      this.settleAnimation = anime({
        targets: this.animatedProperties,
        index: Math.round(this.animatedProperties.index),
        easing: 'easeOutQuart',
        duration: 1200,
      });
    }

    this.draw(time);
    requestAnimationFrame(this.update.bind(this));
  }
}

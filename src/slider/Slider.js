import * as twgl from 'twgl.js';
import createPlane from 'primitive-plane';
import anime from 'animejs';

import vShaderSource from './shaders/vertex.glsl';
import fShaderSource from './shaders/fragment.glsl';

const defaultOptions = {
  base: {
    subdivisions: [30, 30],
    dimensions: [240, 400],
    zoom: 1.2,
    upscale: 1,
    gap: 60,
  },
  open: {
    gap: 20,
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

    this.canvas.addEventListener('mousemove', this.mousemove.bind(this));

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
      duration: 1600,
    });
  }

  close() {
    anime({
      targets: this.animatedProperties,
      open: 0,
      easing: 'easeInOutQuart',
      duration: 1600,
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

  mousemove(e) {
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
      if (hoveredIndex !== this.hoveredIndex) {
        this.slides.forEach((slide, index) => {
          anime({
            targets: slide,
            hover: index == hoveredIndex ? 0 : 1,
            easing: 'easeOutQuart',
            duration: 400,
          });
        });
      }
      this.hoveredIndex = hoveredIndex;
    } else {
      this.slides.forEach((slide, index) => {
        anime({
          targets: slide,
          hover: 0,
          easing: 'easeOutQuart',
          duration: 400,
        });
      });
      this.hoveredIndex = null;
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
    this.draw(time);
    requestAnimationFrame(this.update.bind(this));
  }
}

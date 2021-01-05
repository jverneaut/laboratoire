import * as twgl from 'twgl.js';
import createPlane from 'primitive-plane';
import anime from 'animejs';

import vShaderSource from './shaders/vertex.glsl';
import fShaderSource from './shaders/fragment.glsl';

const defaultOptions = {
  base: {
    subdivisions: [1, 1],
    dimensions: [300, 400],
    upscale: 1,
    gap: 60,
  },
  open: {
    dimensions: [window.innerWidth, window.innerHeight],
    gap: 40,
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
      textureScale: [
        this.options.base.dimensions[0] /
          this.options.base.dimensions[1] /
          (options.width / options.height),
        1,
      ],
      textureScaleOpen: [
        this.options.open.dimensions[0] /
          this.options.open.dimensions[1] /
          (options.width / options.height),
        1,
      ],
    };

    this.slides.push(slide);
  }

  open() {
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

  draw(time) {
    this.slides.forEach((slide, index) => {
      const scale = [
        mix(
          1,
          this.options.open.dimensions[0] / this.options.base.dimensions[0],
          this.animatedProperties.open
        ),
        mix(
          1,
          this.options.open.dimensions[1] / this.options.base.dimensions[1],
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
        mix(
          slide.textureScale[0],
          slide.textureScaleOpen[0],
          this.animatedProperties.open
        ),
        mix(
          slide.textureScale[1],
          slide.textureScaleOpen[1],
          this.animatedProperties.open
        ),
      ];

      slide.uniforms = {
        ...this.uniforms,
        u_texture: slide.texture,
        u_textureScale: textureScale,
        u_time: time,
        u_view: view,
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

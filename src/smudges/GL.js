import createPlane from 'primitive-plane';

const UPSCALE = 2;

const vShaderSource = `
precision mediump float;

attribute vec2 a_position;
varying vec2 v_position;

void main() {
  v_position = a_position;

  vec4 position = vec4(a_position.x, a_position.y, 0.0, 1.0);
  gl_Position = position;
}
`;

const fShaderSource = `
precision mediump float;
varying vec2 v_position;

uniform sampler2D u_image;
uniform sampler2D u_texture;

void main() {
  float strength = 0.2;

  vec4 texture = texture2D(u_texture, vec2(0.5) + vec2(0.5, -0.5) * v_position.xy);
  vec4 image = texture2D(u_image, vec2(0.5) + vec2(0.5, -0.5) * v_position.xy + vec2(strength * (-0.5 + texture.r), strength * (-0.5 + texture.g)));

  gl_FragColor = image;
}
`;

class GL {
  constructor(image, canvas) {
    this.canvas = document.createElement('canvas');

    this.width = window.innerWidth * UPSCALE;
    this.height = window.innerHeight * UPSCALE;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    document.body.appendChild(this.canvas);

    this.gl = this.canvas.getContext('webgl');

    const vShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(vShader, vShaderSource);
    this.gl.compileShader(vShader);

    const fShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(fShader, fShaderSource);
    this.gl.compileShader(fShader);

    const program = this.gl.createProgram();
    this.gl.attachShader(program, vShader);
    this.gl.attachShader(program, fShader);
    this.gl.linkProgram(program);
    this.gl.useProgram(program);

    this.image = this.gl.createTexture();
    this.texture = this.gl.createTexture();

    [
      { texture: this.image, texture_image: image },
      { texture: this.texture, texture_image: canvas },
    ].forEach(({ texture, texture_image }) => {
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_WRAP_S,
        this.gl.CLAMP_TO_EDGE
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_WRAP_T,
        this.gl.CLAMP_TO_EDGE
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_MAG_FILTER,
        this.gl.NEAREST
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_MIN_FILTER,
        this.gl.NEAREST
      );
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        texture_image
      );
    });

    /** Mesh setup */
    const plane = createPlane(2.0, 2.0);

    this.vertices = plane.positions.flat();
    this.indices = plane.cells.flat();

    const vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      this.gl.STATIC_DRAW
    );

    const indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(this.indices),
      this.gl.STATIC_DRAW
    );

    /** Attributes setup */
    const position = this.gl.getAttribLocation(program, 'a_position');
    this.gl.vertexAttribPointer(position, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(position);

    const imageLocation = this.gl.getUniformLocation(program, 'u_image');
    this.gl.uniform1i(imageLocation, 0);

    const textureLocation = this.gl.getUniformLocation(program, 'u_texture');
    this.gl.uniform1i(textureLocation, 1);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.image);
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  }

  update(canvas) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      canvas
    );
  }

  draw() {
    this.gl.drawElements(
      this.gl.TRIANGLE_STRIP,
      this.indices.length,
      this.gl.UNSIGNED_SHORT,
      0
    );
  }
}

export default GL;

precision lowp float;
varying vec2 v_uv;
uniform sampler2D u_texture;

void main() {
  vec4 color = texture2D(u_texture, v_uv);
  gl_FragColor = color;
}

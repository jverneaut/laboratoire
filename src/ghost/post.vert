precision mediump float;
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = 0.5 * (a_position + 1.0);
  gl_Position = vec4(a_position, 0, 1);
}

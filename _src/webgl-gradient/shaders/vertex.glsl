precision mediump float;

uniform vec2 u_resolution;

attribute vec4 a_position;
attribute vec4 a_color_1;
attribute vec4 a_color_2;

varying vec4 v_position;
varying vec4 v_color_1;
varying vec4 v_color_2;

void main() {
  vec4 position = a_position;
  position.xy = (position.xy / u_resolution * 2.0) * vec2(1.0, -1.0);

  gl_Position = position;
  v_position = position;
  v_color_1 = a_color_1;
  v_color_2 = a_color_2;
}

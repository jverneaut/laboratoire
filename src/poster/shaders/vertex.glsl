precision mediump float;

uniform vec2 u_resolution;

attribute vec4 a_position;
attribute vec2 a_texcoord;

varying vec2 v_texcoord;
varying vec4 v_position;

void main() {
  vec4 position = a_position;
  position.xy = (position.xy / u_resolution * 2.0) * vec2(1.0, -1.0);

  gl_Position = position;
  v_texcoord = a_texcoord;
  v_position = position;
}

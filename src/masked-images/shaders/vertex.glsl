attribute vec2 a_position;
attribute vec2 a_texcoord;
attribute float a_scroll;

varying vec2 v_texcoord;
varying vec2 v_position;
varying float v_scroll;

uniform float u_time;

void main() {
  float positionX = a_position.x;
  float positionY = a_position.y;

  vec2 position = vec2(positionX, positionY);

  gl_Position = vec4(position, 0, 1);
  v_texcoord = a_texcoord;
  v_position = position;
  v_scroll = a_scroll;
}

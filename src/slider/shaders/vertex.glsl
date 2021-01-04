precision mediump float;

attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform vec2 u_scale;
uniform float u_active;

uniform vec2 u_resolution;
uniform mat4 u_view;

uniform float u_index;
uniform float u_mouseIndex;
uniform float u_position;
uniform float u_speed;

varying vec2 v_texCoord;

float sigmoid(float x) { return 1.0 / (1.0 + exp(-x)); }

void main() {
  vec4 position = a_position;

  position.xy *= 1.0 - .5 * (sigmoid(abs(u_speed) * 0.05) - 0.5);
  position = u_view * position;

  position.xy = position.xy / u_resolution * 2.0 - 1.0;
  position.xy = mix(position.xy, position.xy * u_scale, u_active);
  position = position * vec4(1.0, -1.0, 1.0, 1.0);

  gl_Position = vec4(position);
  v_texCoord = a_texcoord;
}

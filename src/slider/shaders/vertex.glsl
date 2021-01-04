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

varying vec2 v_texCoord;

void main() {
  vec4 position = a_position;

  if (u_mouseIndex > -999.0) {
    if ((u_mouseIndex - floor(u_position)) == u_index) {
      position.xy *= mix(1.12, 1.0, u_active);
    } else {
      position.xy *= mix(0.9, 1.0, u_active);
    }
  }
  position = u_view * position;

  position.xy = position.xy / u_resolution * 2.0 - 1.0;
  position.xy = mix(position.xy, position.xy * u_scale, u_active);
  position = position * vec4(1.0, -1.0, 1.0, 1.0);

  gl_Position = vec4(position);
  v_texCoord = a_texcoord;
}

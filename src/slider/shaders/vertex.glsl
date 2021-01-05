uniform vec2 u_resolution;
uniform float u_scale;
uniform float u_time;
uniform mat4 u_view;

attribute vec4 a_position;
attribute vec2 a_texcoord;

varying vec2 v_texcoord;

void main() {
  vec4 position = a_position;
  position = u_view * position;

  vec2 scale = vec2(pow(u_scale, 2.0), -pow(u_scale, 2.0));
  position.xy = scale * (position.xy / u_resolution * 2.0) + vec2(-1.0, 1.0);
  // position.y += 0.1 * sin(position.y) * sin(20.0 * position.x + u_time);

  gl_Position = position;
  v_texcoord = a_texcoord;
}

precision mediump float;

attribute vec3 a_position;
attribute vec3 a_normals;
varying vec3 v_normals;
uniform float u_scale;
uniform mat4 u_rotation;
uniform float u_time;

void main() {
  v_normals = a_normals;
  vec4 position = u_rotation * vec4(u_scale * a_position, 1.0);

  gl_Position = vec4(
    position.x
      + 0.02 * sin(u_time * 0.05 + position.y * 8.0)
      + (1.0 + 0.2 * sin(u_time * 0.06)) * max(-position.y, 0.0) * (0.003 * sin(position.y * 40.0 + u_time * 0.2))
      + (1.0 + 0.5 * sin(u_time * 0.03 + 1.0)) * max(-position.y, 0.0) * (0.005 * sin(position.y * 20.0 + u_time * 0.2)),
    position.y + 0.5,
    position.z
      + (1.0 + 0.2 * sin(u_time * 0.06)) * max(-position.y, 0.0) * (0.003 * sin(position.y * 40.0 + u_time * 0.2))
      + (1.0 + 0.5 * sin(u_time * 0.03 + 1.0)) * max(-position.y, 0.0) * (0.005 * sin(position.y * 20.0 + u_time * 0.2)),
    1.0
  );
}

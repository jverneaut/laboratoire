precision mediump float;

attribute vec3 a_position;
attribute vec3 a_normals;
varying vec3 v_normals;
uniform float u_scale;
uniform float u_time;
uniform mat4 u_view, u_projection;

void main() {
  v_normals = a_normals;
  vec4 position = vec4(u_scale * a_position, 1.0);

  position.x =
    position.x + (
          0.12 * sin(position.y + u_time * 0.02)
        + 0.03 * sin(position.y * 5.0 + u_time * 0.15)
      ) * 0.2 * min(position.y, 0.0);
  position.z =
    position.z + (
          0.12 * sin(position.y + u_time * 0.02 + 3.14 * 0.5)
        + 0.03 * sin(position.y * 5.0 + u_time * 0.15 + 3.14 * 0.5)
      ) * 0.2 * min(position.y, 0.0);

  position.y = position.y + 2.0;

  gl_Position = u_projection * u_view * position;
}

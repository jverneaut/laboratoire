precision mediump float;

attribute vec3 a_position;
attribute vec3 a_normals;
varying vec3 v_normals;
varying vec2 v_position;
uniform float u_time;
uniform mat3 u_normals;
uniform mat4 u_view, u_projection, u_model;

void main() {
  v_normals = u_normals * a_normals;
  v_position = a_position.xy;

  vec4 position = vec4(a_position, 1.0);

  // Move in circle horizontaly
  position.x += 0.1 * sin(u_time * 0.02);
  position.z += 0.1 * cos(u_time * 0.02);

  // Ripples
  position.x += 0.2 * sin(position.y + (position.y * 4.0 + u_time) * 0.04);
  position.z += 0.2 * cos(position.y + (position.y * 4.0 + u_time) * 0.04);

  // Top to bottom
  position.y += 0.85 * cos(u_time * 0.014);

  gl_Position = u_projection * u_view * u_model * position;
}

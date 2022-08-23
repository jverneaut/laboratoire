precision mediump float;
attribute vec3 a_position;
uniform vec2 u_mouse;
uniform mat4 u_projection, u_model, u_view;
uniform float u_time;

float elevation = -0.2;
float mean = 0.0;
float std = 0.2;
float pi = 3.14159;
float e = 2.71828;

float bell(float x) {
  return pow(
    e / (std * sqrt(2.0 * pi)),
    -0.5 * pow((x - mean) / std, 2.0)
  );
}

void main() {
  vec4 position = vec4(a_position, 1.0);

  float distance = distance(vec2(position.x, position.y), u_mouse);
  float ratio = bell(distance);
  position.z += elevation * ratio;

  position.x += 0.01 * sin(u_time * 0.04 + 10.0 * (a_position.x + a_position.y));
  position.y += 0.01 * cos(u_time * 0.04 + 10.0 * (a_position.x + a_position.y));

  gl_PointSize = 2.0 + 3.0 * ratio;
  gl_Position = u_projection * u_view * u_model * position;
}

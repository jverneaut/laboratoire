attribute vec2 a_position;
attribute vec2 a_texcoord;

varying vec2 v_texcoord;
varying vec2 v_position;
varying float v_logistic_y;

uniform float u_time;

float logistic(float x) {
  float mid_point = 0.0;
  float max_point = 1.0;
  float steepness = 3.0;

  return max_point / (1.0 + exp(-steepness * (x - mid_point)));
}

void main() {
  float positionX = a_position.x;
  float positionY = a_position.y;

  float logisticY = 2.0 * (logistic(positionY) - 0.5);
  float strengthX = sin(positionX * 0.5 * 3.14);
  float strengthY = sin((positionY + 1.0) * 0.5 * 3.14);

  positionY = positionY + strengthX * strengthY * (logisticY - positionY);

  vec2 position = vec2(positionX, positionY);

  gl_Position = vec4(position, 0, 1);
  v_texcoord = a_texcoord;
  v_position = position;
}

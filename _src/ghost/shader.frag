precision mediump float;

varying vec3 v_normals;
varying vec2 v_position;

void main() {
  vec3 color = vec3(0.2);
  vec3 lightDir = vec3(1, 1, 0);
  vec3 ambient = 0. * color;
  vec3 diffuse = 3.0 * color * clamp(dot(v_normals, lightDir), 0.0, 6.0);

  gl_FragColor = vec4(ambient + diffuse, 1.0);
}

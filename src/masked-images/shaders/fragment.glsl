precision mediump float;

varying vec2 v_texcoord;
varying vec2 v_position;
varying float v_scroll;

uniform sampler2D u_texture;

void main() {
  float texcoordX = v_texcoord.x;
  float texcoordY = v_texcoord.y;

  vec4 color;
  vec4 white = vec4(1.0, 1.0, 1.0, 0.0);

  float parallax = 0.05;
  float offsetY = -v_position.y * parallax;
  float zoom = -0.2 * (1.0 - cos(-max(0.0, (-v_scroll + 0.75))));

  color = texture2D(u_texture, vec2((texcoordX - 0.5) * (1.0 - parallax * 2.0 + zoom) + 0.5, (texcoordY - 0.5) * (1.0 - parallax * 2.0 + zoom) + 0.5 + offsetY));

  // Paddings
  if (
    (texcoordX < 0.33 && texcoordY < 0.15) ||
    (texcoordX < 0.33 && texcoordY > 0.9) ||
    (texcoordX > 0.33 && texcoordX < 0.66 && texcoordY > 0.8) ||
    (texcoordX > 0.66 && texcoordY < 0.3)
  ) {
    color = white;
  }

  // Barre verticale 1
  if (texcoordX > 0.32 && texcoordX < 0.34) {
    color = white;
  }

  // Barre verticale 2
  if (texcoordX > 0.65 && texcoordX < 0.67) {
    color = white;
  }

  gl_FragColor = color;
}

precision mediump float;

varying vec2 v_texcoord;
varying vec2 v_position;

uniform sampler2D u_texture;

void main() {
  float texcoordX = v_texcoord.x;
  float texcoordY = v_texcoord.y;

  gl_FragColor = texture2D(u_texture, v_texcoord);
}

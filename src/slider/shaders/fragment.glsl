precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_textureScale;

varying vec2 v_texcoord;

void main() {
  vec2 texcoord = (v_texcoord - 0.5) * u_textureScale + 0.5;
  vec4 color = texture2D(u_texture, texcoord);

  gl_FragColor = color;
}

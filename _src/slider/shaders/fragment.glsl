precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_textureScale;
uniform float u_zoom;
uniform float u_hover;
uniform float u_open;

varying vec2 v_texcoord;

void main() {
  vec2 texcoord = (v_texcoord - 0.5) * u_textureScale * (1.0 / u_zoom) + 0.5;
  vec4 color = texture2D(u_texture, texcoord);
  vec4 bw =
      mix(vec4(vec3(color.r + color.g + color.b) * 0.33, 1.0), vec4(1.0), 0.3);

  color = mix(color, bw, max(0.0, u_hover * cos(u_open * 3.1415)));

  gl_FragColor = color;
}

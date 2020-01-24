precision mediump float;

varying vec2 v_texcoord;
varying vec2 v_position;

uniform sampler2D u_texture;

void main() {
  float texcoordX = v_texcoord.x;
  float texcoordY = v_texcoord.y;

  float offsetX = 0.02 * v_position.x * sin((0.5 + v_position.y) * 3.14);

  float red = texture2D(u_texture, vec2(v_texcoord.x - offsetX, v_texcoord.y)).x;
  float green = texture2D(u_texture, vec2(v_texcoord.x, v_texcoord.y)).y;
  float blue = texture2D(u_texture, vec2(v_texcoord.x, v_texcoord.y)).z;

  gl_FragColor = vec4(red, green, blue, 1.0);
}

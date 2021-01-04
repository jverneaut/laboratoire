precision mediump float;

varying vec2 v_texCoord;
uniform sampler2D u_texture;

uniform float u_active;
uniform vec2 u_textureScaleOrigin;
uniform vec2 u_textureScaleActive;

uniform float u_index;
uniform float u_mouseIndex;
uniform float u_position;

void main() {
  vec2 coords = (v_texCoord - 0.5) *
                    mix(u_textureScaleOrigin, u_textureScaleActive, u_active) +
                0.5;

  vec4 color = texture2D(u_texture, coords);
  // vec4 bw = vec4(0.33 * vec3(color.r + color.g + color.b), 1.0);

  // if ((u_mouseIndex - floor(u_position)) == u_index) {
  //   gl_FragColor = color;
  // } else {
  //   if (u_mouseIndex > -999.0) {
  //     gl_FragColor = mix(bw, color, u_active);
  //   } else {
  //     gl_FragColor = color;
  //   }
  // }

  gl_FragColor = color;
}

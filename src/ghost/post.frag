precision lowp float;
varying vec2 v_uv;
uniform sampler2D u_texture;
uniform float u_time;

#pragma glslify: grain = require(glsl-film-grain);

void main() {
  vec4 color = texture2D(u_texture, v_uv);
  float luminance = length(color.rbg) * 0.33;

  float g = grain(v_uv, vec2(10000.0));

  gl_FragColor = color + 0.4 * (vec4((1.0 - luminance) * g) - 0.5);
}

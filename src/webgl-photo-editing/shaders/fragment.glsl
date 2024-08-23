precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;
uniform float u_brightness;
uniform float u_highlights;
uniform float u_shadows;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_grain;

float random (vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
  vec4 sampleColor = texture2D(u_texture, v_texcoord);

  // Brightness
  sampleColor = vec4(clamp(sampleColor.rgb + u_brightness, 0.0, 1.0), 1.0);

  // Highlights
  // TODO: Use soft knee
  sampleColor = vec4(min(sampleColor.rgb, 0.5) + u_highlights * clamp(sampleColor.rgb - 0.5, 0.0, 0.5), 1.0);

  // Shadows
  // TODO: Use soft knee
  if (sampleColor.r + sampleColor.g + sampleColor.b < 1.5) {
    sampleColor = vec4((u_shadows * (sampleColor.rgb - 0.5)) + 0.5, 1.0);
  }

  // Contrast
  sampleColor = vec4(u_contrast * (sampleColor.rgb - 0.5) + 0.5, 1.0);

  // Saturation
  float desaturated = (sampleColor.x + sampleColor.y + sampleColor.z) / 3.0;
  sampleColor = (1.0 - u_saturation) * vec4(vec3(desaturated), 1) + u_saturation * sampleColor;

  // Grain
  // TODO: Improve next line by passing resolution uniform
  vec2 st = gl_FragCoord.xy / 1000.0;
  float rnd = random(st);
  sampleColor = mix(sampleColor, vec4(sampleColor.rgb * (0.5 + vec3(rnd)), 1.0), u_grain);

  gl_FragColor = sampleColor;
}

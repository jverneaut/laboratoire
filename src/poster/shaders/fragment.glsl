precision mediump float;

uniform sampler2D u_carTexture;
uniform sampler2D u_carCutoutTexture;
uniform sampler2D u_paperTexture;
uniform vec2 u_resolution;
uniform float u_time;

varying vec2 v_texcoord;
varying vec4 v_position;

vec4 toBW(vec4 color) {
  float luminance = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
  return vec4(luminance, luminance, luminance, color.a);
}

void main() {
  vec2 texcoord = (v_texcoord - 0.5) + 0.5;

  vec4 carColor = toBW(texture2D(u_carTexture, texcoord));
  vec4 carCutoutColor = toBW(texture2D(u_carCutoutTexture, texcoord));

  float lift = 0.15;
  float intensity = 2.0;
  float circleWidth = 0.5 + 0.05 * sin(u_time);
  vec2 circlePos = vec2(0.5, 0.52 - 0.02 * sin(u_time));

  vec4 paperColor = intensity * texture2D(u_paperTexture, texcoord);
  paperColor.rgb += 0.2;

  vec4 circle = vec4(1.0, 0.2, 0.0, 0.0);
  vec2 pos =
      vec2(1.0, u_resolution.y / u_resolution.x) *
      (v_position.xy + vec2(1.0 - 2.0 * circlePos.x, -1.0 + 2.0 * circlePos.y));
  if (pos.x * pos.x + pos.y * pos.y < pow(circleWidth, 2.0)) {
    circle.a = 1.0;
  }

  vec4 composition = carColor;
  composition = mix(composition, circle, circle.a);
  composition = mix(composition, carCutoutColor, carCutoutColor.a);

  vec4 color = (1.0 - lift) * composition + paperColor;

  gl_FragColor = color;
}

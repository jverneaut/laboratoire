varying vec2 vUv;

uniform sampler2D tBackground;
uniform sampler2D tDepthMap;

uniform vec2 uResolution;
uniform float uBackgroundAspectRatio;
uniform float uDepthMapAspectRatio;

uniform int uSlices;
uniform int uDepth;
uniform float uZoom;

vec4 depthMapAtCoordinates(vec2 coordinates) {
  float x = coordinates.x - 0.5 / float(uSlices);
  float y = coordinates.y;

  float scaleFactor = float(uSlices - 1) / float(uSlices);
  float effectiveAspectRatio = scaleFactor * uResolution.x / uResolution.y;

  if (uDepthMapAspectRatio < effectiveAspectRatio) {
    // The image can be full height, scale width accordingly
    x = (x - 0.5) * (uResolution.x / uResolution.y) / uDepthMapAspectRatio + 0.5;
  } else {
    // The image has the width of the aspect ratio, scale height accordingly
    x = (x - 0.5) / effectiveAspectRatio * uResolution.x / uResolution.y + 0.5;
    y = (y - 0.5) * uDepthMapAspectRatio / effectiveAspectRatio + 0.5;
  }

  x = (x - 0.5) / (0.1 * uZoom) + 0.5;
  y = (y - 0.5) / (0.1 * uZoom) + 0.5;

  if (x < 0.0 || x > 1.0 || y < 0.0 || y > 1.0) {
    return vec4(vec3(0.0), 1.0);
  }

  return texture2D(tDepthMap, vec2(x, y));
}

void main() {
  vec2 uv = vUv;

  for (int i = 0; i < uSlices; i++) {
    float x = uv.x - float(i) * 1.0 / float(uSlices);
    float depth = depthMapAtCoordinates(vec2(x, uv.y)).r;

    uv.x += depth * 0.001 * float(uDepth);
  }

  float x = uv.x * float(uSlices);
  float y = uv.y * float(uSlices) * uResolution.y / uResolution.x * uBackgroundAspectRatio;

  gl_FragColor = texture2D(tBackground, vec2(x, y));
}

precision highp float;

#define DOUBLE_PI 6.283185307179586

uniform sampler2D noiseMap;

out vec2 vUv;
out float theta;
out float phi;


void main() {
  vUv = uv;
  theta = acos(position.z / length(position.xyz));
  phi = atan(position.x, position.y);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

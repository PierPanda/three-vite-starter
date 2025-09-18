precision highp float;

#define DOUBLE_PI 6.283185307179586

uniform sampler2D sunMap;
uniform sampler2D noiseMap;
uniform float time;
uniform float noiseAmplitude;
uniform float noiseSpeed;

/*
 * Apply a noise texture to create a dynamic sun surface effect.
  * Use the noiseAmplitude and noiseSpeed uniforms to control the effect.
  * Hint: you can use the texture coordinates (vUv) to sample the noise texture.
 */
in vec2 vUv;
in float theta;
in float phi;
out vec4 fragColor;

void main() {
  float firstNoise = texture(noiseMap, vec2(theta / DOUBLE_PI, time * noiseSpeed)).r;
  float secondNoise = texture(noiseMap, vec2(phi / DOUBLE_PI, time * noiseSpeed)).g;

  float combinedNoises = noiseAmplitude * (firstNoise + secondNoise);

  fragColor = texture(sunMap, vUv + combinedNoises);
}

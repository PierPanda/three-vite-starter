import { ShaderMaterial, GLSL3, Texture, type Material } from "three";

import fragmentShader from "~/shaders/sun-shader.frag";
import vertexShader from "~/shaders/sun-shader.vert";

export class EnhancedSunMaterial extends ShaderMaterial {
  constructor(_material: Material, noiseMap: Texture, sunMap: Texture) {
    super({
      glslVersion: GLSL3,
      fragmentShader,
      vertexShader,
      uniforms: {
        noiseMap: {
          value: noiseMap,
        },
        sunMap: {
          value: sunMap,
        },
        time: { value: 0 },
        noiseAmplitude: { value: 0.5 },
        noiseSpeed: { value: 0.002 },
      },
    });
  }
}

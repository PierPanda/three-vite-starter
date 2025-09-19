import {
  Scene,
  PointLight,
  PerspectiveCamera,
  Mesh,
  Vector3,
  Sprite,
  EquirectangularReflectionMapping,
  TextureLoader,
  type Texture,
  Material,
  RepeatWrapping,
  AudioLoader,
  PositionalAudio,
  AudioListener,
} from "three";

import { isMesh } from "~/utils/is-mesh";
import { PlanetModal } from "~/PlanetModal";
import type { Controls } from "~/Controls";
import { EnhancedSunMaterial } from "~/materials/EnhancedSunMaterial";

import DestroyerMarch from "~~/assets/music/StarWars.mp3";

import SolarSystem from "~~/assets/models/scene.glb";
import ImperialDestroyer from "~~/assets/models/star_wars_imperial_ii_star_destroyer.glb";
import skyboxTexture from "../../assets/textures/HDR_blue_nebulae-1.jpg";
import noiseTexture from "../../assets/textures/perlin-noise.png";
import planetsData from "~~/assets/constantes/planets.json";

import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { UltraHDRLoader } from "three/examples/jsm/Addons.js";
import type { Viewport, Clock, Lifecycle } from "~/core";

import noiseMapsrc from "~~/assets/textures/perlin-noise.png";
import sunMapsrc from "~~/assets/textures/Solarstexture.jpg";

export interface MainSceneParamaters {
  clock: Clock;
  camera: PerspectiveCamera;
  viewport: Viewport;
  controls: Controls;
}
export class ExampleScene extends Scene implements Lifecycle {
  public clock: Clock;
  public camera: PerspectiveCamera;
  public viewport: Viewport;
  public controls: Controls;
  public sunLight: PointLight;
  public enhancedSunMaterial?: EnhancedSunMaterial;
  public noiseTexture: Texture;

  public constructor({
    clock,
    camera,
    viewport,
    controls,
  }: MainSceneParamaters) {
    super();

    this.clock = clock;
    this.camera = camera;
    this.viewport = viewport;
    this.controls = controls;

    const textureLoader = new TextureLoader();
    this.noiseTexture = textureLoader.load(noiseTexture);

    this.sunLight = new PointLight(0xffffff, 10, 250000, 0.1);
    this.sunLight.position.set(0, 0, 0);
    this.sunLight.castShadow = true;

    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.fov = 20;
    this.sunLight.shadow.camera.near = 220;
    this.sunLight.shadow.camera.far = 300;

    this.add(this.sunLight);
  }

  public planetNames = [
    "mercure",
    "venus",
    "earth",
    "mars",
    "jupiter",
    "saturne",
    "uranus",
    "neptune",
    "sun",
    "moon",
    "ceres",
    "eris",
    "haumea",
    "makemake",
  ];

  public planets: { mesh: Mesh; radius: number; name: string }[] = [];
  public planetLabels: Sprite[] = [];
  public planetModal?: PlanetModal;
  public orbitalSpeedMultiplier: number = 1;

  public async load(): Promise<void> {
    const solarsystem = await new Promise<GLTF>((resolve, reject) => {
      new GLTFLoader().load(SolarSystem, resolve, undefined, reject);
    });

    const imperialDestroyer = await new Promise<GLTF>((resolve, reject) => {
      new GLTFLoader().load(ImperialDestroyer, resolve, undefined, reject);
    });

    const skybox = await new Promise<Texture>((resolve, reject) => {
      new UltraHDRLoader().load(skyboxTexture, resolve, undefined, reject);
    });

    const noiseMap = await new Promise<Texture>((resolve, reject) => {
      new TextureLoader().load(noiseMapsrc, resolve, reject);
    });

    const sunMap = await new Promise<Texture>((resolve, reject) => {
      new TextureLoader().load(sunMapsrc, resolve, reject);
    });

    sunMap.wrapS = RepeatWrapping;
    sunMap.wrapT = RepeatWrapping;

    noiseMap.wrapS = RepeatWrapping;
    noiseMap.wrapT = RepeatWrapping;

    skybox.mapping = EquirectangularReflectionMapping;
    this.background = skybox;
    this.environment = skybox;
    this.backgroundIntensity = 0.5;

    solarsystem.scene.traverse((child) => {
      if (isMesh(child)) {
        const vector3 = new Vector3();
        child.getWorldPosition(vector3);
        const radius = vector3.length();
        child.getWorldScale(vector3);
        child.scale.copy(vector3);

        const childName = child.name;
        const isSun = childName === "Object_20" || radius < 1;

        if (isSun) {
          child.material = new EnhancedSunMaterial(
            child.material as Material,
            noiseMap,
            sunMap
          );
          this.enhancedSunMaterial = child.material as EnhancedSunMaterial;
        }

        if (!isSun) {
          child.scale.multiplyScalar(12);
        }

        this.planets.push({
          mesh: child,
          radius: radius,
          name: childName,
        });
        this.add(child);
      }
    });
    imperialDestroyer.scene.position.set(0, 6000, 0);

    imperialDestroyer.scene.rotation.x = Math.PI;

    imperialDestroyer.scene.scale.setScalar(0.35);
    const destroyerLight = new PointLight(0xffffff, 25000, 2000, 2.2);
    imperialDestroyer.scene.add(destroyerLight);
    destroyerLight.position.set(0, -400, -400);

    this.add(imperialDestroyer.scene);

    this.controls.setPosition(3000, 3000, 3000);
    this.controls.setTarget(0, 0, 0);

    this.planetModal = new PlanetModal(
      this.camera,
      this.controls,
      this.planets,
      this
    );

    const listener = new AudioListener();
    this.camera.add(listener);
    const sound = new PositionalAudio(listener);
    const audioLoader = new AudioLoader();
    audioLoader.load(DestroyerMarch, function (buffer) {
      sound.setBuffer(buffer);
      sound.setRefDistance(20);
      sound.play();
      sound.setLoop(true);
      sound.setVolume(0.25);
    });
    imperialDestroyer.scene.add(sound);
  }

  public update(): void {
    if (this.enhancedSunMaterial) {
      this.enhancedSunMaterial.uniforms.time.value = this.clock.elapsed / 1000;
    }

    let sunIndex = -1;
    for (let i = 0; i < this.planets.length; i++) {
      const planet = this.planets[i];
      if (planet.name.toLowerCase().includes("Object_20")) {
        planet.mesh.position.set(0, 0, 0);
        sunIndex = i;
        break;
      }
    }

    this.sunLight.shadow.camera.lookAt(this.planets[2].mesh.position);

    for (let i = 0; i < this.planets.length; i++) {
      if (i === sunIndex) continue;

      const planet = this.planets[i];
      const planetKey = this.planetNames[
        i
      ] as keyof typeof planetsData.solarSystem.orbitalPeriods;

      if (!planetKey) continue;

      const rotationPeriod =
        planetsData.solarSystem.rotationPeriodsHours[planetKey] || 24;
      const rotationSpeed = (2 * Math.PI) / (rotationPeriod * 3600);
      const rotationSpeedScaled = rotationSpeed * 10;

      if (rotationPeriod > 0) {
        planet.mesh.rotation.y += rotationSpeedScaled * this.clock.delta;
      } else {
        planet.mesh.rotation.y -=
          Math.abs(rotationSpeedScaled) * this.clock.delta;
      }

      let orbitalRadius =
        planetsData.solarSystem.orbitalRadii[planetKey] || 100 + i * 50;

      if (i === 5 || i === 14) {
        const saturnPlanet = this.planets[5];
        const saturnRings = this.planets[14];

        const saturnOrbitalRadius =
          planetsData.solarSystem.orbitalRadii.saturne;

        const saturnOrbitalPeriod =
          planetsData.solarSystem.orbitalPeriods.saturne;

        const saturnOrbitalSpeed =
          0.00002 *
          (365.25 / saturnOrbitalPeriod) *
          this.orbitalSpeedMultiplier;

        const angle = this.clock.elapsed * saturnOrbitalSpeed;

        const x = Math.cos(angle) * saturnOrbitalRadius;
        const z = Math.sin(angle) * saturnOrbitalRadius;

        saturnPlanet.mesh.position.set(x, 0, z);
        saturnRings.mesh.position.set(x, 0, z);

        if (i === 14) continue;
      } else if (i === 9) {
        const earth = this.planets[2];
        const moon = this.planets[9];

        if (earth) {
          const earthOrbitalRadius = planetsData.solarSystem.orbitalRadii.earth;

          const earthOrbitalSpeed = 0.0002 * this.orbitalSpeedMultiplier;
          const earthAngle = this.clock.elapsed * earthOrbitalSpeed + 2 * 0.5;

          const earthX = Math.cos(earthAngle) * earthOrbitalRadius;
          const earthZ = Math.sin(earthAngle) * earthOrbitalRadius;
          earth.mesh.position.set(earthX, 0, earthZ);

          const moonOrbitalRadius = 15;
          const moonOrbitalPeriod = planetsData.solarSystem.orbitalPeriods.moon;
          const moonOrbitalSpeed =
            0.0002 * (365.25 / moonOrbitalPeriod) * this.orbitalSpeedMultiplier;
          const moonAngle = this.clock.elapsed * moonOrbitalSpeed;

          const moonX = earthX + Math.cos(moonAngle) * moonOrbitalRadius;
          const moonZ = earthZ + Math.sin(moonAngle) * moonOrbitalRadius;
          moon.mesh.position.set(moonX, 0, moonZ);
        }
      } else if (i === 2) {
        continue;
      } else {
        const baseSpeed = 0.0002;

        const period =
          planetsData.solarSystem.orbitalPeriods[planetKey] || 365.25;
        const orbitalSpeed =
          baseSpeed * (365.25 / period) * this.orbitalSpeedMultiplier;
        const angle = this.clock.elapsed * orbitalSpeed + i * 0.5;

        planet.mesh.position.x = Math.cos(angle) * orbitalRadius;
        planet.mesh.position.z = Math.sin(angle) * orbitalRadius;
        planet.mesh.position.y = 0;
      }
    }

    if (this.planetModal) {
      this.planetModal.update();
    }
  }

  public resize(): void {
    this.camera.aspect = this.viewport.ratio;
    this.camera.updateProjectionMatrix();
  }

  public dispose(): void {
    this.planetLabels.forEach((label) => {
      if (label.material.map) {
        label.material.map.dispose();
      }
      label.material.dispose();
      this.remove(label);
    });
    this.planetLabels = [];
  }
}

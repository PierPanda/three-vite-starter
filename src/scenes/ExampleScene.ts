import {
  Scene,
  PointLight,
  PerspectiveCamera,
  Mesh,
  Vector3,
  Sprite,
  SpriteMaterial,
  CanvasTexture,
  EquirectangularReflectionMapping,
  type Texture,
  // CameraHelper,
} from "three";

import { isMesh } from "~/utils/is-mesh";
import { PlanetModal } from "~/PlanetModal";

import SolarSystem from "~~/assets/models/scene.glb";
import skyboxTexture from "../../assets/textures/HDR_blue_nebulae-1.hdr";
import planetsData from "~~/assets/constantes/planets.json";

import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/Addons.js";
import type { Viewport, Clock, Lifecycle } from "~/core";

export interface MainSceneParamaters {
  clock: Clock;
  camera: PerspectiveCamera;
  viewport: Viewport;
}
export class ExampleScene extends Scene implements Lifecycle {
  public clock: Clock;
  public camera: PerspectiveCamera;
  public viewport: Viewport;
  public sunLight: PointLight;

  public constructor({ clock, camera, viewport }: MainSceneParamaters) {
    super();

    this.clock = clock;
    this.camera = camera;
    this.viewport = viewport;

    this.sunLight = new PointLight(0xffffff, 10, 250000, 0.1);
    this.sunLight.position.set(0, 0, 0);
    this.sunLight.castShadow = true;

    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.fov = 20;
    this.sunLight.shadow.camera.near = 220;
    this.sunLight.shadow.camera.far = 300;

    this.add(this.sunLight);

    // const cameraHelper = new CameraHelper(this.sunLight.shadow.camera);
    // this.add(cameraHelper);
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

  private getPlanetRealName(meshName: string): string {
    const meshToNameMapping: { [key: string]: string } = {
      Object_4: "Mercure",
      Object_6: "Vénus",
      Object_8: "Terre",
      Object_10: "Mars",
      Object_12: "Jupiter",
      Object_14: "Saturne",
      Object_16: "Uranus",
      Object_18: "Neptune",
      Object_20: "Soleil",
      Object_22: "Lune",
      Object_24: "Cérès",
      Object_26: "Éris",
      Object_28: "Hauméa",
      Object_30: "Makémaké",
      Object_32: "Anneaux de Saturne",
    };

    return meshToNameMapping[meshName] || meshName;
  }

  private createTextLabel(text: string): Sprite {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;

    canvas.width = 256;
    canvas.height = 64;

    context.font = "24px Arial";
    context.fillStyle = "white";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new CanvasTexture(canvas);
    const material = new SpriteMaterial({ map: texture });
    const sprite = new Sprite(material);

    sprite.scale.set(50, 12.5, 1);

    return sprite;
  }

  public planets: { mesh: Mesh; radius: number; name: string }[] = [];
  public planetLabels: Sprite[] = [];
  public planetModal?: PlanetModal;

  public async load(): Promise<void> {
    const solarsystem = await new Promise<GLTF>((resolve, reject) => {
      new GLTFLoader().load(SolarSystem, resolve, undefined, reject);
    });
    console.log("Solar Sysytem", solarsystem);

    const skybox = await new Promise<Texture>((resolve, reject) => {
      new RGBELoader().load(skyboxTexture, resolve, undefined, reject);
    });
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

        if (!isSun) {
          child.scale.multiplyScalar(12);
        }

        this.planets.push({
          mesh: child,
          radius: radius,
          name: childName,
        });
        this.add(child);

        const realName = this.getPlanetRealName(childName);
        console.log(`Mesh: ${childName} -> Real name: ${realName}`);
        const label = this.createTextLabel(realName);
        this.planetLabels.push(label);
        this.add(label);
      }
    });
    this.camera.position.set(15000, 15000, 15000);

    this.planetModal = new PlanetModal(this.camera, this.planets);
  }

  public update(): void {
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

        const saturnOrbitalSpeed = 0.00002 * (365.25 / saturnOrbitalPeriod);

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

          const earthOrbitalSpeed = 0.0002;
          const earthAngle = this.clock.elapsed * earthOrbitalSpeed + 2 * 0.5;

          const earthX = Math.cos(earthAngle) * earthOrbitalRadius;
          const earthZ = Math.sin(earthAngle) * earthOrbitalRadius;
          earth.mesh.position.set(earthX, 0, earthZ);

          const moonOrbitalRadius = 15;
          const moonOrbitalPeriod = planetsData.solarSystem.orbitalPeriods.moon;
          const moonOrbitalSpeed = 0.0002 * (365.25 / moonOrbitalPeriod);
          const moonAngle = this.clock.elapsed * moonOrbitalSpeed;

          const moonX = earthX + Math.cos(moonAngle) * moonOrbitalRadius;
          const moonZ = earthZ + Math.sin(moonAngle) * moonOrbitalRadius;
          moon.mesh.position.set(moonX, 0, moonZ);
        }
      } else if (i === 2) {
        continue; // La Terre est gérée dans le cas de la Lune
      } else {
        const baseSpeed = 0.0002;

        const period =
          planetsData.solarSystem.orbitalPeriods[planetKey] || 365.25;
        const orbitalSpeed = baseSpeed * (365.25 / period);
        const angle = this.clock.elapsed * orbitalSpeed + i * 0.5;

        planet.mesh.position.x = Math.cos(angle) * orbitalRadius;
        planet.mesh.position.z = Math.sin(angle) * orbitalRadius;
        planet.mesh.position.y = 0;
      }
    }

    for (
      let i = 0;
      i < this.planets.length && i < this.planetLabels.length;
      i++
    ) {
      const planet = this.planets[i];
      const label = this.planetLabels[i];

      if (planet && label) {
        label.position.copy(planet.mesh.position);
        label.position.y += planet.mesh.scale.y + 50;
      }
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

import {
  Raycaster,
  Vector2,
  Camera,
  Mesh,
  Vector3,
  DirectionalLight,
  Scene,
} from "three";
import planetsData from "~~/assets/constantes/planets.json";
import type { Controls } from "./Controls";

export interface PlanetData {
  name: string;
  type: string;
  diameter_km: string | number | { a: string; b: string };
  mass_kg: string | number;
  gravity_m_s2: string | number;
  distance_from_sun_au?: string | number;
  distance_from_sun_km?: string | number;
  distance_from_earth_au?: string | number;
  average_temperature_c?: string | number;
  temperature_surface_c?: string | number;
  temperature_core_c?: string | number;
  rotation_period_days_sidereal?: string | number;
  rotation_period_hours_sidereal?: string | number;
  rotation_days_equator?: string | number;
  rotation_days_poles?: string | number;
  rotation_direction?: string;
  orbital_period_days?: string | number;
  orbital_period_years?: string | number;
  satellites?: Array<{
    name: string;
    type?: string;
    diameter_km?: string | number;
    mass_kg?: string | number;
    gravity_m_s2?: string | number;
    distance_from_planet_km?: string | number;
    notes?: string;
  }>;
  notes?: string;
}

export class PlanetModal {
  private modal: HTMLElement;
  private modalTitle: HTMLElement;
  private modalBody: HTMLElement;
  private closeButton: HTMLElement;
  private raycaster: Raycaster;
  private mouse: Vector2;
  private camera: Camera;
  private controls: Controls;
  private planets: { mesh: Mesh; radius: number; name: string }[];
  private originalCameraPosition: Vector3;
  private originalCameraTarget: Vector3;
  private isModalOpen: boolean = false;
  private followedPlanet: Mesh | null = null;
  private cameraOffset: Vector3 = new Vector3();
  private focusLight: DirectionalLight | null = null;
  private scene: Scene;

  constructor(
    camera: Camera,
    controls: Controls,
    planets: { mesh: Mesh; radius: number; name: string }[],
    scene: Scene
  ) {
    this.camera = camera;
    this.controls = controls;
    this.planets = planets;
    this.scene = scene;
    this.originalCameraPosition = new Vector3();
    this.originalCameraTarget = new Vector3();

    this.modal = document.getElementById("planet-modal")!;
    this.modalTitle = document.getElementById("modal-title")!;
    this.modalBody = document.getElementById("modal-body")!;
    this.closeButton = document.getElementById("modal-close")!;

    this.raycaster = new Raycaster();
    this.mouse = new Vector2();

    this.setupEventListeners();
  }

  private formatNumber(
    value: string | number | { a: string; b: string }
  ): string {
    if (
      typeof value === "object" &&
      value !== null &&
      "a" in value &&
      "b" in value
    ) {
      return `${value.a} x ${value.b}`;
    }

    if (typeof value === "string") {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return value;
      }
      return numValue.toLocaleString("fr-FR");
    }

    if (typeof value === "number") {
      return value.toLocaleString("fr-FR");
    }

    return String(value);
  }

  public async closeModal(): Promise<void> {
    if (!this.isModalOpen) return;

    this.modal.classList.remove("show");
    this.isModalOpen = false;
    this.followedPlanet = null;

    if (this.focusLight) {
      this.scene.remove(this.focusLight);
      this.scene.remove(this.focusLight.target);
      this.focusLight = null;
    }

    await this.controls.setLookAt(
      this.originalCameraPosition.x,
      this.originalCameraPosition.y,
      this.originalCameraPosition.z,
      this.originalCameraTarget.x,
      this.originalCameraTarget.y,
      this.originalCameraTarget.z,
      true
    );
  }

  private setupEventListeners(): void {
    this.closeButton.addEventListener("click", () => {
      this.closeModal().catch(console.error);
    });

    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modal) {
        this.closeModal().catch(console.error);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.isModalOpen) {
        this.closeModal().catch(console.error);
      }
    });

    window.addEventListener("click", (event: MouseEvent) =>
      this.onWindowClick(event)
    );
  }

  private onWindowClick(event: MouseEvent): void {
    if (this.isModalOpen) {
      return;
    }

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes = this.planets.map((planet) => planet.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as Mesh;
      const planet = this.planets.find((p) => p.mesh === clickedMesh);

      if (planet) {
        this.showPlanetInfo(planet.name, planet.mesh);
      }
    }
  }

  private async focusOnPlanet(planetMesh: Mesh): Promise<void> {
    this.originalCameraPosition.copy(this.camera.position);

    const currentTarget = new Vector3();
    this.controls.getTarget(currentTarget);
    this.originalCameraTarget.copy(currentTarget);

    this.followedPlanet = planetMesh;

    this.focusLight = new DirectionalLight(0xffffff, 2);
    const planetPosition = planetMesh.position.clone();

    const planetScale = Math.max(
      planetMesh.scale.x,
      planetMesh.scale.y,
      planetMesh.scale.z
    );
    const distance = planetScale * 8;

    this.cameraOffset.set(distance * 0.6, distance * 0.3, distance);
    const newCameraPosition = planetPosition.clone().add(this.cameraOffset);

    this.focusLight.position.copy(newCameraPosition);
    this.focusLight.target.position.copy(planetPosition);
    this.focusLight.target.updateMatrixWorld();

    this.scene.add(this.focusLight);
    this.scene.add(this.focusLight.target);

    await this.controls.setLookAt(
      newCameraPosition.x,
      newCameraPosition.y,
      newCameraPosition.z,
      planetPosition.x,
      planetPosition.y,
      planetPosition.z,
      true
    );
  }

  public update(): void {
    if (this.followedPlanet && this.isModalOpen) {
      const planetPosition = this.followedPlanet.position.clone();
      const newCameraPosition = planetPosition.clone().add(this.cameraOffset);

      if (this.focusLight) {
        this.focusLight.position.copy(newCameraPosition);
        this.focusLight.target.position.copy(planetPosition);
        this.focusLight.target.updateMatrixWorld();
      }

      this.controls.setLookAt(
        newCameraPosition.x,
        newCameraPosition.y,
        newCameraPosition.z,
        planetPosition.x,
        planetPosition.y,
        planetPosition.z,
        false
      );
    }
  }

  private getPlanetKey(meshName: string): string | null {
    const nameMapping: { [key: string]: string } = {
      Object_4: "mercure",
      Object_6: "venus",
      Object_8: "earth",
      Object_10: "mars",
      Object_12: "jupiter",
      Object_14: "saturne",
      Object_16: "uranus",
      Object_18: "neptune",
      Object_20: "sun",
      Object_22: "moon",
      Object_24: "ceres",
      Object_26: "eris",
      Object_28: "haumea",
      Object_30: "makemake",
      Object_32: "saturne",
    };

    return nameMapping[meshName] || null;
  }

  private async showPlanetInfo(
    meshName: string,
    planetMesh: Mesh
  ): Promise<void> {
    const planetKey = this.getPlanetKey(meshName);

    if (!planetKey) {
      console.warn(`No planet data found for mesh: ${meshName}`);
      return;
    }

    this.isModalOpen = true;

    await this.focusOnPlanet(planetMesh);

    if (planetKey === "moon") {
      this.showMoonInfo();
      return;
    }

    const planetData =
      planetsData.solarSystem.planets[
        planetKey as keyof typeof planetsData.solarSystem.planets
      ];

    if (!planetData) {
      console.warn(`No planet data found for key: ${planetKey}`);
      return;
    }

    this.modalTitle.textContent = planetData.name;
    this.modalBody.innerHTML = this.generatePlanetHTML(planetData);
    this.modal.classList.add("show");
  }

  private generatePlanetHTML(data: PlanetData): string {
    let html = `<div class="planet-info">`;
    html += `<div class="planet-type">${data.type}</div>`;
    html += '<div class="info-section">';

    if (data.diameter_km) {
      html += `<div class="info-row">
      <span class="info-label">Diamètre</span>
      <span class="info-value">${this.formatNumber(data.diameter_km)} km</span>
    </div>`;
    }

    if (data.mass_kg) {
      html += `<div class="info-row">
      <span class="info-label">Masse</span>
      <span class="info-value">${this.formatNumber(data.mass_kg)} kg</span>
    </div>`;
    }

    if (data.gravity_m_s2) {
      html += `<div class="info-row">
      <span class="info-label">Gravité</span>
      <span class="info-value">${this.formatNumber(
        data.gravity_m_s2
      )} m/s²</span>
    </div>`;
    }

    if (data.distance_from_sun_au) {
      html += `<div class="info-row">
      <span class="info-label">Distance du Soleil</span>
      <span class="info-value">${this.formatNumber(
        data.distance_from_sun_au
      )} UA</span>
    </div>`;
    }

    if (data.distance_from_sun_km) {
      html += `<div class="info-row">
      <span class="info-label">Distance du Soleil</span>
      <span class="info-value">${this.formatNumber(
        data.distance_from_sun_km
      )} km</span>
    </div>`;
    }

    if (data.average_temperature_c) {
      html += `<div class="info-row">
      <span class="info-label">Température moyenne</span>
      <span class="info-value">${this.formatNumber(
        data.average_temperature_c
      )}°C</span>
    </div>`;
    }

    if (data.temperature_surface_c) {
      html += `<div class="info-row">
      <span class="info-label">Température de surface</span>
      <span class="info-value">${this.formatNumber(
        data.temperature_surface_c
      )}°C</span>
    </div>`;
    }

    if (data.temperature_core_c) {
      html += `<div class="info-row">
      <span class="info-label">Température du noyau</span>
      <span class="info-value">${this.formatNumber(
        data.temperature_core_c
      )}°C</span>
    </div>`;
    }

    if (data.rotation_period_days_sidereal) {
      html += `<div class="info-row">
      <span class="info-label">Période de rotation</span>
      <span class="info-value">${this.formatNumber(
        data.rotation_period_days_sidereal
      )} jours</span>
    </div>`;
    }

    if (data.rotation_period_hours_sidereal) {
      html += `<div class="info-row">
      <span class="info-label">Période de rotation</span>
      <span class="info-value">${this.formatNumber(
        data.rotation_period_hours_sidereal
      )} heures</span>
    </div>`;
    }

    if (data.rotation_direction) {
      html += `<div class="info-row">
      <span class="info-label">Direction de rotation</span>
      <span class="info-value">${data.rotation_direction}</span>
    </div>`;
    }

    if (data.orbital_period_days) {
      html += `<div class="info-row">
      <span class="info-label">Période orbitale</span>
      <span class="info-value">${this.formatNumber(
        data.orbital_period_days
      )} jours</span>
    </div>`;
    }

    if (data.orbital_period_years) {
      html += `<div class="info-row">
      <span class="info-label">Période orbitale</span>
      <span class="info-value">${this.formatNumber(
        data.orbital_period_years
      )} années</span>
    </div>`;
    }

    html += "</div>";

    if (data.satellites && data.satellites.length > 0) {
      html += '<div class="satellites-section">';
      html += '<div class="satellites-title">Satellites</div>';

      data.satellites.forEach((satellite) => {
        html += '<div class="satellite-item">';
        html += `<div class="satellite-name">${satellite.name}</div>`;

        if (satellite.diameter_km) {
          html += `<div>Diamètre: ${this.formatNumber(
            satellite.diameter_km
          )} km</div>`;
        }

        if (satellite.mass_kg) {
          html += `<div>Masse: ${this.formatNumber(
            satellite.mass_kg
          )} kg</div>`;
        }

        if (satellite.distance_from_planet_km) {
          html += `<div>Distance: ${this.formatNumber(
            satellite.distance_from_planet_km
          )} km</div>`;
        }

        if (satellite.notes) {
          html += `<div style="margin-top: 8px; font-style: italic; color: #a0b3c5;">${satellite.notes}</div>`;
        }

        html += "</div>";
      });

      html += "</div>";
    }

    if (data.notes) {
      html += '<div class="notes">';
      html += '<div class="notes-title">Informations</div>';
      html += `<div class="notes-text">${data.notes}</div>`;
      html += "</div>";
    }

    html += "</div>";

    return html;
  }

  private showMoonInfo(): void {
    const earthData = planetsData.solarSystem.planets.earth;
    const moonData = earthData.satellites?.[0];

    if (!moonData) {
      console.warn("Moon data not found in Earth satellites");
      return;
    }

    this.modalTitle.textContent = moonData.name;

    let html = `<div class="planet-info">`;
    html += `<div class="planet-type">${moonData.type}</div>`;
    html += '<div class="info-section">';

    if (moonData.diameter_km) {
      html += `<div class="info-row">
      <span class="info-label">Diamètre</span>
      <span class="info-value">${this.formatNumber(
        moonData.diameter_km
      )} km</span>
    </div>`;
    }

    if (moonData.mass_kg) {
      html += `<div class="info-row">
      <span class="info-label">Masse</span>
      <span class="info-value">${this.formatNumber(moonData.mass_kg)} kg</span>
    </div>`;
    }

    if (moonData.gravity_m_s2) {
      html += `<div class="info-row">
      <span class="info-label">Gravité</span>
      <span class="info-value">${this.formatNumber(
        moonData.gravity_m_s2
      )} m/s²</span>
    </div>`;
    }

    if (moonData.distance_from_planet_km) {
      html += `<div class="info-row">
      <span class="info-label">Distance de la Terre</span>
      <span class="info-value">${this.formatNumber(
        moonData.distance_from_planet_km
      )} km</span>
    </div>`;
    }

    html += "</div>";

    if (moonData.notes) {
      html += '<div class="notes">';
      html += '<div class="notes-title">Informations</div>';
      html += `<div class="notes-text">${moonData.notes}</div>`;
      html += "</div>";
    }

    html += "</div>";

    this.modalBody.innerHTML = html;
    this.modal.classList.add("show");
  }
}

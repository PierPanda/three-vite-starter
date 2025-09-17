import { Raycaster, Vector2, Camera, Mesh } from "three";
import planetsData from "~~/assets/constantes/planets.json";

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
  private planets: { mesh: Mesh; radius: number; name: string }[];

  constructor(
    camera: Camera,
    planets: { mesh: Mesh; radius: number; name: string }[]
  ) {
    this.camera = camera;
    this.planets = planets;

    this.modal = document.getElementById("planet-modal")!;
    this.modalTitle = document.getElementById("modal-title")!;
    this.modalBody = document.getElementById("modal-body")!;
    this.closeButton = document.getElementById("modal-close")!;

    this.raycaster = new Raycaster();
    this.mouse = new Vector2();

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.closeButton.addEventListener("click", () => this.closeModal());

    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modal) {
        this.closeModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.closeModal();
      }
    });

    window.addEventListener("click", (event: MouseEvent) =>
      this.onWindowClick(event)
    );
  }

  private onWindowClick(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes = this.planets.map((planet) => planet.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as Mesh;
      const planet = this.planets.find((p) => p.mesh === clickedMesh);

      if (planet) {
        this.showPlanetInfo(planet.name);
      }
    }
  }

  private getPlanetKey(meshName: string): string | null {
    // Mapping correct selon l'ordre du système solaire : Mercure, Vénus, Terre, Mars, Jupiter, Saturne, Uranus, Neptune
    const nameMapping: { [key: string]: string } = {
      Object_4: "mercure",    // Le plus proche du soleil
      Object_6: "venus",      // Deuxième planète
      Object_8: "earth",      // Troisième planète (utilise "earth" comme dans le JSON)
      Object_10: "mars",      // Quatrième planète
      Object_12: "jupiter",   // Cinquième planète
      Object_14: "saturne",   // Sixième planète
      Object_16: "uranus",    // Septième planète
      Object_18: "neptune",   // Huitième planète
      Object_20: "sun",       // Le soleil
      Object_22: "moon",      // La lune (satellite de la Terre)
      Object_24: "ceres",     // Planète naine
      Object_26: "eris",      // Planète naine
      Object_28: "haumea",    // Planète naine
      Object_30: "makemake",  // Planète naine
      Object_32: "saturne",   // Anneaux de Saturne (même données que Saturne)
    };

    return nameMapping[meshName] || null;
  }

  private showPlanetInfo(meshName: string): void {
    const planetKey = this.getPlanetKey(meshName);

    if (!planetKey) {
      console.warn(`No planet data found for mesh: ${meshName}`);
      return;
    }

    // Cas spécial pour la lune
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

  private showMoonInfo(): void {
    // La lune est dans les satellites de la Terre
    const earthData = planetsData.solarSystem.planets.earth;
    const moonData = earthData.satellites?.[0];

    if (!moonData) {
      console.warn("Moon data not found in Earth satellites");
      return;
    }

    this.modalTitle.textContent = moonData.name;

    let html = `<div class="planet-type">${moonData.type}</div>`;
    html += '<div class="info-section">';

    if (moonData.diameter_km) {
      html += `<div class="info-row">
        <span class="info-label">Diamètre:</span>
        <span class="info-value">${this.formatNumber(
          moonData.diameter_km
        )} km</span>
      </div>`;
    }

    if (moonData.mass_kg) {
      html += `<div class="info-row">
        <span class="info-label">Masse:</span>
        <span class="info-value">${this.formatNumber(
          moonData.mass_kg
        )} kg</span>
      </div>`;
    }

    if (moonData.gravity_m_s2) {
      html += `<div class="info-row">
        <span class="info-label">Gravité:</span>
        <span class="info-value">${this.formatNumber(
          moonData.gravity_m_s2
        )} m/s²</span>
      </div>`;
    }

    if (moonData.distance_from_planet_km) {
      html += `<div class="info-row">
        <span class="info-label">Distance de la Terre:</span>
        <span class="info-value">${this.formatNumber(
          moonData.distance_from_planet_km
        )} km</span>
      </div>`;
    }

    html += "</div>";

    if (moonData.notes) {
      html += '<div class="notes">';
      html += '<div class="notes-title">Notes</div>';
      html += `<div class="notes-text">${moonData.notes}</div>`;
      html += "</div>";
    }

    this.modalBody.innerHTML = html;
    this.modal.classList.add("show");
  }

  private formatNumber(
    value: string | number | { a: string; b: string }
  ): string {
    if (typeof value === "object" && value.a && value.b) {
      return `${value.a} × ${value.b}`;
    }
    if (typeof value === "string") {
      if (value.includes("e")) {
        return parseFloat(value).toExponential(2);
      }
      return value;
    }
    return value.toLocaleString();
  }

  private generatePlanetHTML(data: PlanetData): string {
    let html = `<div class="planet-type">${data.type}</div>`;

    html += '<div class="info-section">';

    if (data.diameter_km) {
      html += `<div class="info-row">
        <span class="info-label">Diamètre:</span>
        <span class="info-value">${this.formatNumber(
          data.diameter_km
        )} km</span>
      </div>`;
    }

    if (data.mass_kg) {
      html += `<div class="info-row">
        <span class="info-label">Masse:</span>
        <span class="info-value">${this.formatNumber(data.mass_kg)} kg</span>
      </div>`;
    }

    if (data.gravity_m_s2) {
      html += `<div class="info-row">
        <span class="info-label">Gravité:</span>
        <span class="info-value">${this.formatNumber(
          data.gravity_m_s2
        )} m/s²</span>
      </div>`;
    }

    if (data.distance_from_sun_au) {
      html += `<div class="info-row">
        <span class="info-label">Distance du Soleil:</span>
        <span class="info-value">${this.formatNumber(
          data.distance_from_sun_au
        )} UA</span>
      </div>`;
    }

    if (data.distance_from_sun_km) {
      html += `<div class="info-row">
        <span class="info-label">Distance du Soleil:</span>
        <span class="info-value">${this.formatNumber(
          data.distance_from_sun_km
        )} km</span>
      </div>`;
    }

    if (data.average_temperature_c) {
      html += `<div class="info-row">
        <span class="info-label">Température moyenne:</span>
        <span class="info-value">${this.formatNumber(
          data.average_temperature_c
        )}°C</span>
      </div>`;
    }

    if (data.temperature_surface_c) {
      html += `<div class="info-row">
        <span class="info-label">Température de surface:</span>
        <span class="info-value">${this.formatNumber(
          data.temperature_surface_c
        )}°C</span>
      </div>`;
    }

    if (data.temperature_core_c) {
      html += `<div class="info-row">
        <span class="info-label">Température du noyau:</span>
        <span class="info-value">${this.formatNumber(
          data.temperature_core_c
        )}°C</span>
      </div>`;
    }

    if (data.rotation_period_days_sidereal) {
      html += `<div class="info-row">
        <span class="info-label">Période de rotation:</span>
        <span class="info-value">${this.formatNumber(
          data.rotation_period_days_sidereal
        )} jours</span>
      </div>`;
    }

    if (data.rotation_period_hours_sidereal) {
      html += `<div class="info-row">
        <span class="info-label">Période de rotation:</span>
        <span class="info-value">${this.formatNumber(
          data.rotation_period_hours_sidereal
        )} heures</span>
      </div>`;
    }

    if (data.rotation_direction) {
      html += `<div class="info-row">
        <span class="info-label">Direction de rotation:</span>
        <span class="info-value">${data.rotation_direction}</span>
      </div>`;
    }

    if (data.orbital_period_days) {
      html += `<div class="info-row">
        <span class="info-label">Période orbitale:</span>
        <span class="info-value">${this.formatNumber(
          data.orbital_period_days
        )} jours</span>
      </div>`;
    }

    if (data.orbital_period_years) {
      html += `<div class="info-row">
        <span class="info-label">Période orbitale:</span>
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
          html += `<div style="margin-top: 5px; font-style: italic;">${satellite.notes}</div>`;
        }

        html += "</div>";
      });

      html += "</div>";
    }

    if (data.notes) {
      html += '<div class="notes">';
      html += '<div class="notes-title">Notes</div>';
      html += `<div class="notes-text">${data.notes}</div>`;
      html += "</div>";
    }

    return html;
  }

  private closeModal(): void {
    this.modal.classList.remove("show");
  }
}

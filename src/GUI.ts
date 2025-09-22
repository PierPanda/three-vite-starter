import { Pane } from "tweakpane";
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";
import type { Lifecycle } from "~/core";
import type { App } from "~/App";

export class GUI extends Pane implements Lifecycle {
  public app: App;
  private sunFolder: any = null;

  public get container(): HTMLElement {
    return <HTMLElement>this.element.parentNode;
  }

  public constructor(app: App) {
    super({
      container: document.createElement("div"),
    });

    this.registerPlugin(EssentialsPlugin);
    this.app = app;
    this.applyStyle();
  }

  public start(): void {
    this.app.renderer.domElement.parentElement?.appendChild(this.container);
    let retryCount = 0;
    const maxRetries = 20;
    const checkAndAddControls = () => {
      retryCount++;

      if (this.app.sunMaterial && this.app.sunMaterial.uniforms) {
        this.addSunControls();
      } else if (retryCount < maxRetries) {
        setTimeout(checkAndAddControls, 200);
      } else {
        console.error(
          "❌ Échec: Matériau du soleil non trouvé après",
          maxRetries,
          "tentatives"
        );
      }
    };

    setTimeout(checkAndAddControls, 100);

    this.addPlanetControls();
  }

  public stop(): void {
    this.container.remove();
  }

  public dispose(): void {
    this.app.loop.tick = this.app.tick;
    this.stop();
    super.dispose();
  }

  private applyStyle(): void {
    this.container.style.width = "320px";
    this.container.style.top = "20px";
    this.container.style.right = "20px";
    this.container.style.position = "absolute";
    this.container.style.borderRadius = "16px";
    this.container.style.border = "1px solid rgba(64, 224, 255, 0.2)";
    this.container.style.backdropFilter = "blur(10px)";
    this.container.style.boxShadow =
      "0 25px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(64, 224, 255, 0.1)";

    this.element.style.setProperty(
      "--tp-base-background-color",
      "linear-gradient(145deg, #0a0f1c 0%, #1a1f2e 50%, #0f1419 100%)"
    );
    this.element.style.setProperty(
      "--tp-base-shadow-color",
      "rgba(0, 0, 0, 0)"
    );
    this.element.style.setProperty(
      "--tp-base-border-color",
      "rgba(64, 224, 255, 0.15)"
    );

    this.element.style.setProperty(
      "--tp-input-background-color",
      "rgba(64, 224, 255, 0.08)"
    );
    this.element.style.setProperty("--tp-input-foreground-color", "#ffffff");
    this.element.style.setProperty(
      "--tp-input-border-color",
      "rgba(64, 224, 255, 0.2)"
    );
    this.element.style.setProperty(
      "--tp-input-focus-border-color",
      "rgba(64, 224, 255, 0.5)"
    );

    this.element.style.setProperty("--tp-label-foreground-color", "#a0b3c5");
    this.element.style.setProperty("--tp-monitor-foreground-color", "#40e0ff");

    this.element.style.setProperty(
      "--tp-button-background-color",
      "linear-gradient(135deg, rgba(64, 224, 255, 0.2) 0%, rgba(64, 224, 255, 0.1) 100%)"
    );
    this.element.style.setProperty("--tp-button-foreground-color", "#ffffff");
    this.element.style.setProperty(
      "--tp-button-border-color",
      "rgba(64, 224, 255, 0.4)"
    );
    this.element.style.setProperty(
      "--tp-button-hover-background-color",
      "rgba(64, 224, 255, 0.3)"
    );

    this.element.style.setProperty("--bld-vw", "200px");
    this.element.style.setProperty("--tp-input-height", "28px");
    this.element.style.setProperty("--tp-folder-margin", "8px");
    this.element.style.setProperty("--tp-container-padding", "16px");

    this.element.style.fontFamily = '"Inter", sans-serif';
    this.element.style.fontSize = "13px";
    this.element.style.fontWeight = "500";
    this.element.style.textAlign = "right";

    this.element.style.background = "rgba(10, 15, 28, 0.85)";
    this.element.style.borderRadius = "16px";
  }

  private addSunControls(): void {
    const sunMaterial = this.app.sunMaterial;

    if (sunMaterial && sunMaterial.uniforms) {
      if (this.sunFolder) {
        this.sunFolder.dispose();
        this.sunFolder = null;
      }

      this.sunFolder = this.addFolder({
        title: "☀️ Contrôles du Soleil",
        expanded: true,
      });

      if (
        sunMaterial.uniforms.noiseSpeed &&
        sunMaterial.uniforms.noiseAmplitude
      ) {
        this.sunFolder.addBinding(sunMaterial.uniforms.noiseSpeed, "value", {
          min: 0,
          max: 0.1,
          step: 0.001,
          label: "🌀 Vitesse",
        });

        this.sunFolder.addBinding(
          sunMaterial.uniforms.noiseAmplitude,
          "value",
          {
            min: 0,
            max: 1,
            step: 0.01,
            label: "📈 Amplitude",
          }
        );

        const sunResetButton = this.sunFolder.addButton({
          title: "🔄 Réinitialiser",
        });

        const sunResetHandler = () => {
          const defaultNoiseSpeed = 0.025;
          const defaultNoiseAmplitude = 0.2;

          sunMaterial.uniforms.noiseSpeed.value = defaultNoiseSpeed;
          sunMaterial.uniforms.noiseAmplitude.value = defaultNoiseAmplitude;

          this.refresh();
        };

        sunResetButton.on("click", sunResetHandler);
        sunResetButton.element.addEventListener("touchend", sunResetHandler);
      }
    }
  }

  private addPlanetControls(): void {
    const planetFolder = this.addFolder({
      title: "🪐 Système Planétaire",
      expanded: true,
    });

    planetFolder.addBinding(this.app.scene, "orbitalSpeedMultiplier", {
      min: 0,
      max: 2,
      step: 0.01,
      label: "🌌 Vitesse Orbitale",
    });

    const planetResetButton = planetFolder.addButton({
      title: "🔄 Réinitialiser",
    });

    const planetResetHandler = () => {
      this.app.scene.orbitalSpeedMultiplier = 1;
      this.refresh();
    };

    planetResetButton.on("click", planetResetHandler);
    planetResetButton.element.addEventListener("touchend", planetResetHandler);

    this.addBinding(this.app.scene, "orbitalSpeedMultiplier", {
      readonly: true,
      label: "📊 Vitesse Actuelle",
      format: (v: number) => v.toFixed(2) + "x",
    });
  }
}

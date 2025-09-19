import { Pane } from "tweakpane";
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";
import type { Lifecycle } from "~/core";
import type { App } from "~/App";

export class GUI extends Pane implements Lifecycle {
  public app: App;

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
    this.container.style.width = "300px";
    this.container.style.top = "20px";
    this.container.style.right = "20px";
    this.container.style.position = "absolute";

    this.element.style.textAlign = "right";
    this.element.style.setProperty("--tp-base-background-color", "#000");
    this.element.style.setProperty(
      "--tp-base-shadow-color",
      "rgba(0, 0, 0, 0)"
    );
    this.element.style.setProperty("--bld-vw", "190px");
  }

  private addSunControls(): void {
    const sunMaterial = this.app.sunMaterial;

    if (sunMaterial && sunMaterial.uniforms) {
      if (
        sunMaterial.uniforms.noiseSpeed &&
        sunMaterial.uniforms.noiseAmplitude
      ) {
        this.addBinding(sunMaterial.uniforms.noiseSpeed, "value", {
          min: 0,
          max: 0.1,
          step: 0.001,
          label: "🌀 Vitesse du bruit",
        });

        this.addBinding(sunMaterial.uniforms.noiseAmplitude, "value", {
          min: 0,
          max: 1,
          step: 0.01,
          label: "📈 Amplitude du bruit",
        });

        this.addButton({
          title: "🔄 Reset Soleil",
        }).on("click", () => {
          const defaultNoiseSpeed = 0.025;
          const defaultNoiseAmplitude = 0.2;

          sunMaterial.uniforms.noiseSpeed.value = defaultNoiseSpeed;
          sunMaterial.uniforms.noiseAmplitude.value = defaultNoiseAmplitude;

          this.refresh();
          setTimeout(() => {
            this.addSunControls();
          }, 500);
        });
      }
    }
  }

  private addPlanetControls(): void {
    this.addBinding(this.app.scene, "orbitalSpeedMultiplier", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "🪐 Vitesse orbitale",
    });

    this.addButton({
      title: "🔄 Reset Vitesse",
    }).on("click", () => {
      this.app.scene.orbitalSpeedMultiplier = 1;
      this.refresh();
    });
  }
}

import { Pane } from "tweakpane";
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";
import type { Lifecycle } from "~/core";
import type { App } from "~/App";

export class GUI extends Pane implements Lifecycle {
  public app: App;
  public fpsGraph: EssentialsPlugin.FpsGraphBladeApi;

  public get container(): HTMLElement {
    return <HTMLElement>this.element.parentNode;
  }

  public constructor(app: App) {
    super({
      container: document.createElement("div"),
    });

    this.registerPlugin(EssentialsPlugin);
    this.app = app;

    this.fpsGraph = <EssentialsPlugin.FpsGraphBladeApi>this.addBlade({
      view: "fpsgraph",
      label: "",
      rows: 2,
    });

    this.app.loop.tick = () => {
      this.fpsGraph.begin();
      this.app.tick();
      this.fpsGraph.end();
    };

    const lifecycleMethods = ["start", "stop", "dispose"] as const;

    (<EssentialsPlugin.ButtonGridApi>this.addBlade({
      view: "buttongrid",
      size: [lifecycleMethods.length, 1],
      cells: (x: number) => ({ title: lifecycleMethods[x] }),
      label: "",
    })).on("click", (event: any) => {
      this.app[lifecycleMethods[event.index[0]]]();
      this.toggleFpsGraph(this.app.loop.running);
    });

    this.applyStyle();
  }

  public start(): void {
    this.app.renderer.domElement.parentElement?.appendChild(this.container);

    console.log("🚀 Démarrage de la GUI...");

    // Système de retry avec compteur pour éviter les boucles infinies
    let retryCount = 0;
    const maxRetries = 20; // Maximum 20 tentatives (4 secondes)

    const checkAndAddControls = () => {
      retryCount++;
      console.log(
        `🔍 Tentative ${retryCount}/${maxRetries} - Vérification du matériau du soleil...`
      );

      if (this.app.sunMaterial && this.app.sunMaterial.uniforms) {
        console.log("✅ Matériau trouvé, ajout des contrôles...");
        this.addSunControls();
      } else if (retryCount < maxRetries) {
        console.log(`⏳ Matériau non trouvé, retry dans 200ms...`);
        setTimeout(checkAndAddControls, 200);
      } else {
        console.error(
          "❌ Échec: Matériau du soleil non trouvé après",
          maxRetries,
          "tentatives"
        );
        console.log("🔍 Debug - App:", this.app);
        console.log("🔍 Debug - Scene:", this.app.scene);
        console.log(
          "🔍 Debug - Enhanced material:",
          this.app.scene?.enhancedSunMaterial
        );
      }
    };

    // Première tentative après 100ms
    setTimeout(checkAndAddControls, 100);
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
        }).on("change", (ev: any) => {
          console.log("🔄 noiseSpeed changé:", ev.value);
        });

        this.addBinding(sunMaterial.uniforms.noiseAmplitude, "value", {
          min: 0,
          max: 1,
          step: 0.01,
          label: "📈 Amplitude du bruit",
        }).on("change", (ev: any) => {
          console.log("🔄 noiseAmplitude changé:", ev.value);
        });

        this.addButton({
          title: "🔄 Reset Soleil",
        }).on("click", () => {
          const defaultNoiseSpeed = 0.025;
          const defaultNoiseAmplitude = 0.2;

          sunMaterial.uniforms.noiseSpeed.value = defaultNoiseSpeed;
          sunMaterial.uniforms.noiseAmplitude.value = defaultNoiseAmplitude;

          console.log("🔄 Valeurs réinitialisées");
          this.refresh();
          setTimeout(() => {
            this.addSunControls();
          }, 500);
        });
      }
    }
  }

  private toggleFpsGraph(enabled: boolean): void {
    this.fpsGraph.disabled = !enabled;

    const stopwatch = (<any>this.fpsGraph.controller.valueController)
      .stopwatch_;

    if (!stopwatch.baseCalculateFps_) {
      stopwatch.baseCalculateFps_ = stopwatch.calculateFps_;
    }

    stopwatch.calculateFps_ = enabled ? stopwatch.baseCalculateFps_ : () => 0;

    if (!enabled) {
      stopwatch.fps_ = 0;
    }
  }
}

import {
  Vector2,
  Vector3,
  Vector4,
  Spherical,
  Box3,
  Sphere,
  Quaternion,
  Matrix4,
  Raycaster,
  type PerspectiveCamera,
  type OrthographicCamera,
} from "three";

import CameraControls from "camera-controls";
import type { Clock, Lifecycle } from "~/core";

CameraControls.install({
  THREE: {
    Vector2,
    Vector3,
    Vector4,
    Quaternion,
    Matrix4,
    Spherical,
    Box3,
    Sphere,
    Raycaster,
  },
});

export interface ControlsParameters {
  camera: PerspectiveCamera | OrthographicCamera;
  element: HTMLElement;
  clock: Clock;
}

export class Controls extends CameraControls implements Lifecycle {
  public clock: Clock;
  public element: HTMLElement;
  private keys: Set<string> = new Set();
  private moveSpeed: number = 100;

  public constructor({ camera, element, clock }: ControlsParameters) {
    super(camera);

    this.clock = clock;
    this.element = element;
    this.minDistance = 100;
    this.maxDistance = 50000;
    this.setPosition(0, 0, -2000);

    this.dampingFactor = 0.05;
    this.draggingDampingFactor = 0.25;

    this.setupKeyboardControls();
  }

  private setupKeyboardControls(): void {
    const handleKeyDown = (event: KeyboardEvent) => {
      this.keys.add(event.code);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      this.keys.delete(event.code);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
  }

  private handleKeyboardMovement(): void {
    const deltaTime = this.clock.delta / 1000;
    const speed = this.moveSpeed * deltaTime;

    if (this.keys.has("ArrowUp") || this.keys.has("KeyW")) {
      this.forward(speed);
    }
    if (this.keys.has("ArrowDown") || this.keys.has("KeyS")) {
      this.forward(-speed);
    }
    if (this.keys.has("ArrowLeft") || this.keys.has("KeyA")) {
      this.truck(-speed, 0);
    }
    if (this.keys.has("ArrowRight") || this.keys.has("KeyD")) {
      this.truck(speed, 0);
    }
    if (this.keys.has("KeyQ") || this.keys.has("Space")) {
      this.truck(0, speed);
    }
    if (this.keys.has("KeyE") || this.keys.has("ShiftLeft")) {
      this.truck(0, -speed);
    }
  }

  public start(): void {
    this.disconnect();
    this.connect(this.element);
  }

  public stop(): void {
    this.disconnect();
  }

  public update = (): boolean => {
    this.handleKeyboardMovement();
    return super.update(this.clock.delta / 1000);
  };
}

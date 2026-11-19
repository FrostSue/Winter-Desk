import { FairyLights } from "./FairyLights";
import { Ornament } from "./Ornament";
import type { OrnamentType, LightColorTheme } from "../types";

export class DecorationManager {
  private lights: FairyLights[] = [];
  private ornaments: Ornament[] = [];
  private draggedLight: {
    light: FairyLights;
    handle: "p1" | "p2" | "body";
    startMouseX: number;
    startMouseY: number;
    p1StartX: number;
    p1StartY: number;
    p2StartX: number;
    p2StartY: number;
  } | null = null;
  private draggedOrnament: { ornament: Ornament; offsetX: number; offsetY: number } | null = null;

  constructor() {
    const screenW = window.innerWidth;
    this.lights.push(new FairyLights(0, 4, screenW, 4, "rainbow"));
    this.ornaments.push(new Ornament(screenW * 0.18, 28, "red-bauble"));
    this.ornaments.push(new Ornament(screenW * 0.36, 28, "wreath"));
    this.ornaments.push(new Ornament(screenW * 0.54, 28, "bells"));
    this.ornaments.push(new Ornament(screenW * 0.72, 28, "tree"));
    this.ornaments.push(new Ornament(screenW * 0.88, 28, "gold-bauble"));
  }

  public resize(newWidth: number): void {
    if (this.lights.length > 0) {
      this.lights[0].resize(newWidth);
    }
  }

  public setLightsTheme(theme: LightColorTheme): void {
    for (const light of this.lights) {
      light.setColorTheme(theme);
    }
  }

  public setLightsHeight(newY: number): void {
    for (const light of this.lights) {
      light.setHeight(newY);
    }
  }

  public addLights(x1: number, y1: number, x2: number, y2: number, theme: LightColorTheme = "rainbow"): void {
    this.lights.push(new FairyLights(x1, y1, x2, y2, theme));
  }

  public addOrnament(x: number, y: number, type: OrnamentType): void {
    this.ornaments.push(new Ornament(x, y, type));
  }

  public clearOrnaments(): void {
    this.ornaments = [];
  }

  public removeOrnamentAt(px: number, py: number): boolean {
    for (let i = this.ornaments.length - 1; i >= 0; i--) {
      if (this.ornaments[i].containsPoint(px, py)) {
        this.ornaments.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  public update(): void {
    for (const light of this.lights) {
      light.update();
    }
    for (const ornament of this.ornaments) {
      ornament.update();
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    for (const light of this.lights) {
      light.draw(ctx);
    }
    for (const ornament of this.ornaments) {
      ornament.draw(ctx);
    }
  }

  public hitTest(px: number, py: number): boolean {
    for (const light of this.lights) {
      if (light.hitTest(px, py) !== null) return true;
    }
    for (const ornament of this.ornaments) {
      if (ornament.containsPoint(px, py)) return true;
    }
    return false;
  }

  public isDraggingAny(): boolean {
    return this.draggedLight !== null || this.draggedOrnament !== null;
  }

  public handleMouseDown(px: number, py: number, button = 0): boolean {
    if (button === 2) {
      return this.removeOrnamentAt(px, py);
    }

    for (const light of this.lights) {
      const hit = light.hitTest(px, py);
      if (hit) {
        this.draggedLight = {
          light,
          handle: hit,
          startMouseX: px,
          startMouseY: py,
          p1StartX: light.p1.x,
          p1StartY: light.p1.y,
          p2StartX: light.p2.x,
          p2StartY: light.p2.y
        };
        if (hit === "p1") light.isDraggingP1 = true;
        if (hit === "p2") light.isDraggingP2 = true;
        if (hit === "body") light.isDraggingBody = true;
        return true;
      }
    }

    for (const ornament of this.ornaments) {
      if (ornament.containsPoint(px, py)) {
        this.draggedOrnament = {
          ornament,
          offsetX: px - ornament.x,
          offsetY: py - ornament.y
        };
        ornament.isDragging = true;
        return true;
      }
    }

    return false;
  }

  public handleMouseMove(px: number, py: number): boolean {
    if (this.draggedLight) {
      const dx = px - this.draggedLight.startMouseX;
      const dy = py - this.draggedLight.startMouseY;

      if (this.draggedLight.handle === "p1") {
        this.draggedLight.light.p1.x = px;
        this.draggedLight.light.p1.y = py;
      } else if (this.draggedLight.handle === "p2") {
        this.draggedLight.light.p2.x = px;
        this.draggedLight.light.p2.y = py;
      } else if (this.draggedLight.handle === "body") {
        this.draggedLight.light.p1.x = this.draggedLight.p1StartX + dx;
        this.draggedLight.light.p1.y = this.draggedLight.p1StartY + dy;
        this.draggedLight.light.p2.x = this.draggedLight.p2StartX + dx;
        this.draggedLight.light.p2.y = this.draggedLight.p2StartY + dy;
      }
      return true;
    }

    if (this.draggedOrnament) {
      this.draggedOrnament.ornament.x = px - this.draggedOrnament.offsetX;
      this.draggedOrnament.ornament.y = py - this.draggedOrnament.offsetY;
      return true;
    }

    let hovering = false;
    for (const light of this.lights) {
      const hit = light.hitTest(px, py);
      light.isHovered = hit !== null;
      if (hit) hovering = true;
    }

    if (!hovering) {
      for (const ornament of this.ornaments) {
        if (ornament.containsPoint(px, py)) {
          hovering = true;
          ornament.impulse(0.08);
          break;
        }
      }
    }

    return hovering;
  }

  public handleMouseUp(): void {
    if (this.draggedLight) {
      this.draggedLight.light.isDraggingP1 = false;
      this.draggedLight.light.isDraggingP2 = false;
      this.draggedLight.light.isDraggingBody = false;
      this.draggedLight = null;
    }

    if (this.draggedOrnament) {
      this.draggedOrnament.ornament.isDragging = false;
      this.draggedOrnament = null;
    }
  }
}

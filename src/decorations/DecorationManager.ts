import { FairyLights } from "./FairyLights";
import { Ornament, type OrnamentType } from "./Ornament";

export class DecorationManager {
  private lights: FairyLights[] = [];
  private ornaments: Ornament[] = [];
  private draggedLight: { light: FairyLights; handle: "p1" | "p2" } | null = null;
  private draggedOrnament: Ornament | null = null;
  private isHovering = false;

  constructor() {
    const screenW = window.innerWidth;
    this.lights.push(new FairyLights(0, 6, screenW, 6));
    this.ornaments.push(new Ornament(screenW * 0.2, 35, "red-bauble"));
    this.ornaments.push(new Ornament(screenW * 0.5, 38, "wreath"));
    this.ornaments.push(new Ornament(screenW * 0.8, 35, "gold-bauble"));
  }

  public resize(newWidth: number): void {
    if (this.lights.length > 0) {
      this.lights[0].resize(newWidth);
    }
  }

  public addOrnament(x: number, y: number, type: OrnamentType): void {
    this.ornaments.push(new Ornament(x, y, type));
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

  public handleMouseDown(px: number, py: number, button = 0): boolean {
    if (button === 2) {
      return this.removeOrnamentAt(px, py);
    }

    for (const light of this.lights) {
      const hit = light.hitTest(px, py);
      if (hit) {
        this.draggedLight = { light, handle: hit };
        if (hit === "p1") light.isDraggingP1 = true;
        if (hit === "p2") light.isDraggingP2 = true;
        return true;
      }
    }

    for (const ornament of this.ornaments) {
      if (ornament.containsPoint(px, py)) {
        this.draggedOrnament = ornament;
        ornament.isDragging = true;
        return true;
      }
    }

    return false;
  }

  public handleMouseMove(px: number, py: number): boolean {
    if (this.draggedLight) {
      if (this.draggedLight.handle === "p1") {
        this.draggedLight.light.p1.x = px;
        this.draggedLight.light.p1.y = py;
      } else {
        this.draggedLight.light.p2.x = px;
        this.draggedLight.light.p2.y = py;
      }
      return true;
    }

    if (this.draggedOrnament) {
      this.draggedOrnament.x = px;
      this.draggedOrnament.y = py;
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

    if (hovering !== this.isHovering) {
      this.isHovering = hovering;
      window.winterDesk?.setIgnoreMouseEvents(!hovering);
    }

    return hovering;
  }

  public handleMouseUp(): void {
    if (this.draggedLight) {
      this.draggedLight.light.isDraggingP1 = false;
      this.draggedLight.light.isDraggingP2 = false;
      this.draggedLight = null;
    }

    if (this.draggedOrnament) {
      this.draggedOrnament.isDragging = false;
      this.draggedOrnament = null;
    }
  }

  public isInteracting(): boolean {
    return this.draggedLight !== null || this.draggedOrnament !== null || this.isHovering;
  }
}

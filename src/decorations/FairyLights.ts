import type { LightColorTheme } from "../types";

export interface LightHandle {
  x: number;
  y: number;
  radius: number;
}

export class FairyLights {
  public p1: LightHandle;
  public p2: LightHandle;
  public pMid: LightHandle;
  public isDraggingP1 = false;
  public isDraggingP2 = false;
  public isDraggingPMid = false;
  public isDraggingBody = false;
  public isHovered = false;
  public theme: LightColorTheme = "rainbow";
  private animTimer = 0;

  private colorPalettes: Record<LightColorTheme, string[]> = {
    rainbow: ["#ff5252", "#ffd740", "#69f0ae", "#40c4ff", "#e040fb", "#ff6e40"],
    "warm-white": ["#fff8e1", "#ffecb3", "#ffe082", "#ffd54f", "#fff9c4"],
    "ice-blue": ["#e1f5fe", "#81d4fa", "#29b6f6", "#0288d1", "#e0f7fa"],
    candy: ["#ff1744", "#ffffff", "#00e676", "#ffffff", "#d50000"]
  };

  constructor(x1: number, y1: number, x2: number, y2: number, theme: LightColorTheme = "rainbow") {
    this.p1 = { x: x1, y: y1, radius: 7 };
    this.p2 = { x: x2, y: y2, radius: 7 };
    this.pMid = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 + 10, radius: 9 };
    this.theme = theme;
  }

  public setColorTheme(theme: LightColorTheme): void {
    this.theme = theme;
  }

  public setSag(sagDepth: number): void {
    this.pMid.x = (this.p1.x + this.p2.x) / 2;
    this.pMid.y = (this.p1.y + this.p2.y) / 2 + sagDepth;
  }

  public setHeight(newY: number): void {
    const dy = newY - this.p1.y;
    this.p1.y = newY;
    this.p2.y += dy;
    this.pMid.y += dy;
  }

  public update(): void {
    this.animTimer += 0.04;
  }

  public resize(newWidth: number): void {
    const ratio = newWidth / (this.p2.x || 1);
    this.p1.x = 0;
    this.p2.x = newWidth;
    this.pMid.x = this.pMid.x * ratio;
  }

  public hitTest(px: number, py: number): "p1" | "p2" | "pMid" | "body" | null {
    if (Math.hypot(px - this.pMid.x, py - this.pMid.y) <= this.pMid.radius + 18) {
      return "pMid";
    }

    if (Math.hypot(px - this.p1.x, py - this.p1.y) <= this.p1.radius + 14) {
      return "p1";
    }

    if (Math.hypot(px - this.p2.x, py - this.p2.y) <= this.p2.radius + 14) {
      return "p2";
    }

    const minX = Math.min(this.p1.x, this.p2.x);
    const maxX = Math.max(this.p1.x, this.p2.x);
    if (px >= minX && px <= maxX) {
      const t = (px - this.p1.x) / (this.p2.x - this.p1.x || 1);
      const ctrlY = 2 * this.pMid.y - 0.5 * this.p1.y - 0.5 * this.p2.y;
      const wireY = (1 - t) * (1 - t) * this.p1.y + 2 * (1 - t) * t * ctrlY + t * t * this.p2.y;
      if (Math.abs(py - wireY) <= 20) {
        return "body";
      }
    }

    return null;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    const totalDistance = Math.hypot(this.p2.x - this.p1.x, this.p2.y - this.p1.y);
    if (totalDistance < 20) return;

    const scallopSpan = 95;
    const scallopCount = Math.max(1, Math.round(totalDistance / scallopSpan));
    const colors = this.colorPalettes[this.theme] || this.colorPalettes.rainbow;

    const ctrlX = 2 * this.pMid.x - 0.5 * this.p1.x - 0.5 * this.p2.x;
    const ctrlY = 2 * this.pMid.y - 0.5 * this.p1.y - 0.5 * this.p2.y;

    ctx.save();
    let bulbIndex = 0;

    for (let s = 0; s < scallopCount; s++) {
      const tStart = s / scallopCount;
      const tEnd = (s + 1) / scallopCount;

      const sx1 = (1 - tStart) * (1 - tStart) * this.p1.x + 2 * (1 - tStart) * tStart * ctrlX + tStart * tStart * this.p2.x;
      const sy1 = (1 - tStart) * (1 - tStart) * this.p1.y + 2 * (1 - tStart) * tStart * ctrlY + tStart * tStart * this.p2.y;
      const sx2 = (1 - tEnd) * (1 - tEnd) * this.p1.x + 2 * (1 - tEnd) * tEnd * ctrlX + tEnd * tEnd * this.p2.x;
      const sy2 = (1 - tEnd) * (1 - tEnd) * this.p1.y + 2 * (1 - tEnd) * tEnd * ctrlY + tEnd * tEnd * this.p2.y;

      const midX = (sx1 + sx2) / 2;
      const midY = (sy1 + sy2) / 2 + 5;

      ctx.beginPath();
      ctx.moveTo(sx1, sy1);
      ctx.quadraticCurveTo(midX, midY, sx2, sy2);
      ctx.strokeStyle = "rgba(45, 55, 72, 0.75)";
      ctx.lineWidth = 1.4;
      ctx.stroke();

      const bulbsPerScallop = 5;
      for (let b = 1; b < bulbsPerScallop; b++) {
        const bt = b / bulbsPerScallop;
        const bx = (1 - bt) * (1 - bt) * sx1 + 2 * (1 - bt) * bt * midX + bt * bt * sx2;
        const by = (1 - bt) * (1 - bt) * sy1 + 2 * (1 - bt) * bt * midY + bt * bt * sy2;

        const color = colors[bulbIndex % colors.length];
        const intensity = 0.5 + 0.5 * Math.sin(this.animTimer * 2.5 + bulbIndex * 1.2);

        this.drawBulb(ctx, bx, by, color, intensity);
        bulbIndex++;
      }
    }

    if (this.isHovered || this.isDraggingP1 || this.isDraggingP2 || this.isDraggingPMid || this.isDraggingBody) {
      this.drawHandle(ctx, this.p1, this.isDraggingP1, "circle");
      this.drawHandle(ctx, this.p2, this.isDraggingP2, "circle");
      this.drawHandle(ctx, this.pMid, this.isDraggingPMid, "diamond");
    }

    ctx.restore();
  }

  private drawBulb(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    intensity: number
  ): void {
    ctx.fillStyle = "#263238";
    ctx.fillRect(x - 1, y - 1, 2, 2);

    const glowRadius = 5 + intensity * 6;
    const glow = ctx.createRadialGradient(x, y + 3, 1, x, y + 3, glowRadius);
    glow.addColorStop(0, color);
    glow.addColorStop(0.5, color);
    glow.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y + 3, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(x, y + 3, 2.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }

  private drawHandle(ctx: CanvasRenderingContext2D, handle: LightHandle, isActive: boolean, shape: "circle" | "diamond"): void {
    ctx.save();
    ctx.translate(handle.x, handle.y);

    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, handle.radius, 0, Math.PI * 2);
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -handle.radius - 2);
      ctx.lineTo(handle.radius + 2, 0);
      ctx.lineTo(0, handle.radius + 2);
      ctx.lineTo(-handle.radius - 2, 0);
      ctx.closePath();
    }

    ctx.fillStyle = isActive ? "#ff9800" : "rgba(255, 255, 255, 0.9)";
    ctx.strokeStyle = "#263238";
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

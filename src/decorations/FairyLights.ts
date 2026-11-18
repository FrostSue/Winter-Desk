export interface LightHandle {
  x: number;
  y: number;
  radius: number;
}

export class FairyLights {
  public p1: LightHandle;
  public p2: LightHandle;
  public isDraggingP1 = false;
  public isDraggingP2 = false;
  private bulbColors = ["#ff5252", "#ffd740", "#69f0ae", "#40c4ff", "#e040fb", "#ff6e40"];
  private animTimer = 0;

  constructor(x1: number, y1: number, x2: number, y2: number) {
    this.p1 = { x: x1, y: y1, radius: 8 };
    this.p2 = { x: x2, y: y2, radius: 8 };
  }

  public update(): void {
    this.animTimer += 0.04;
  }

  public hitTest(px: number, py: number): "p1" | "p2" | null {
    const d1 = Math.hypot(px - this.p1.x, py - this.p1.y);
    if (d1 <= this.p1.radius + 6) return "p1";

    const d2 = Math.hypot(px - this.p2.x, py - this.p2.y);
    if (d2 <= this.p2.radius + 6) return "p2";

    return null;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 20) return;

    const sag = Math.min(80, distance * 0.18);
    const midX = (this.p1.x + this.p2.x) / 2;
    const midY = (this.p1.y + this.p2.y) / 2 + sag;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.p1.x, this.p1.y);
    ctx.quadraticCurveTo(midX, midY, this.p2.x, this.p2.y);
    ctx.strokeStyle = "#37474f";
    ctx.lineWidth = 2;
    ctx.stroke();

    const bulbCount = Math.max(4, Math.floor(distance / 32));
    for (let i = 1; i < bulbCount; i++) {
      const t = i / bulbCount;
      const bx = (1 - t) * (1 - t) * this.p1.x + 2 * (1 - t) * t * midX + t * t * this.p2.x;
      const by = (1 - t) * (1 - t) * this.p1.y + 2 * (1 - t) * t * midY + t * t * this.p2.y;

      const color = this.bulbColors[i % this.bulbColors.length];
      const intensity = 0.5 + 0.5 * Math.sin(this.animTimer * 2 + i * 1.3);

      this.drawBulb(ctx, bx, by, color, intensity);
    }

    this.drawHandle(ctx, this.p1, this.isDraggingP1);
    this.drawHandle(ctx, this.p2, this.isDraggingP2);

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
    ctx.fillRect(x - 2, y - 2, 4, 3);

    const glowRadius = 8 + intensity * 8;
    const glow = ctx.createRadialGradient(x, y + 5, 1, x, y + 5, glowRadius);
    glow.addColorStop(0, color);
    glow.addColorStop(0.5, color);
    glow.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y + 5, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(x, y + 5, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }

  private drawHandle(ctx: CanvasRenderingContext2D, handle: LightHandle, isActive: boolean): void {
    ctx.beginPath();
    ctx.arc(handle.x, handle.y, handle.radius, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? "#4fc3f7" : "rgba(255, 255, 255, 0.7)";
    ctx.strokeStyle = "#263238";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  }
}

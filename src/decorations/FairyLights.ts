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
  public isHovered = false;
  private bulbColors = ["#ff5252", "#ffd740", "#69f0ae", "#40c4ff", "#e040fb", "#ff6e40"];
  private animTimer = 0;

  constructor(x1: number, y1: number, x2: number, y2: number) {
    this.p1 = { x: x1, y: y1, radius: 4 };
    this.p2 = { x: x2, y: y2, radius: 4 };
  }

  public update(): void {
    this.animTimer += 0.04;
  }

  public resize(newWidth: number): void {
    this.p1.x = 0;
    this.p1.y = 2;
    this.p2.x = newWidth;
    this.p2.y = 2;
  }

  public hitTest(px: number, py: number): "p1" | "p2" | null {
    const d1 = Math.hypot(px - this.p1.x, py - this.p1.y);
    if (d1 <= this.p1.radius + 8) return "p1";

    const d2 = Math.hypot(px - this.p2.x, py - this.p2.y);
    if (d2 <= this.p2.radius + 8) return "p2";

    return null;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    const totalDistance = Math.hypot(dx, dy);
    if (totalDistance < 20) return;

    const scallopSpan = 110;
    const scallopCount = Math.max(1, Math.round(totalDistance / scallopSpan));
    const sagHeight = 7;

    ctx.save();
    let bulbIndex = 0;

    for (let s = 0; s < scallopCount; s++) {
      const tStart = s / scallopCount;
      const tEnd = (s + 1) / scallopCount;

      const sx1 = this.p1.x + dx * tStart;
      const sy1 = this.p1.y + dy * tStart;
      const sx2 = this.p1.x + dx * tEnd;
      const sy2 = this.p1.y + dy * tEnd;

      const midX = (sx1 + sx2) / 2;
      const midY = (sy1 + sy2) / 2 + sagHeight;

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

        const color = this.bulbColors[bulbIndex % this.bulbColors.length];
        const intensity = 0.5 + 0.5 * Math.sin(this.animTimer * 2.5 + bulbIndex * 1.2);

        this.drawBulb(ctx, bx, by, color, intensity);
        bulbIndex++;
      }
    }

    if (this.isHovered || this.isDraggingP1 || this.isDraggingP2) {
      this.drawHandle(ctx, this.p1, this.isDraggingP1);
      this.drawHandle(ctx, this.p2, this.isDraggingP2);
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

    const glowRadius = 5 + intensity * 5;
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

  private drawHandle(ctx: CanvasRenderingContext2D, handle: LightHandle, isActive: boolean): void {
    ctx.beginPath();
    ctx.arc(handle.x, handle.y, handle.radius, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? "#4fc3f7" : "rgba(255, 255, 255, 0.85)";
    ctx.strokeStyle = "#37474f";
    ctx.lineWidth = 1.2;
    ctx.fill();
    ctx.stroke();
  }
}

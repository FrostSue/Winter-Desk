export type OrnamentType = "red-bauble" | "gold-bauble" | "wreath" | "stocking" | "tree";

export class Ornament {
  public x: number;
  public y: number;
  public type: OrnamentType;
  public isDragging = false;
  public swingAngle = 0;
  public swingVelocity = 0;
  private width = 48;
  private height = 56;

  constructor(x: number, y: number, type: OrnamentType) {
    this.x = x;
    this.y = y;
    this.type = type;
  }

  public update(): void {
    if (!this.isDragging) {
      const spring = -0.05 * this.swingAngle;
      this.swingVelocity += spring;
      this.swingVelocity *= 0.94;
      this.swingAngle += this.swingVelocity;
    } else {
      this.swingAngle = 0;
      this.swingVelocity = 0;
    }
  }

  public impulse(force: number): void {
    this.swingVelocity += force;
  }

  public containsPoint(px: number, py: number): boolean {
    const left = this.x - this.width / 2;
    const top = this.y;
    return px >= left && px <= left + this.width && py >= top && py <= top + this.height;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.swingAngle);

    if (this.type === "red-bauble" || this.type === "gold-bauble") {
      this.drawBauble(ctx, this.type === "red-bauble" ? "#d32f2f" : "#fbc02d");
    } else if (this.type === "wreath") {
      this.drawWreath(ctx);
    } else if (this.type === "stocking") {
      this.drawStocking(ctx);
    } else if (this.type === "tree") {
      this.drawTree(ctx);
    }

    ctx.restore();
  }

  private drawBauble(ctx: CanvasRenderingContext2D, baseColor: string): void {
    ctx.strokeStyle = "#90a4ae";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 14);
    ctx.stroke();

    ctx.fillStyle = "#cfd8dc";
    ctx.fillRect(-3, 14, 6, 4);

    const radius = 16;
    const centerY = 34;

    const grad = ctx.createRadialGradient(-4, centerY - 4, 2, 0, centerY, radius);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.3, baseColor);
    grad.addColorStop(1, "#1a0000");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.arc(-5, centerY - 6, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawWreath(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "#c62828";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 10);
    ctx.stroke();

    const radius = 18;
    const centerY = 30;

    ctx.lineWidth = 9;
    ctx.strokeStyle = "#2e7d32";
    ctx.beginPath();
    ctx.arc(0, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 7;
    ctx.strokeStyle = "#388e3c";
    ctx.stroke();

    ctx.fillStyle = "#c62828";
    const berries = [0, 0.7, 1.4, 2.1, 2.8, 3.5, 4.2, 4.9, 5.6];
    for (const b of berries) {
      const bx = Math.cos(b) * radius;
      const by = centerY + Math.sin(b) * radius;
      ctx.beginPath();
      ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(0, centerY - radius, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawStocking(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "#90a4ae";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 10);
    ctx.stroke();

    ctx.fillStyle = "#c62828";
    ctx.beginPath();
    ctx.moveTo(-8, 16);
    ctx.lineTo(8, 16);
    ctx.lineTo(8, 38);
    ctx.quadraticCurveTo(10, 48, 18, 48);
    ctx.quadraticCurveTo(22, 54, 16, 56);
    ctx.quadraticCurveTo(2, 58, -8, 48);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(-10, 10, 20, 8, 3);
    ctx.fill();
  }

  private drawTree(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#5d4037";
    ctx.fillRect(-4, 50, 8, 12);

    ctx.fillStyle = "#1b5e20";
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(16, 26);
    ctx.lineTo(8, 26);
    ctx.lineTo(22, 42);
    ctx.lineTo(12, 42);
    ctx.lineTo(28, 56);
    ctx.lineTo(-28, 56);
    ctx.lineTo(-12, 42);
    ctx.lineTo(-22, 42);
    ctx.lineTo(-8, 26);
    ctx.lineTo(-16, 26);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fdd835";
    ctx.beginPath();
    ctx.arc(0, 6, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

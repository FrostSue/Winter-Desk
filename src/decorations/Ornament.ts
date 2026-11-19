import type { OrnamentType } from "../types";

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

    if (
      this.type === "red-bauble" ||
      this.type === "gold-bauble" ||
      this.type === "blue-bauble" ||
      this.type === "purple-bauble"
    ) {
      const color =
        this.type === "red-bauble"
          ? "#d32f2f"
          : this.type === "gold-bauble"
          ? "#fbc02d"
          : this.type === "blue-bauble"
          ? "#1976d2"
          : "#7b1fa2";
      this.drawBauble(ctx, color);
    } else if (this.type === "wreath") {
      this.drawWreath(ctx);
    } else if (this.type === "stocking") {
      this.drawStocking(ctx);
    } else if (this.type === "tree") {
      this.drawTree(ctx);
    } else if (this.type === "candy-cane") {
      this.drawCandyCane(ctx);
    } else if (this.type === "gingerbread") {
      this.drawGingerbread(ctx);
    } else if (this.type === "bells") {
      this.drawBells(ctx);
    } else if (this.type === "ribbon") {
      this.drawRibbon(ctx);
    } else if (this.type === "star") {
      this.drawStar(ctx);
    } else if (this.type === "candle") {
      this.drawCandle(ctx);
    } else if (this.type === "snowflake-decor") {
      this.drawSnowflakeDecor(ctx);
    } else if (this.type === "gift-box") {
      this.drawGiftBox(ctx);
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

  private drawCandyCane(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "#d32f2f";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(8, 14);
    ctx.arc(0, 14, 8, 0, Math.PI, true);
    ctx.lineTo(-8, 48);
    ctx.stroke();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.strokeStyle = "#d32f2f";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  private drawGingerbread(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#8d6e63";
    ctx.beginPath();
    ctx.arc(0, 16, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(-8, 24, 16, 20, 4);
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(-18, 26, 36, 6, 3);
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(-8, 42, 6, 14, 3);
    ctx.roundRect(2, 42, 6, 14, 3);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-3, 14, 1.5, 0, Math.PI * 2);
    ctx.arc(3, 14, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e53935";
    ctx.beginPath();
    ctx.arc(0, 29, 2, 0, Math.PI * 2);
    ctx.arc(0, 36, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBells(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "#c62828";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 12);
    ctx.stroke();

    ctx.fillStyle = "#ffd54f";
    ctx.beginPath();
    ctx.moveTo(-12, 18);
    ctx.quadraticCurveTo(-16, 36, -20, 42);
    ctx.lineTo(-4, 42);
    ctx.quadraticCurveTo(-8, 36, -6, 18);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fbc02d";
    ctx.beginPath();
    ctx.moveTo(6, 18);
    ctx.quadraticCurveTo(8, 36, 4, 42);
    ctx.lineTo(20, 42);
    ctx.quadraticCurveTo(16, 36, 12, 18);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#c62828";
    ctx.beginPath();
    ctx.ellipse(0, 16, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawRibbon(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#d32f2f";
    ctx.beginPath();
    ctx.ellipse(-10, 18, 12, 7, -0.3, 0, Math.PI * 2);
    ctx.ellipse(10, 18, 12, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#b71c1c";
    ctx.beginPath();
    ctx.arc(0, 18, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#d32f2f";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-3, 22);
    ctx.lineTo(-12, 44);
    ctx.moveTo(3, 22);
    ctx.lineTo(12, 44);
    ctx.stroke();
  }

  private drawStar(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "#ffe082";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 12);
    ctx.stroke();

    ctx.fillStyle = "#fbc02d";
    ctx.beginPath();
    const spikes = 5;
    const outer = 18;
    const inner = 8;
    const centerY = 30;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const x = Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.shadowColor = "rgba(255, 215, 0, 0.7)";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawCandle(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#fff8e1";
    ctx.beginPath();
    ctx.roundRect(-6, 16, 12, 28, 2);
    ctx.fill();

    ctx.strokeStyle = "#424242";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(0, 12);
    ctx.stroke();

    ctx.fillStyle = "#ff9800";
    ctx.shadowColor = "rgba(255, 152, 0, 0.8)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.quadraticCurveTo(4, 9, 0, 12);
    ctx.quadraticCurveTo(-4, 9, 0, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawSnowflakeDecor(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "rgba(224, 247, 250, 0.95)";
    ctx.lineWidth = 2;
    const centerY = 30;
    const len = 14;

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = Math.cos(angle) * len;
      const y = centerY + Math.sin(angle) * len;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      const branchAngle1 = angle + 0.5;
      const branchAngle2 = angle - 0.5;
      const bx = Math.cos(angle) * (len * 0.6);
      const by = centerY + Math.sin(angle) * (len * 0.6);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(branchAngle1) * 5, by + Math.sin(branchAngle1) * 5);
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(branchAngle2) * 5, by + Math.sin(branchAngle2) * 5);
      ctx.stroke();
    }
  }

  private drawGiftBox(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#1e88e5";
    ctx.beginPath();
    ctx.roundRect(-14, 18, 28, 26, 4);
    ctx.fill();

    ctx.fillStyle = "#ffd54f";
    ctx.fillRect(-3, 18, 6, 26);
    ctx.fillRect(-14, 28, 28, 6);

    ctx.beginPath();
    ctx.ellipse(-5, 15, 6, 3, -0.4, 0, Math.PI * 2);
    ctx.ellipse(5, 15, 6, 3, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

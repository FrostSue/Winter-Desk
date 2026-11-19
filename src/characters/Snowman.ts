import type { SnowmanConfig, TaskbarBounds } from "../types";

export class Snowman {
  public x: number;
  public y: number;
  public scale: number;
  public isSpawned = false;
  public isDragging = false;
  public hasCustomPosition = false;
  public isRemovable = false;
  public isRidingTrain = false;
  public id: string = Math.random().toString(36).slice(2);
  public spawnProgress = 0;
  public isWaving = false;
  public waveAngle = 0;
  public idleTimer = 0;
  public config: SnowmanConfig = {
    hat: "top-hat",
    face: "smile",
    clothes: "red-scarf",
    accessory: "broom"
  };

  private targetX: number;
  private currentRollX: number;

  constructor(targetX: number, taskbar: TaskbarBounds) {
    this.targetX = targetX;
    this.currentRollX = -60;
    this.y = taskbar.y;
    this.x = targetX;
    this.scale = 1.0;
  }

  public update(taskbar: TaskbarBounds): void {
    if (!this.hasCustomPosition && !this.isDragging && !this.isRidingTrain) {
      this.y = taskbar.y;
    }
    this.idleTimer += 0.05;

    if (!this.isSpawned) {
      this.currentRollX += 3.5;
      this.x = this.currentRollX;
      this.spawnProgress = Math.min(1.0, this.currentRollX / this.targetX);

      if (this.currentRollX >= this.targetX) {
        this.x = this.targetX;
        this.isSpawned = true;
      }
      return;
    }

    if (this.isWaving || this.isRidingTrain) {
      this.waveAngle = Math.sin(this.idleTimer * 4.5) * 0.5;
    } else {
      this.waveAngle = 0;
    }
  }

  public setPosition(newX: number, newY: number): void {
    this.x = newX;
    this.y = newY;
    this.hasCustomPosition = true;
  }

  public setWaving(waving: boolean): void {
    this.isWaving = waving;
  }

  public containsPoint(px: number, py: number): boolean {
    const width = 80 * this.scale;
    const height = 105 * this.scale;
    const left = this.x - width / 2;
    const top = this.y - height;
    return px >= left && px <= left + width && py >= top && py <= this.y + 10;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    if (!this.isSpawned) {
      this.drawRollingSnowball(ctx);
      ctx.restore();
      return;
    }

    const breathe = Math.sin(this.idleTimer) * 1.2;

    this.drawBody(ctx, breathe);
    this.drawArms(ctx);
    this.drawHead(ctx, breathe);
    this.drawFace(ctx, breathe);
    this.drawClothes(ctx, breathe);
    this.drawHat(ctx, breathe);
    this.drawAccessory(ctx);

    ctx.restore();
  }

  private drawRollingSnowball(ctx: CanvasRenderingContext2D): void {
    const radius = 12 + this.spawnProgress * 14;
    ctx.save();
    ctx.translate(0, -radius);
    ctx.rotate((this.currentRollX / 10) % (Math.PI * 2));

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(180, 210, 240, 0.6)";
    ctx.shadowBlur = 6;
    ctx.fill();

    ctx.fillStyle = "rgba(200, 225, 255, 0.4)";
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.2, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawBody(ctx: CanvasRenderingContext2D, breathe: number): void {
    ctx.shadowColor = "rgba(180, 210, 240, 0.4)";
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.arc(0, -22, 22, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -50 + breathe * 0.3, 17, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#333333";
    ctx.beginPath();
    ctx.arc(0, -45 + breathe * 0.3, 2, 0, Math.PI * 2);
    ctx.arc(0, -53 + breathe * 0.3, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawHead(ctx: CanvasRenderingContext2D, breathe: number): void {
    ctx.beginPath();
    ctx.arc(0, -74 + breathe, 13, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(180, 210, 240, 0.4)";
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawFace(ctx: CanvasRenderingContext2D, breathe: number): void {
    const headY = -74 + breathe;

    ctx.fillStyle = "#222222";
    if (this.config.face === "wink") {
      ctx.beginPath();
      ctx.arc(-4, headY - 2, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(4, headY - 2, 2.5, Math.PI * 0.2, Math.PI * 0.8);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "#222222";
      ctx.stroke();
    } else if (this.config.face === "sunglasses") {
      ctx.fillStyle = "#111111";
      ctx.beginPath();
      ctx.roundRect(-8, headY - 4, 6, 5, 1.5);
      ctx.roundRect(2, headY - 4, 6, 5, 1.5);
      ctx.fill();
      ctx.fillRect(-2, headY - 2, 4, 1.5);
    } else {
      ctx.beginPath();
      ctx.arc(-4, headY - 2, 1.8, 0, Math.PI * 2);
      ctx.arc(4, headY - 2, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(0, headY);
    ctx.lineTo(8, headY + 1.5);
    ctx.lineTo(0, headY + 3);
    ctx.closePath();
    ctx.fillStyle = "#ff6f00";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, headY + 3.5, 3.5, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "#444444";
    ctx.stroke();
  }

  private drawArms(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "#6d4c41";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";

    ctx.save();
    ctx.translate(-15, -50);
    ctx.rotate(0.3 + this.waveAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-18, -10);
    ctx.lineTo(-24, -14);
    ctx.moveTo(-18, -10);
    ctx.lineTo(-20, -6);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(15, -50);
    ctx.lineTo(32, -44);
    ctx.lineTo(38, -48);
    ctx.moveTo(32, -44);
    ctx.lineTo(35, -40);
    ctx.stroke();
  }

  private drawClothes(ctx: CanvasRenderingContext2D, breathe: number): void {
    const neckY = -62 + breathe;

    if (this.config.clothes === "red-scarf") {
      ctx.fillStyle = "#e53935";
      ctx.beginPath();
      ctx.ellipse(0, neckY, 13, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.rect(3, neckY, 6, 18);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(3, neckY + 14, 6, 2.5);
    } else if (this.config.clothes === "bow-tie") {
      ctx.fillStyle = "#1e88e5";
      ctx.beginPath();
      ctx.moveTo(-7, neckY - 4);
      ctx.lineTo(0, neckY);
      ctx.lineTo(-7, neckY + 4);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(7, neckY - 4);
      ctx.lineTo(0, neckY);
      ctx.lineTo(7, neckY + 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#0d47a1";
      ctx.beginPath();
      ctx.arc(0, neckY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawHat(ctx: CanvasRenderingContext2D, breathe: number): void {
    const headY = -74 + breathe;

    if (this.config.hat === "top-hat") {
      ctx.fillStyle = "#263238";
      ctx.beginPath();
      ctx.ellipse(0, headY - 12, 17, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillRect(-10, headY - 30, 20, 18);

      ctx.fillStyle = "#c62828";
      ctx.fillRect(-10, headY - 16, 20, 4);
    } else if (this.config.hat === "santa-hat") {
      ctx.fillStyle = "#d32f2f";
      ctx.beginPath();
      ctx.moveTo(-12, headY - 11);
      ctx.quadraticCurveTo(0, headY - 32, 18, headY - 26);
      ctx.lineTo(10, headY - 11);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(-13, headY - 13, 26, 6, 3);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(19, headY - 26, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawAccessory(ctx: CanvasRenderingContext2D): void {
    if (this.config.accessory === "broom") {
      ctx.strokeStyle = "#8d6e63";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(28, -75);
      ctx.lineTo(34, 0);
      ctx.stroke();

      ctx.fillStyle = "#fbc02d";
      ctx.beginPath();
      ctx.moveTo(25, -75);
      ctx.lineTo(31, -75);
      ctx.lineTo(36, -92);
      ctx.lineTo(20, -92);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#d32f2f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(23, -80);
      ctx.lineTo(33, -80);
      ctx.stroke();
    } else if (this.config.accessory === "candy-cane") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(28, -25);
      ctx.lineTo(28, -55);
      ctx.arc(33, -55, 5, Math.PI, 0, false);
      ctx.stroke();

      ctx.strokeStyle = "#d32f2f";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
}

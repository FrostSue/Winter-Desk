import type { TaskbarBounds, WindowBounds } from "../types";

export class CompanionBuddy {
  public x: number;
  public y: number;
  public vx = 0;
  public isDragging = false;
  public isRidingTrain = false;
  public isWaving = false;
  public isShoveling = false;
  public facing: "left" | "right" = "right";
  private animTimer = 0;
  private idleActionTimer = 0;
  private width = 42;
  private height = 52;

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public containsPoint(px: number, py: number): boolean {
    const left = this.x - this.width / 2 - 8;
    const right = this.x + this.width / 2 + 8;
    const top = this.y - this.height - 8;
    const bottom = this.y + 10;
    return px >= left && px <= right && py >= top && py <= bottom;
  }

  public update(taskbar: TaskbarBounds, _windows: WindowBounds[]): void {
    this.animTimer += 0.08;

    if (this.isDragging || this.isRidingTrain) {
      return;
    }

    this.idleActionTimer++;
    if (this.idleActionTimer > 200) {
      this.idleActionTimer = 0;
      if (Math.random() > 0.4) {
        this.vx = (Math.random() - 0.5) * 1.6;
        this.facing = this.vx >= 0 ? "right" : "left";
      } else {
        this.vx = 0;
      }
    }

    this.x += this.vx;

    const minX = 40;
    const maxX = window.innerWidth - 40;
    if (this.x < minX) {
      this.x = minX;
      this.vx = Math.abs(this.vx);
      this.facing = "right";
    } else if (this.x > maxX) {
      this.x = maxX;
      this.vx = -Math.abs(this.vx);
      this.facing = "left";
    }

    if (this.y < taskbar.y - 120) {
      this.y += 1.5;
    } else {
      this.y = taskbar.y;
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.facing === "left") {
      ctx.scale(-1, 1);
    }

    const waddle = Math.abs(this.vx) > 0.1 ? Math.sin(this.animTimer * 2) * 0.15 : 0;
    ctx.rotate(waddle);

    const footWobble = Math.sin(this.animTimer * 2) * 3;
    ctx.fillStyle = "#ffb300";
    ctx.beginPath();
    ctx.ellipse(-8, 2 + (this.vx !== 0 ? footWobble : 0), 7, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(8, 2 - (this.vx !== 0 ? footWobble : 0), 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#263238";
    ctx.beginPath();
    ctx.ellipse(0, -22, 16, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(3, -20, 10, 16, 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff3d00";
    ctx.beginPath();
    ctx.roundRect(-12, -26, 24, 7, 3);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-6, -26, 4, 7);
    ctx.fillRect(4, -26, 4, 7);

    ctx.fillStyle = "#ff3d00";
    ctx.beginPath();
    ctx.moveTo(8, -22);
    ctx.lineTo(16, -14);
    ctx.lineTo(13, -12);
    ctx.lineTo(6, -20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(6, -34, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#212121";
    ctx.beginPath();
    ctx.arc(7.5, -34, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffb300";
    ctx.beginPath();
    ctx.moveTo(11, -33);
    ctx.lineTo(19, -30);
    ctx.lineTo(11, -27);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ff8a80";
    ctx.beginPath();
    ctx.arc(3, -29, 2.5, 0, Math.PI * 2);
    ctx.fill();

    const wingAngle = this.isWaving || this.isRidingTrain ? Math.sin(this.animTimer * 4) * 0.5 : 0;
    ctx.save();
    ctx.translate(-12, -20);
    ctx.rotate(-0.2 + wingAngle);
    ctx.fillStyle = "#1e272c";
    ctx.beginPath();
    ctx.ellipse(0, 8, 4, 10, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (this.isShoveling) {
      ctx.strokeStyle = "#8d6e63";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(10, -18);
      ctx.lineTo(24, -4);
      ctx.stroke();

      ctx.fillStyle = "#b0bec5";
      ctx.beginPath();
      ctx.roundRect(22, -6, 12, 10, 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(26, -7, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

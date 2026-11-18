import { Snowman } from "./Snowman";
import type { TaskbarBounds } from "../types";

export interface RollingBall {
  x: number;
  y: number;
  radius: number;
  targetRadius: number;
  rotation: number;
  isDragging: boolean;
}

export class SnowballBuilder {
  public activeBall: RollingBall | null = null;
  public stackedBalls: RollingBall[] = [];
  public isBuilding = false;
  private taskbar: TaskbarBounds;
  public onSnowmanCreated?: (snowman: Snowman) => void;

  constructor(taskbar: TaskbarBounds) {
    this.taskbar = taskbar;
  }

  public setTaskbar(taskbar: TaskbarBounds): void {
    this.taskbar = taskbar;
  }

  public startAt(x: number, y: number): void {
    this.isBuilding = true;
    this.activeBall = {
      x,
      y: Math.min(y, this.taskbar.y - 8),
      radius: 8,
      targetRadius: this.stackedBalls.length === 0 ? 22 : this.stackedBalls.length === 1 ? 16 : 12,
      rotation: 0,
      isDragging: true
    };
  }

  public handleMouseMove(x: number, y: number): boolean {
    if (!this.activeBall || !this.activeBall.isDragging) return false;

    const dx = x - this.activeBall.x;
    this.activeBall.rotation += dx * 0.08;
    this.activeBall.x = x;
    this.activeBall.y = Math.min(y, this.taskbar.y - this.activeBall.radius);

    if (Math.abs(dx) > 1 && this.activeBall.radius < this.activeBall.targetRadius) {
      this.activeBall.radius = Math.min(
        this.activeBall.targetRadius,
        this.activeBall.radius + Math.abs(dx) * 0.04
      );
    }
    return true;
  }

  public handleMouseUp(): void {
    if (!this.activeBall) return;
    this.activeBall.isDragging = false;

    if (this.activeBall.radius >= this.activeBall.targetRadius * 0.85) {
      this.stackedBalls.push(this.activeBall);

      if (this.stackedBalls.length >= 3) {
        const base = this.stackedBalls[0];
        const newSnowman = new Snowman(base.x, this.taskbar);
        newSnowman.setPosition(base.x, this.taskbar.y);
        newSnowman.isSpawned = true;

        if (this.onSnowmanCreated) {
          this.onSnowmanCreated(newSnowman);
        }
        this.reset();
      } else {
        const nextTarget = this.stackedBalls.length === 1 ? 16 : 12;
        const topOfStack = this.stackedBalls[this.stackedBalls.length - 1];
        this.activeBall = {
          x: topOfStack.x + (Math.random() * 80 - 40),
          y: this.taskbar.y - 8,
          radius: 6,
          targetRadius: nextTarget,
          rotation: 0,
          isDragging: false
        };
      }
    } else {
      this.reset();
    }
  }

  public reset(): void {
    this.activeBall = null;
    this.stackedBalls = [];
    this.isBuilding = false;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isBuilding) return;

    for (const ball of this.stackedBalls) {
      this.renderBall(ctx, ball);
    }

    if (this.activeBall) {
      this.renderBall(ctx, this.activeBall);

      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.beginPath();
      ctx.roundRect(this.activeBall.x - 70, this.activeBall.y - this.activeBall.radius - 32, 140, 24, 6);
      ctx.fill();

      ctx.fillStyle = "#263238";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      const hint =
        this.stackedBalls.length === 0
          ? "Roll across snow to grow base!"
          : this.stackedBalls.length === 1
          ? "Roll middle snowball!"
          : "Roll the head snowball!";
      ctx.fillText(hint, this.activeBall.x, this.activeBall.y - this.activeBall.radius - 16);
      ctx.restore();
    }
  }

  private renderBall(ctx: CanvasRenderingContext2D, ball: RollingBall): void {
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.rotation);

    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(180, 210, 240, 0.6)";
    ctx.shadowBlur = 6;
    ctx.fill();

    ctx.fillStyle = "rgba(200, 225, 255, 0.4)";
    ctx.beginPath();
    ctx.arc(-ball.radius * 0.3, -ball.radius * 0.2, ball.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

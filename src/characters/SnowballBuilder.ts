import { Snowman } from "./Snowman";
import type { SnowAccumulator } from "../snow/Accumulator";
import type { TaskbarBounds } from "../types";

export interface RollingBall {
  id: string;
  x: number;
  y: number;
  radius: number;
  targetRadius: number;
  rotation: number;
  tier: 1 | 2 | 3;
}

export class SnowballBuilder {
  public activeBall: RollingBall | null = null;
  public restingBalls: RollingBall[] = [];
  public isBuilding = false;
  private accumulator: SnowAccumulator;
  private taskbar: TaskbarBounds;
  public onSnowmanCreated?: (snowman: Snowman) => void;

  constructor(accumulator: SnowAccumulator, taskbar: TaskbarBounds) {
    this.accumulator = accumulator;
    this.taskbar = taskbar;
  }

  public setTaskbar(taskbar: TaskbarBounds): void {
    this.taskbar = taskbar;
  }

  public canStartAt(x: number, y: number): boolean {
    if (this.containsBall(x, y)) return true;
    if (this.taskbar && y >= this.taskbar.y - 25 && y <= this.taskbar.y + 10) {
      return this.accumulator.getSnowHeight(x) >= 2.0;
    }
    return false;
  }

  public startAt(x: number, y: number): boolean {
    const clickedExisting = this.findRestingBallAt(x, y);
    if (clickedExisting) {
      this.activeBall = clickedExisting;
      this.restingBalls = this.restingBalls.filter((b) => b.id !== clickedExisting.id);
      this.isBuilding = true;
      return true;
    }

    if (this.accumulator.getSnowHeight(x) < 2.0) {
      return false;
    }

    this.isBuilding = true;
    this.activeBall = {
      id: Math.random().toString(36).slice(2),
      x,
      y,
      radius: 8,
      targetRadius: 22,
      rotation: 0,
      tier: 1
    };
    this.accumulator.clearRange(x - 12, x + 12, 1.2);
    return true;
  }

  public findRestingBallAt(px: number, py: number): RollingBall | null {
    for (let i = this.restingBalls.length - 1; i >= 0; i--) {
      const b = this.restingBalls[i];
      if (Math.hypot(px - b.x, py - b.y) <= b.radius + 6) {
        return b;
      }
    }
    return null;
  }

  public containsBall(px: number, py: number): boolean {
    if (this.activeBall && Math.hypot(px - this.activeBall.x, py - this.activeBall.y) <= this.activeBall.radius + 8) {
      return true;
    }
    return this.findRestingBallAt(px, py) !== null;
  }

  public handleMouseMove(x: number, y: number): boolean {
    if (!this.activeBall) return false;

    const dx = x - this.activeBall.x;
    const dy = y - this.activeBall.y;
    const dist = Math.hypot(dx, dy);

    this.activeBall.rotation += dx * 0.1;
    this.activeBall.x = x;
    this.activeBall.y = y;

    if (dist > 1 && this.activeBall.radius < this.activeBall.targetRadius) {
      const availableSnow = this.accumulator.getSnowHeight(x);
      if (availableSnow >= 0.8) {
        this.accumulator.clearRange(x - 14, x + 14, 0.25);
        this.activeBall.radius = Math.min(
          this.activeBall.targetRadius,
          this.activeBall.radius + dist * 0.05
        );
      }
    }
    return true;
  }

  public handleMouseUp(): void {
    if (!this.activeBall) {
      this.isBuilding = false;
      return;
    }

    const current = this.activeBall;
    this.activeBall = null;
    this.isBuilding = false;

    let targetStackBase: RollingBall | null = null;
    let targetStackMid: RollingBall | null = null;

    for (const other of this.restingBalls) {
      const dist = Math.hypot(current.x - other.x, current.y - other.y);
      if (dist < (current.radius + other.radius) * 1.35) {
        if (other.tier === 1) {
          targetStackBase = other;
        } else if (other.tier === 2) {
          targetStackMid = other;
        }
      }
    }

    if (targetStackMid) {
      const snowman = new Snowman(targetStackMid.x, this.taskbar);
      snowman.setPosition(targetStackMid.x, targetStackMid.y + 20);
      snowman.isSpawned = true;
      snowman.isRemovable = true;

      this.restingBalls = this.restingBalls.filter(
        (b) => b.id !== targetStackMid!.id && Math.hypot(b.x - targetStackMid!.x, b.y - targetStackMid!.y) > 40
      );

      if (this.onSnowmanCreated) {
        this.onSnowmanCreated(snowman);
      }
      return;
    }

    if (targetStackBase) {
      current.x = targetStackBase.x;
      current.y = targetStackBase.y - targetStackBase.radius - current.radius + 4;
      current.tier = 2;
      current.targetRadius = 16;
      this.restingBalls.push(current);
      return;
    }

    current.tier = 1;
    this.restingBalls.push(current);
  }

  public reset(): void {
    this.activeBall = null;
    this.restingBalls = [];
    this.isBuilding = false;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    for (const ball of this.restingBalls) {
      this.renderBall(ctx, ball);
    }

    if (this.activeBall) {
      this.renderBall(ctx, this.activeBall);

      ctx.save();
      ctx.fillStyle = "rgba(20, 26, 38, 0.92)";
      ctx.beginPath();
      ctx.roundRect(this.activeBall.x - 90, this.activeBall.y - this.activeBall.radius - 36, 180, 26, 8);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      const progress = Math.round((this.activeBall.radius / this.activeBall.targetRadius) * 100);
      const hint =
        progress < 90
          ? `Roll snowball (${progress}%)`
          : "Stack on another ball or place anywhere!";
      ctx.fillText(hint, this.activeBall.x, this.activeBall.y - this.activeBall.radius - 19);
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

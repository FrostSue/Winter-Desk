import { Snowflake } from "./Particle";
import { SnowAccumulator } from "./Accumulator";
import type { SnowConfig, TaskbarBounds, WindowBounds } from "../types";

export class SnowEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private flakes: Snowflake[] = [];
  private accumulator: SnowAccumulator;
  private taskbar: TaskbarBounds | null = null;
  private openWindows: WindowBounds[] = [];
  private config: SnowConfig = {
    intensity: "medium",
    flakeCount: 180,
    wind: 0.5,
    minSpeed: 1,
    maxSpeed: 3,
    accumulateOnTaskbar: true,
    accumulateOnWindows: true
  };
  private targetWind = 0.5;
  private isRunning = false;
  private animFrameId: number | null = null;
  private width = 0;
  private height = 0;
  public onRenderEntities?: (ctx: CanvasRenderingContext2D) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      throw new Error("Unable to obtain 2D canvas context");
    }
    this.ctx = context;
    this.accumulator = new SnowAccumulator(window.innerWidth);
    this.handleResize();
    window.addEventListener("resize", () => this.handleResize());
  }

  public setTaskbar(taskbar: TaskbarBounds): void {
    this.taskbar = taskbar;
  }

  public setOpenWindows(windows: WindowBounds[]): void {
    this.openWindows = windows;
  }

  public setConfig(config: SnowConfig): void {
    this.config = { ...config };
    this.targetWind = config.wind;
    this.adjustFlakeCount();
  }

  public getAccumulator(): SnowAccumulator {
    return this.accumulator;
  }

  public isNearSnow(px: number, py: number): boolean {
    if (this.taskbar && py >= this.taskbar.y - 30 && py <= this.taskbar.y + 12) {
      return true;
    }
    for (const win of this.openWindows) {
      if (
        px >= win.x &&
        px <= win.x + win.width &&
        py >= win.y - 24 &&
        py <= win.y + 12
      ) {
        return true;
      }
    }
    return false;
  }

  private handleResize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    this.accumulator.resize(this.width);
    this.adjustFlakeCount();
  }

  private adjustFlakeCount(): void {
    const targetCount = this.config.intensity === "off" ? 0 : this.config.flakeCount;
    while (this.flakes.length < targetCount) {
      this.flakes.push(new Snowflake(this.width, this.height, this.flakes.length > 0));
    }
    if (this.flakes.length > targetCount) {
      this.flakes.length = targetCount;
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.adjustFlakeCount();
    this.loop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return;
    this.update();
    this.render();
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(): void {
    this.config.wind += (this.targetWind - this.config.wind) * 0.05;

    const taskbarTop = this.taskbar ? this.taskbar.y : this.height - 48;
    const canAccumulate = this.config.accumulateOnTaskbar && this.config.intensity !== "off";

    for (let i = 0; i < this.flakes.length; i++) {
      const flake = this.flakes[i];
      flake.update(this.width, this.height, this.config.wind, 1.0);

      if (canAccumulate && flake.y >= taskbarTop - 4) {
        const snowDepth = this.accumulator.getSnowHeight(flake.x);
        if (flake.y >= taskbarTop - snowDepth) {
          this.accumulator.deposit(flake.x, flake.radius * 0.25);
          flake.reset(this.width);
          continue;
        }
      }

      if (this.config.accumulateOnWindows) {
        for (const win of this.openWindows) {
          if (
            flake.x >= win.x &&
            flake.x <= win.x + win.width &&
            flake.y >= win.y - 4 &&
            flake.y <= win.y + 4
          ) {
            flake.reset(this.width);
            break;
          }
        }
      }
    }

    if (canAccumulate) {
      this.accumulator.update();
    }
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.config.accumulateOnTaskbar && this.taskbar) {
      this.accumulator.draw(this.ctx, this.taskbar.y);
    }

    if (this.config.accumulateOnWindows && this.openWindows.length > 0) {
      this.drawWindowSnow(this.ctx);
    }

    this.ctx.save();
    for (let i = 0; i < this.flakes.length; i++) {
      const flake = this.flakes[i];
      this.ctx.beginPath();
      this.ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
      this.ctx.shadowColor = "rgba(220, 240, 255, 0.8)";
      this.ctx.shadowBlur = flake.radius > 2 ? 4 : 2;
      this.ctx.fill();
    }
    this.ctx.restore();

    if (this.onRenderEntities) {
      this.onRenderEntities(this.ctx);
    }
  }

  private drawWindowSnow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const win of this.openWindows) {
      const segWidth = 28;
      const count = Math.max(1, Math.floor(win.width / segWidth));

      ctx.beginPath();
      ctx.moveTo(win.x, win.y);

      for (let i = 0; i < count; i++) {
        const x1 = win.x + i * segWidth;
        const x2 = Math.min(win.x + win.width, x1 + segWidth);
        const midX = (x1 + x2) / 2;
        const h = 7 + Math.sin(i * 1.5) * 3;
        ctx.quadraticCurveTo(midX, win.y - h, x2, win.y);
      }

      ctx.closePath();

      const grad = ctx.createLinearGradient(0, win.y - 10, 0, win.y);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
      grad.addColorStop(0.6, "rgba(235, 245, 255, 0.92)");
      grad.addColorStop(1, "rgba(215, 235, 255, 0.88)");
      ctx.fillStyle = grad;
      ctx.shadowColor = "rgba(180, 215, 255, 0.5)";
      ctx.shadowBlur = 4;
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }
}

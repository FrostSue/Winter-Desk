import { Snowflake } from "./Particle";
import { SnowAccumulator } from "./Accumulator";
import type { SnowConfig, TaskbarBounds, WindowBounds } from "../types";

interface TumblingClump {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

export class SnowEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private flakes: Snowflake[] = [];
  private accumulator: SnowAccumulator;
  private taskbar: TaskbarBounds | null = null;
  private openWindows: WindowBounds[] = [];
  private windowSnowDepths: Map<string, number> = new Map();
  private tumblingClumps: TumblingClump[] = [];
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

  private getWindowKey(win: WindowBounds): string {
    return win.id !== undefined ? String(win.id) : `${win.x}_${win.y}_${win.width}`;
  }

  public setTaskbar(taskbar: TaskbarBounds): void {
    this.taskbar = taskbar;
  }

  public setOpenWindows(windows: WindowBounds[]): void {
    this.openWindows = windows;
    const activeKeys = new Set<string>();
    for (const win of windows) {
      const key = this.getWindowKey(win);
      activeKeys.add(key);
      if (!this.windowSnowDepths.has(key)) {
        this.windowSnowDepths.set(key, 2.5);
      }
    }
    for (const key of this.windowSnowDepths.keys()) {
      if (!activeKeys.has(key)) {
        this.windowSnowDepths.delete(key);
      }
    }
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
    if (this.taskbar && py >= this.taskbar.y - 25 && py <= this.taskbar.y + 10) {
      return this.accumulator.getSnowHeight(px) >= 2.0;
    }
    return false;
  }

  public shovelWindowSnowAt(px: number, py: number): boolean {
    for (let i = 0; i < this.openWindows.length; i++) {
      const win = this.openWindows[i];
      if (
        px >= win.x &&
        px <= win.x + win.width &&
        py >= win.y - 20 &&
        py <= win.y + 16
      ) {
        const key = this.getWindowKey(win);
        const currentDepth = this.windowSnowDepths.get(key) || 0;
        this.windowSnowDepths.set(key, Math.max(0, currentDepth - 2.5));

        for (let k = 0; k < 10; k++) {
          this.tumblingClumps.push({
            x: px + (Math.random() * 24 - 12),
            y: win.y - 2,
            vx: (Math.random() - 0.5) * 3 + this.config.wind * 1.5,
            vy: -1.5 - Math.random() * 2.5,
            radius: 3 + Math.random() * 3.5,
            alpha: 1.0
          });
        }
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
          this.accumulator.deposit(flake.x, flake.radius * 0.2);
          flake.reset(this.width);
          continue;
        }
      }

      if (this.config.accumulateOnWindows) {
        for (let w = 0; w < this.openWindows.length; w++) {
          const win = this.openWindows[w];
          if (
            flake.x >= win.x &&
            flake.x <= win.x + win.width &&
            flake.y >= win.y - 4 &&
            flake.y <= win.y + 4
          ) {
            if (Math.random() < 0.12) {
              const key = this.getWindowKey(win);
              const currentDepth = this.windowSnowDepths.get(key) || 0;
              this.windowSnowDepths.set(key, Math.min(8.0, currentDepth + 0.15));
            }
            flake.reset(this.width);
            break;
          }
        }
      }
    }

    if (this.config.accumulateOnWindows) {
      for (const [key, depth] of this.windowSnowDepths.entries()) {
        if (depth > 0) {
          this.windowSnowDepths.set(key, Math.max(0, depth - 0.001));
        }
      }
    }

    for (let k = this.tumblingClumps.length - 1; k >= 0; k--) {
      const clump = this.tumblingClumps[k];
      clump.x += clump.vx;
      clump.y += clump.vy;
      clump.vy += 0.25;

      let hitWindow = false;
      for (let w = 0; w < this.openWindows.length; w++) {
        const win = this.openWindows[w];
        if (
          clump.x >= win.x &&
          clump.x <= win.x + win.width &&
          clump.y >= win.y - 2 &&
          clump.y <= win.y + 8 &&
          clump.vy > 0
        ) {
          const key = this.getWindowKey(win);
          const currentDepth = this.windowSnowDepths.get(key) || 0;
          this.windowSnowDepths.set(key, Math.min(8.0, currentDepth + 0.6));
          this.tumblingClumps.splice(k, 1);
          hitWindow = true;
          break;
        }
      }

      if (!hitWindow && clump.y >= taskbarTop) {
        this.accumulator.deposit(clump.x, 0.8);
        this.tumblingClumps.splice(k, 1);
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
      this.ctx.fill();
    }

    for (const clump of this.tumblingClumps) {
      this.ctx.beginPath();
      this.ctx.arc(clump.x, clump.y, clump.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${clump.alpha})`;
      this.ctx.fill();
    }
    this.ctx.restore();

    if (this.onRenderEntities) {
      this.onRenderEntities(this.ctx);
    }
  }

  private drawWindowSnow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (let w = 0; w < this.openWindows.length; w++) {
      const win = this.openWindows[w];
      const key = this.getWindowKey(win);
      const depth = this.windowSnowDepths.get(key) || 0;
      if (depth < 0.3) continue;

      let segments: { start: number; end: number }[] = [{ start: win.x, end: win.x + win.width }];

      for (let v = 0; v < w; v++) {
        const topWin = this.openWindows[v];
        if (topWin.y <= win.y && topWin.y + topWin.height >= win.y) {
          const occStart = topWin.x;
          const occEnd = topWin.x + topWin.width;
          const nextSegments: { start: number; end: number }[] = [];

          for (const seg of segments) {
            if (occEnd <= seg.start || occStart >= seg.end) {
              nextSegments.push(seg);
            } else {
              if (occStart > seg.start) {
                nextSegments.push({ start: seg.start, end: occStart });
              }
              if (occEnd < seg.end) {
                nextSegments.push({ start: occEnd, end: seg.end });
              }
            }
          }
          segments = nextSegments;
          if (segments.length === 0) break;
        }
      }

      if (segments.length === 0) continue;

      const grad = ctx.createLinearGradient(0, win.y - depth, 0, win.y);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
      grad.addColorStop(0.6, "rgba(235, 245, 255, 0.92)");
      grad.addColorStop(1, "rgba(215, 235, 255, 0.88)");

      for (const seg of segments) {
        const segLen = seg.end - seg.start;
        if (segLen < 12) continue;

        const segWidth = 24;
        const count = Math.max(1, Math.floor(segLen / segWidth));
        const actualStep = segLen / count;

        ctx.beginPath();
        ctx.moveTo(seg.start, win.y);

        for (let i = 0; i < count; i++) {
          const x1 = seg.start + i * actualStep;
          const x2 = seg.start + (i + 1) * actualStep;
          const midX = (x1 + x2) / 2;
          const h = depth + Math.sin((x1 % 100) * 0.1) * (depth * 0.3);
          ctx.quadraticCurveTo(midX, win.y - h, x2, win.y);
        }

        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

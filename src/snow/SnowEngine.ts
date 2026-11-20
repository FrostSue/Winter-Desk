import { Snowflake } from "./Particle";
import { SnowAccumulator } from "./Accumulator";
import { WindowAccumulator } from "./WindowAccumulator";
import type { SnowConfig, TaskbarBounds, WindowBounds } from "../types";

interface TumblingClump {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  sourceWindowKey?: string;
}

export class SnowEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private flakes: Snowflake[] = [];
  private accumulator: SnowAccumulator;
  private taskbar: TaskbarBounds | null = null;
  private openWindows: WindowBounds[] = [];
  private windowAccumulators: Map<string, WindowAccumulator> = new Map();
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

  public triggerWindowAvalanche(win: WindowBounds, depth: number): void {
    const step = 9;
    const count = Math.max(12, Math.floor(win.width / step));
    for (let i = 0; i < count; i++) {
      const clumpX = win.x + i * step + (Math.random() * 8 - 4);
      const clumpY = win.y + (Math.random() * 6 - 3);
      this.tumblingClumps.push({
        x: clumpX,
        y: clumpY,
        vx: (Math.random() - 0.5) * 2.2 + this.config.wind * 0.35,
        vy: 2.0 + Math.random() * 3.0,
        radius: 2.4 + Math.random() * Math.min(4.2, depth * 0.65),
        alpha: 0.95,
        sourceWindowKey: this.getWindowKey(win)
      });
      if (Math.random() > 0.4) {
        this.tumblingClumps.push({
          x: clumpX + (Math.random() * 6 - 3),
          y: clumpY + (Math.random() * 4 - 2),
          vx: (Math.random() - 0.5) * 1.6,
          vy: 2.4 + Math.random() * 2.2,
          radius: 1.4 + Math.random() * 1.5,
          alpha: 0.85,
          sourceWindowKey: this.getWindowKey(win)
        });
      }
    }
  }

  public triggerRegionAvalanche(startX: number, endX: number, y: number, sourceKey: string, depth: number): void {
    const step = 9;
    const len = endX - startX;
    const count = Math.max(4, Math.floor(len / step));
    for (let i = 0; i < count; i++) {
      this.tumblingClumps.push({
        x: startX + i * step + (Math.random() * 6 - 3),
        y: y + (Math.random() * 4 - 2),
        vx: (Math.random() - 0.5) * 1.8,
        vy: 2.2 + Math.random() * 2.6,
        radius: 2.4 + Math.random() * Math.min(3.8, depth * 0.55),
        alpha: 0.95,
        sourceWindowKey: sourceKey
      });
    }
  }

  public setOpenWindows(windows: WindowBounds[]): void {
    if (this.openWindows.length > 0) {
      for (const oldWin of this.openWindows) {
        const oldKey = this.getWindowKey(oldWin);
        const acc = this.windowAccumulators.get(oldKey);
        const depth = acc ? acc.getAverageHeight() : 0;
        if (depth < 0.6) continue;

        const newWin = windows.find((w) => oldWin.id !== undefined && w.id === oldWin.id);
        if (!newWin) {
          this.triggerWindowAvalanche(oldWin, depth);
          continue;
        }

        const lostRight = oldWin.x + oldWin.width - (newWin.x + newWin.width);
        if (lostRight > 14) {
          const startX = newWin.x + newWin.width;
          const endX = oldWin.x + oldWin.width;
          this.triggerRegionAvalanche(startX, endX, oldWin.y, oldKey, depth);
        }

        const lostLeft = newWin.x - oldWin.x;
        if (lostLeft > 14) {
          const startX = oldWin.x;
          const endX = newWin.x;
          this.triggerRegionAvalanche(startX, endX, oldWin.y, oldKey, depth);
        }

        if (newWin.y > oldWin.y + 18) {
          this.triggerWindowAvalanche(oldWin, depth);
        }
      }
    }

    this.openWindows = windows;
    const activeKeys = new Set<string>();
    for (const win of windows) {
      const key = this.getWindowKey(win);
      activeKeys.add(key);
      const existing = this.windowAccumulators.get(key);
      if (!existing) {
        this.windowAccumulators.set(key, new WindowAccumulator(win.width));
      } else if (existing.width !== win.width) {
        existing.resize(win.width);
      }
    }
    for (const key of this.windowAccumulators.keys()) {
      if (!activeKeys.has(key)) {
        this.windowAccumulators.delete(key);
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

  public getNearestWindowAt(px: number, py: number): WindowBounds | null {
    for (let i = 0; i < this.openWindows.length; i++) {
      const win = this.openWindows[i];
      if (
        px >= win.x &&
        px <= win.x + win.width &&
        py >= win.y - 30 &&
        py <= win.y + 35
      ) {
        return win;
      }
    }
    return null;
  }

  public getWindowSnowAt(px: number, py: number): { window: WindowBounds; depth: number } | null {
    for (let w = 0; w < this.openWindows.length; w++) {
      const win = this.openWindows[w];
      const key = this.getWindowKey(win);
      const acc = this.windowAccumulators.get(key);
      if (!acc) continue;

      if (px >= win.x && px <= win.x + win.width) {
        const localX = px - win.x;
        const depth = acc.getHeight(localX);
        if (depth < 0.6) continue;

        if (py >= win.y - depth - 8 && py <= win.y + 14) {
          let isOccluded = false;
          for (let v = 0; v < w; v++) {
            const topWin = this.openWindows[v];
            if (
              px >= topWin.x &&
              px <= topWin.x + topWin.width &&
              py >= topWin.y &&
              py <= topWin.y + topWin.height
            ) {
              isOccluded = true;
              break;
            }
          }
          if (isOccluded) continue;

          return { window: win, depth };
        }
      }
    }
    return null;
  }

  public consumeWindowSnow(win: WindowBounds, atX?: number, amount = 1.8): number {
    const key = this.getWindowKey(win);
    const acc = this.windowAccumulators.get(key);
    if (!acc) return 0;
    const targetX = atX !== undefined ? atX : win.x + win.width / 2;
    const localX = targetX - win.x;
    acc.clearRange(localX - 22, localX + 22, amount);
    return acc.getHeight(localX);
  }

  public addWindowSnow(win: WindowBounds, atX?: number, amount = 0.4): number {
    const key = this.getWindowKey(win);
    const acc = this.windowAccumulators.get(key);
    if (!acc) return 0;
    const targetX = atX !== undefined ? atX : win.x + win.width / 2;
    const localX = targetX - win.x;
    acc.deposit(localX, amount);
    return acc.getHeight(localX);
  }

  public isNearSnow(px: number, py: number): boolean {
    if (this.taskbar && py >= this.taskbar.y - 25 && py <= this.taskbar.y - 2) {
      return this.accumulator.getSnowHeight(px) >= 2.5;
    }
    return this.getWindowSnowAt(px, py) !== null;
  }

  public flingWindowSnow(
    win: WindowBounds,
    startX: number,
    startY: number,
    baseVx?: number,
    baseVy?: number
  ): boolean {
    const key = this.getWindowKey(win);
    const acc = this.windowAccumulators.get(key);
    if (!acc) return false;

    const localX = startX - win.x;
    const depthAtPoint = acc.getHeight(localX);
    if (depthAtPoint < 1.0) {
      return false;
    }

    const scoopAmount = Math.min(depthAtPoint, 4.0);
    const cleared = acc.clearRange(localX - 20, localX + 20, scoopAmount);
    if (cleared < 0.6) {
      return false;
    }

    const vxCenter = baseVx !== undefined ? baseVx : 0;
    const vyCenter = baseVy !== undefined ? baseVy : 4.5;
    const count = Math.max(5, Math.min(22, Math.round(cleared * 1.5)));

    for (let k = 0; k < count; k++) {
      this.tumblingClumps.push({
        x: startX + (Math.random() * 28 - 14),
        y: startY + (Math.random() * 6 - 3),
        vx: vxCenter + (Math.random() - 0.5) * 3.0 + this.config.wind * 0.4,
        vy: vyCenter + (Math.random() - 0.5) * 2.2,
        radius: 2.0 + Math.random() * 2.6,
        alpha: 0.95,
        sourceWindowKey: key
      });
    }
    return true;
  }

  public shovelWindowSnowAt(px: number, py: number): boolean {
    const hit = this.getWindowSnowAt(px, py);
    if (!hit) return false;
    this.flingWindowSnow(hit.window, px, py);
    return true;
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
            let occluded = false;
            for (let v = 0; v < w; v++) {
              const topWin = this.openWindows[v];
              if (
                flake.x >= topWin.x &&
                flake.x <= topWin.x + topWin.width &&
                flake.y >= topWin.y &&
                flake.y <= topWin.y + topWin.height
              ) {
                occluded = true;
                break;
              }
            }
            if (occluded) break;

            const key = this.getWindowKey(win);
            const acc = this.windowAccumulators.get(key);
            if (acc) {
              acc.deposit(flake.x - win.x, flake.radius * 0.16);
            }
            flake.reset(this.width);
            break;
          }
        }
      }
    }

    if (this.config.accumulateOnWindows) {
      for (const acc of this.windowAccumulators.values()) {
        acc.update();
      }
    }

    for (let k = this.tumblingClumps.length - 1; k >= 0; k--) {
      const clump = this.tumblingClumps[k];
      clump.x += clump.vx;
      clump.y += clump.vy;
      clump.vy += 0.28;
      clump.vx *= 0.98;

      let hitWindow = false;
      for (let w = 0; w < this.openWindows.length; w++) {
        const win = this.openWindows[w];
        const key = this.getWindowKey(win);
        if (clump.sourceWindowKey && clump.sourceWindowKey === key) {
          continue;
        }

        if (
          clump.x >= win.x &&
          clump.x <= win.x + win.width &&
          clump.y >= win.y - 6 &&
          clump.y <= win.y + 12 &&
          clump.vy > 0
        ) {
          let occluded = false;
          for (let v = 0; v < w; v++) {
            const topWin = this.openWindows[v];
            if (
              clump.x >= topWin.x &&
              clump.x <= topWin.x + topWin.width &&
              clump.y >= topWin.y &&
              clump.y <= topWin.y + topWin.height
            ) {
              occluded = true;
              break;
            }
          }
          if (occluded) continue;

          const targetAcc = this.windowAccumulators.get(key);
          if (targetAcc) {
            targetAcc.deposit(clump.x - win.x, clump.radius * 0.16);
          }
          this.tumblingClumps.splice(k, 1);
          hitWindow = true;
          break;
        }
      }

      if (!hitWindow && clump.y >= taskbarTop) {
        this.accumulator.deposit(clump.x, 0.22);
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
      const acc = this.windowAccumulators.get(key);
      if (!acc) continue;

      let segments: { start: number; end: number }[] = [{ start: win.x, end: win.x + win.width }];

      for (let v = 0; v < w; v++) {
        const topWin = this.openWindows[v];
        if (topWin.y <= win.y + 6 && topWin.y + topWin.height >= win.y - 20) {
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

      const grad = ctx.createLinearGradient(0, win.y - acc.maxDepth, 0, win.y);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
      grad.addColorStop(0.55, "rgba(240, 248, 255, 0.92)");
      grad.addColorStop(1, "rgba(215, 235, 255, 0.88)");

      for (const seg of segments) {
        const segLen = seg.end - seg.start;
        if (segLen < 10) continue;

        const maxH = acc.getMaxHeightInRange(seg.start - win.x, seg.end - win.x);
        if (maxH < 0.25) continue;

        const colStep = acc.columnWidth;
        const startCol = Math.max(0, Math.floor((seg.start - win.x) / colStep));
        const endCol = Math.min(
          Math.ceil(win.width / colStep) - 1,
          Math.ceil((seg.end - win.x) / colStep)
        );

        ctx.beginPath();
        ctx.moveTo(seg.start, win.y);

        let prevX = seg.start;
        let prevY = win.y - acc.getHeight(seg.start - win.x);
        ctx.lineTo(prevX, prevY);

        for (let col = startCol + 1; col <= endCol; col++) {
          const x = Math.min(seg.end, win.x + col * colStep);
          const h = acc.getHeight(x - win.x);
          const y = win.y - h;
          const midX = (prevX + x) / 2;
          const midY = (prevY + y) / 2;
          ctx.quadraticCurveTo(prevX, prevY, midX, midY);
          prevX = x;
          prevY = y;
        }

        ctx.lineTo(seg.end, win.y);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(seg.start, win.y);
        prevX = seg.start;
        prevY = win.y - acc.getHeight(seg.start - win.x);
        ctx.lineTo(prevX, prevY);
        for (let col = startCol + 1; col <= endCol; col++) {
          const x = Math.min(seg.end, win.x + col * colStep);
          const h = acc.getHeight(x - win.x);
          const y = win.y - h;
          const midX = (prevX + x) / 2;
          const midY = (prevY + y) / 2;
          ctx.quadraticCurveTo(prevX, prevY, midX, midY);
          prevX = x;
          prevY = y;
        }
        ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        const lobeStep = 22;
        const lobeCount = Math.floor(segLen / lobeStep);
        if (lobeCount > 0 && maxH > 1.2) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
          for (let li = 0; li < lobeCount; li++) {
            const lx = seg.start + (li + 0.5) * lobeStep;
            const lh = acc.getHeight(lx - win.x);
            if (lh > 1.0) {
              ctx.beginPath();
              ctx.arc(lx, win.y - lh + 2.5, Math.min(lobeStep * 0.4, lh * 0.8), 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    }
    ctx.restore();
  }
}

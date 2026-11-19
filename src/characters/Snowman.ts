import type { SnowmanConfig, TaskbarBounds, WindowBounds } from "../types";

export interface ShatterDebris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  vRot: number;
  type: "ball-base" | "ball-mid" | "ball-head" | "hat" | "scarf" | "broom" | "nose" | "particle";
  alpha: number;
}

export class Snowman {
  public x: number;
  public y: number;
  public scale: number;
  public isSpawned = false;
  public isDragging = false;
  public hasCustomPosition = false;
  public isRemovable = false;
  public isRidingTrain = false;
  public attachedWindowId: number | null = null;
  public windowOffsetX = 0;
  public windowOffsetY = 0;
  public isFalling = false;
  public vy = 0;
  public tiltAngle = 0;
  public bounceScaleY = 1.0;
  public id: string = Math.random().toString(36).slice(2);
  public spawnProgress = 0;
  public isWaving = false;
  public waveAngle = 0;
  public idleTimer = 0;
  public isShattered = false;
  public shatterTimer = 0;
  public debris: ShatterDebris[] = [];
  public onShatter?: (x: number, y: number, isRemovable: boolean) => void;
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

  public startFalling(): void {
    if (this.isFalling || this.isDragging || this.isRidingTrain || this.isShattered) return;
    this.isFalling = true;
    this.vy = 1.0;
    this.tiltAngle = (Math.random() - 0.5) * 0.15;
    this.attachedWindowId = null;
  }

  public shatter(): void {
    if (this.isShattered) return;
    this.isShattered = true;
    this.isFalling = false;
    this.vy = 0;
    this.shatterTimer = 0;
    this.debris = [];

    this.debris.push({
      x: this.x - 14,
      y: this.y - 18,
      vx: -2.8 - Math.random() * 2.0,
      vy: -3.5 - Math.random() * 2.5,
      radius: 20 * this.scale,
      rotation: 0,
      vRot: -0.15,
      type: "ball-base",
      alpha: 1.0
    });

    this.debris.push({
      x: this.x + 12,
      y: this.y - 42,
      vx: 2.5 + Math.random() * 2.0,
      vy: -4.5 - Math.random() * 2.5,
      radius: 16 * this.scale,
      rotation: 0,
      vRot: 0.18,
      type: "ball-mid",
      alpha: 1.0
    });

    this.debris.push({
      x: this.x + (Math.random() - 0.5) * 8,
      y: this.y - 66,
      vx: (Math.random() - 0.5) * 4.0,
      vy: -5.5 - Math.random() * 2.0,
      radius: 12 * this.scale,
      rotation: 0,
      vRot: (Math.random() - 0.5) * 0.25,
      type: "ball-head",
      alpha: 1.0
    });

    this.debris.push({
      x: this.x + 4,
      y: this.y - 74,
      vx: 1.5 + Math.random() * 2.5,
      vy: -6.0 - Math.random() * 2.0,
      radius: 8 * this.scale,
      rotation: 0,
      vRot: 0.3,
      type: "hat",
      alpha: 1.0
    });

    this.debris.push({
      x: this.x - 6,
      y: this.y - 60,
      vx: -2.0 - Math.random() * 2.0,
      vy: -4.0 - Math.random() * 2.0,
      radius: 7 * this.scale,
      rotation: 0,
      vRot: -0.2,
      type: "scarf",
      alpha: 1.0
    });

    this.debris.push({
      x: this.x + 2,
      y: this.y - 70,
      vx: (Math.random() - 0.5) * 3.0,
      vy: -5.0 - Math.random() * 2.0,
      radius: 4 * this.scale,
      rotation: 0,
      vRot: 0.4,
      type: "nose",
      alpha: 1.0
    });

    if (this.config.accessory === "broom" || this.config.accessory === "candy-cane") {
      this.debris.push({
        x: this.x + 20,
        y: this.y - 45,
        vx: 3.0 + Math.random() * 2.0,
        vy: -5.0 - Math.random() * 2.0,
        radius: 14 * this.scale,
        rotation: 0.2,
        vRot: 0.2,
        type: "broom",
        alpha: 1.0
      });
    }

    for (let i = 0; i < 22; i++) {
      this.debris.push({
        x: this.x + (Math.random() - 0.5) * 30,
        y: this.y - 20 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 7.0,
        vy: -2.0 - Math.random() * 6.0,
        radius: 2.0 + Math.random() * 3.5,
        rotation: 0,
        vRot: (Math.random() - 0.5) * 0.4,
        type: "particle",
        alpha: 0.95
      });
    }

    if (this.onShatter) {
      this.onShatter(this.x, this.y, this.isRemovable);
    }
  }

  public update(taskbar: TaskbarBounds, windows: WindowBounds[] = []): void {
    this.idleTimer += 0.05;

    if (this.isShattered) {
      this.shatterTimer += 0.016;
      for (const d of this.debris) {
        d.x += d.vx;
        d.y += d.vy;
        d.vy += 0.32;
        d.vx *= 0.96;
        d.rotation += d.vRot;

        if (d.y >= taskbar.y - d.radius) {
          d.y = taskbar.y - d.radius;
          d.vy = -d.vy * 0.35;
          d.vRot *= 0.7;
          if (Math.abs(d.vy) < 0.8) {
            d.vy = 0;
          }
        }
      }

      if (this.isRemovable) {
        if (this.shatterTimer > 2.0) {
          for (const d of this.debris) {
            d.alpha = Math.max(0, d.alpha - 0.02);
          }
        }
      } else {
        if (this.shatterTimer > 2.5) {
          this.isShattered = false;
          this.shatterTimer = 0;
          this.debris = [];
          this.y = taskbar.y;
          this.bounceScaleY = 0.6;
        }
      }
      return;
    }

    if (this.bounceScaleY < 1.0) {
      this.bounceScaleY = Math.min(1.0, this.bounceScaleY + 0.05);
    }

    if (this.isFalling) {
      this.vy += 0.42;
      this.y += this.vy;
      this.tiltAngle = Math.sin(this.idleTimer * 8) * 0.12;

      for (const win of windows) {
        if (
          this.x >= win.x &&
          this.x <= win.x + win.width &&
          this.y >= win.y - 4 &&
          this.y <= win.y + 16 &&
          this.vy > 0
        ) {
          if (this.vy >= 3.0) {
            this.shatter();
            return;
          }
          this.isFalling = false;
          this.vy = 0;
          this.tiltAngle = 0;
          this.bounceScaleY = 0.82;
          this.attachedWindowId = win.id || null;
          this.windowOffsetX = this.x - win.x;
          this.windowOffsetY = 0;
          this.y = win.y;
          return;
        }
      }

      if (this.y >= taskbar.y) {
        if (this.vy >= 3.0) {
          this.shatter();
          return;
        }
        this.isFalling = false;
        this.vy = 0;
        this.tiltAngle = 0;
        this.bounceScaleY = 0.82;
        this.attachedWindowId = null;
        this.y = taskbar.y;
        return;
      }
      return;
    }

    if (!this.hasCustomPosition && !this.isDragging && !this.isRidingTrain && !this.attachedWindowId) {
      this.y = taskbar.y;
    }

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

  public updateWindows(windows: WindowBounds[]): void {
    if (this.attachedWindowId !== null && !this.isDragging && !this.isRidingTrain && !this.isFalling) {
      const win = windows.find((w) => w.id === this.attachedWindowId);
      if (!win) {
        this.startFalling();
        return;
      }

      const relativeX = this.x - win.x;
      if (relativeX < -15 || relativeX > win.width + 15) {
        this.startFalling();
        return;
      }

      this.x = win.x + this.windowOffsetX;
      this.y = win.y + this.windowOffsetY;
      this.hasCustomPosition = true;
    }
  }

  public setWaving(waving: boolean): void {
    this.isWaving = waving;
  }

  public containsPoint(px: number, py: number): boolean {
    if (this.isShattered) return false;
    const width = 80 * this.scale;
    const height = 105 * this.scale;
    const left = this.x - width / 2;
    const top = this.y - height;
    return px >= left && px <= left + width && py >= top && py <= this.y + 10;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.isShattered) {
      this.drawShattered(ctx);
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.tiltAngle);
    ctx.scale(this.scale, this.scale * this.bounceScaleY);

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

  private drawShattered(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const d of this.debris) {
      if (d.alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = d.alpha;
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rotation);

      if (d.type === "particle") {
        ctx.beginPath();
        ctx.arc(0, 0, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      } else if (d.type === "ball-base" || d.type === "ball-mid" || d.type === "ball-head") {
        ctx.beginPath();
        ctx.arc(0, 0, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.fillStyle = "rgba(200, 225, 255, 0.45)";
        ctx.beginPath();
        ctx.arc(-d.radius * 0.3, -d.radius * 0.2, d.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.type === "hat") {
        if (this.config.hat === "top-hat") {
          ctx.fillStyle = "#263238";
          ctx.beginPath();
          ctx.ellipse(0, 0, 16, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(-9, -16, 18, 16);
          ctx.fillStyle = "#c62828";
          ctx.fillRect(-9, -4, 18, 4);
        } else if (this.config.hat === "santa-hat") {
          ctx.fillStyle = "#d32f2f";
          ctx.beginPath();
          ctx.moveTo(-11, 0);
          ctx.quadraticCurveTo(0, -22, 16, -18);
          ctx.lineTo(9, 0);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(-12, -2, 24, 5, 2.5);
          ctx.fill();
        }
      } else if (d.type === "scarf") {
        ctx.fillStyle = "#e53935";
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-3, 0, 6, 14);
      } else if (d.type === "nose") {
        ctx.fillStyle = "#ff6f00";
        ctx.beginPath();
        ctx.moveTo(-2, -3);
        ctx.lineTo(7, 0);
        ctx.lineTo(-2, 3);
        ctx.closePath();
        ctx.fill();
      } else if (d.type === "broom") {
        ctx.strokeStyle = "#8d6e63";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(0, 18);
        ctx.stroke();

        ctx.fillStyle = "#fbc02d";
        ctx.beginPath();
        ctx.moveTo(-6, -18);
        ctx.lineTo(6, -18);
        ctx.lineTo(8, -28);
        ctx.lineTo(-8, -28);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
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

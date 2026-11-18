import type { ScreenEvent, TaskbarBounds } from "../types";
import type { SnowAccumulator } from "../snow/Accumulator";

interface SnowploughVehicle {
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
  wheelRotation: number;
}

interface SnowballProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  targetX: number;
  radius: number;
}

interface FighterSnowman {
  x: number;
  y: number;
  side: "left" | "right";
  health: number;
  throwCooldown: number;
  speechText: string | null;
  speechTimer: number;
}

export class EventManager {
  private activePlough: SnowploughVehicle | null = null;
  private fighters: FighterSnowman[] = [];
  private snowballs: SnowballProjectile[] = [];
  private accumulator: SnowAccumulator;
  private taskbar: TaskbarBounds;

  constructor(accumulator: SnowAccumulator, taskbar: TaskbarBounds) {
    this.accumulator = accumulator;
    this.taskbar = taskbar;
  }

  public setTaskbar(taskbar: TaskbarBounds): void {
    this.taskbar = taskbar;
  }

  public trigger(event: ScreenEvent): void {
    if (event === "snowplough") {
      this.spawnSnowplough();
    } else if (event === "snowball-fight") {
      this.spawnSnowballFight();
    }
  }

  private spawnSnowplough(): void {
    this.activePlough = {
      x: -120,
      y: this.taskbar.y,
      speed: 3.2,
      width: 80,
      height: 38,
      wheelRotation: 0
    };
  }

  private spawnSnowballFight(): void {
    const leftX = Math.max(120, window.innerWidth * 0.2);
    const rightX = Math.min(window.innerWidth - 120, window.innerWidth * 0.8);

    this.fighters = [
      {
        x: leftX,
        y: this.taskbar.y,
        side: "left",
        health: 3,
        throwCooldown: 40,
        speechText: "PEACE!",
        speechTimer: 100
      },
      {
        x: rightX,
        y: this.taskbar.y,
        side: "right",
        health: 3,
        throwCooldown: 80,
        speechText: "SNOWBALL!",
        speechTimer: 100
      }
    ];
  }

  public update(): void {
    if (this.activePlough) {
      this.activePlough.x += this.activePlough.speed;
      this.activePlough.wheelRotation += 0.12;

      this.accumulator.clearRange(this.activePlough.x - 20, this.activePlough.x + 80);

      if (this.activePlough.x > window.innerWidth + 150) {
        this.activePlough = null;
      }
    }

    if (this.fighters.length === 2) {
      for (const fighter of this.fighters) {
        if (fighter.speechTimer > 0) {
          fighter.speechTimer--;
          if (fighter.speechTimer === 0) {
            fighter.speechText = null;
          }
        }

        fighter.throwCooldown--;
        if (fighter.throwCooldown <= 0) {
          fighter.throwCooldown = 90 + Math.floor(Math.random() * 40);
          this.throwSnowball(fighter);
        }
      }
    }

    for (let i = this.snowballs.length - 1; i >= 0; i--) {
      const ball = this.snowballs[i];
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vy += ball.gravity;

      if (ball.y >= this.taskbar.y) {
        this.accumulator.deposit(ball.x, 0.8);
        this.snowballs.splice(i, 1);
      }
    }
  }

  private throwSnowball(fighter: FighterSnowman): void {
    const target = this.fighters.find((f) => f !== fighter);
    if (!target) return;

    const dx = target.x - fighter.x;
    const duration = 45;
    const vx = dx / duration;
    const vy = -12;

    this.snowballs.push({
      x: fighter.x,
      y: fighter.y - 40,
      vx,
      vy,
      gravity: 0.5,
      targetX: target.x,
      radius: 5
    });

    fighter.speechText = Math.random() > 0.5 ? "CATCH!" : "TAKE THAT!";
    fighter.speechTimer = 60;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.activePlough) {
      this.drawSnowplough(ctx, this.activePlough);
    }

    for (const fighter of this.fighters) {
      this.drawFighter(ctx, fighter);
    }

    for (const ball of this.snowballs) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(180, 220, 255, 0.7)";
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  private drawSnowplough(ctx: CanvasRenderingContext2D, plough: SnowploughVehicle): void {
    ctx.save();
    ctx.translate(plough.x, plough.y);

    ctx.fillStyle = "#fbc02d";
    ctx.beginPath();
    ctx.roundRect(0, -32, 54, 24, [4, 8, 2, 2]);
    ctx.fill();

    ctx.fillStyle = "#4fc3f7";
    ctx.fillRect(32, -28, 16, 12);

    ctx.fillStyle = "#78909c";
    ctx.beginPath();
    ctx.moveTo(52, -26);
    ctx.lineTo(76, -4);
    ctx.lineTo(76, 0);
    ctx.lineTo(52, -4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(74 + Math.random() * 8, -6 - Math.random() * 12, 2 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    this.drawWheel(ctx, 14, -6, plough.wheelRotation);
    this.drawWheel(ctx, 42, -6, plough.wheelRotation);

    ctx.restore();
  }

  private drawWheel(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#263238";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#b0bec5";
    ctx.fill();

    ctx.restore();
  }

  private drawFighter(ctx: CanvasRenderingContext2D, fighter: FighterSnowman): void {
    ctx.save();
    ctx.translate(fighter.x, fighter.y);

    ctx.beginPath();
    ctx.arc(0, -18, 18, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(180, 210, 240, 0.4)";
    ctx.shadowBlur = 4;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -42, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fighter.side === "left" ? "#1976d2" : "#d32f2f";
    ctx.beginPath();
    ctx.roundRect(-10, -56, 20, 8, [6, 6, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#222222";
    ctx.beginPath();
    ctx.arc(-3, -43, 1.5, 0, Math.PI * 2);
    ctx.arc(3, -43, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff6f00";
    ctx.beginPath();
    ctx.moveTo(0, -41);
    ctx.lineTo(fighter.side === "left" ? 6 : -6, -40);
    ctx.lineTo(0, -39);
    ctx.closePath();
    ctx.fill();

    if (fighter.speechText) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.beginPath();
      ctx.roundRect(-30, -82, 60, 20, 6);
      ctx.fill();

      ctx.fillStyle = "#263238";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(fighter.speechText, 0, -68);
    }

    ctx.restore();
  }
}

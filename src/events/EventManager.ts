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

interface SantaFlyer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number; alpha: number; size: number }[];
}

interface GiftTrainVehicle {
  x: number;
  y: number;
  speed: number;
  wheelRotation: number;
  smoke: { x: number; y: number; radius: number; alpha: number }[];
}

export class EventManager {
  private activePlough: SnowploughVehicle | null = null;
  private fighters: FighterSnowman[] = [];
  private snowballs: SnowballProjectile[] = [];
  private activeSanta: SantaFlyer | null = null;
  private activeTrain: GiftTrainVehicle | null = null;
  private accumulator: SnowAccumulator;
  private taskbar: TaskbarBounds;
  private battleRounds = 0;
  private battleEndingTimer = 0;

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
      if (this.fighters.length > 0) {
        this.stopSnowballFight();
      } else {
        this.spawnSnowballFight();
      }
    } else if (event === "stop-snowball-fight") {
      this.stopSnowballFight();
    } else if (event === "santa") {
      this.spawnSanta();
    } else if (event === "train") {
      this.spawnTrain();
    }
  }

  public stopSnowballFight(): void {
    this.fighters = [];
    this.snowballs = [];
    this.battleRounds = 0;
    this.battleEndingTimer = 0;
  }

  public containsFighter(px: number, py: number): boolean {
    for (const fighter of this.fighters) {
      const left = fighter.x - 30;
      const right = fighter.x + 30;
      const top = fighter.y - 70;
      const bottom = fighter.y + 10;
      if (px >= left && px <= right && py >= top && py <= bottom) {
        return true;
      }
    }
    return false;
  }

  public isSnowballFightActive(): boolean {
    return this.fighters.length > 0;
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
    this.battleRounds = 0;
    this.battleEndingTimer = 0;
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

  private spawnSanta(): void {
    this.activeSanta = {
      x: -150,
      y: 90,
      vx: 4.5,
      vy: 0.2,
      trail: []
    };
  }

  private spawnTrain(): void {
    this.activeTrain = {
      x: -260,
      y: this.taskbar.y,
      speed: 2.8,
      wheelRotation: 0,
      smoke: []
    };
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

    if (this.activeSanta) {
      this.activeSanta.x += this.activeSanta.vx;
      this.activeSanta.y += Math.sin(this.activeSanta.x * 0.015) * 1.5;

      this.activeSanta.trail.push({
        x: this.activeSanta.x,
        y: this.activeSanta.y + 12,
        alpha: 0.9,
        size: 3 + Math.random() * 3
      });

      for (let i = this.activeSanta.trail.length - 1; i >= 0; i--) {
        const star = this.activeSanta.trail[i];
        star.alpha -= 0.02;
        star.y += 0.3;
        if (star.alpha <= 0) {
          this.activeSanta.trail.splice(i, 1);
        }
      }

      if (this.activeSanta.x > window.innerWidth + 200) {
        this.activeSanta = null;
      }
    }

    if (this.activeTrain) {
      this.activeTrain.x += this.activeTrain.speed;
      this.activeTrain.wheelRotation += 0.15;

      if (Math.random() < 0.3) {
        this.activeTrain.smoke.push({
          x: this.activeTrain.x + 65,
          y: this.activeTrain.y - 48,
          radius: 4,
          alpha: 0.8
        });
      }

      for (let i = this.activeTrain.smoke.length - 1; i >= 0; i--) {
        const p = this.activeTrain.smoke[i];
        p.x -= 0.5;
        p.y -= 1.2;
        p.radius += 0.4;
        p.alpha -= 0.02;
        if (p.alpha <= 0) {
          this.activeTrain.smoke.splice(i, 1);
        }
      }

      if (this.activeTrain.x > window.innerWidth + 300) {
        this.activeTrain = null;
      }
    }

    if (this.fighters.length === 2) {
      if (this.battleEndingTimer > 0) {
        this.battleEndingTimer--;
        if (this.battleEndingTimer === 0) {
          this.stopSnowballFight();
        }
      } else {
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

    this.battleRounds++;
    if (this.battleRounds >= 12) {
      for (const f of this.fighters) {
        f.speechText = "GOOD GAME!";
        f.speechTimer = 180;
      }
      this.battleEndingTimer = 180;
    } else {
      fighter.speechText = Math.random() > 0.5 ? "CATCH!" : "TAKE THAT!";
      fighter.speechTimer = 60;
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.activePlough) {
      this.drawSnowplough(ctx, this.activePlough);
    }

    if (this.activeSanta) {
      this.drawSanta(ctx, this.activeSanta);
    }

    if (this.activeTrain) {
      this.drawTrain(ctx, this.activeTrain);
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

  private drawSanta(ctx: CanvasRenderingContext2D, santa: SantaFlyer): void {
    ctx.save();

    for (const star of santa.trail) {
      ctx.fillStyle = `rgba(255, 235, 59, ${star.alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.translate(santa.x, santa.y);

    ctx.fillStyle = "#8d6e63";
    ctx.beginPath();
    ctx.roundRect(50, -4, 28, 16, 6);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(74, -2);
    ctx.lineTo(82, -14);
    ctx.lineTo(88, -18);
    ctx.moveTo(82, -14);
    ctx.lineTo(78, -18);
    ctx.strokeStyle = "#5d4037";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#c62828";
    ctx.beginPath();
    ctx.roundRect(0, -10, 42, 22, [6, 12, 10, 10]);
    ctx.fill();

    ctx.strokeStyle = "#ffd54f";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-6, 14);
    ctx.lineTo(44, 14);
    ctx.quadraticCurveTo(52, 14, 52, 6);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(22, -14, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#c62828";
    ctx.beginPath();
    ctx.moveTo(15, -16);
    ctx.lineTo(29, -16);
    ctx.lineTo(22, -26);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private drawTrain(ctx: CanvasRenderingContext2D, train: GiftTrainVehicle): void {
    ctx.save();
    ctx.translate(train.x, train.y);

    for (const puff of train.smoke) {
      ctx.fillStyle = `rgba(230, 240, 255, ${puff.alpha})`;
      ctx.beginPath();
      ctx.arc(puff.x - train.x, puff.y - train.y, puff.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#b71c1c";
    ctx.beginPath();
    ctx.roundRect(0, -38, 75, 30, [4, 8, 2, 2]);
    ctx.fill();

    ctx.fillStyle = "#263238";
    ctx.fillRect(55, -48, 12, 12);
    ctx.fillRect(8, -44, 24, 8);

    ctx.fillStyle = "#fff59d";
    ctx.fillRect(12, -34, 16, 14);

    ctx.fillStyle = "#2e7d32";
    ctx.beginPath();
    ctx.roundRect(82, -32, 65, 24, 4);
    ctx.fill();

    ctx.fillStyle = "#e53935";
    ctx.fillRect(96, -42, 16, 12);
    ctx.fillStyle = "#ffd54f";
    ctx.fillRect(102, -42, 4, 12);

    ctx.fillStyle = "#f57c00";
    ctx.beginPath();
    ctx.roundRect(154, -32, 65, 24, 4);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(168, -46, 24, 16, 2);
    ctx.fill();
    ctx.strokeStyle = "#e53935";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    this.drawWheel(ctx, 16, -6, train.wheelRotation);
    this.drawWheel(ctx, 38, -6, train.wheelRotation);
    this.drawWheel(ctx, 60, -6, train.wheelRotation);
    this.drawWheel(ctx, 96, -6, train.wheelRotation);
    this.drawWheel(ctx, 134, -6, train.wheelRotation);
    this.drawWheel(ctx, 168, -6, train.wheelRotation);
    this.drawWheel(ctx, 204, -6, train.wheelRotation);

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

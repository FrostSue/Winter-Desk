import type { ScreenEvent, TaskbarBounds } from "../types";
import type { SnowAccumulator } from "../snow/Accumulator";

interface SnowploughVehicle {
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
  wheelRotation: number;
  collectedSnow: number;
  spray: { x: number; y: number; vx: number; vy: number; radius: number; alpha: number }[];
}

interface SnowballProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  targetSide: "left" | "right";
  radius: number;
  trail: { x: number; y: number; alpha: number; size: number }[];
}

interface BattleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
}

interface FighterSnowman {
  x: number;
  y: number;
  side: "left" | "right";
  health: number;
  maxHealth: number;
  throwCooldown: number;
  throwPhase: number;
  crouchProgress: number;
  hitShake: number;
  isWinner: boolean;
  isDefeated: boolean;
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
  passengers: ("snowman" | "companion")[];
  smoke: { x: number; y: number; radius: number; alpha: number }[];
}

export class EventManager {
  private activePlough: SnowploughVehicle | null = null;
  private fighters: FighterSnowman[] = [];
  private snowballs: SnowballProjectile[] = [];
  private battleParticles: BattleParticle[] = [];
  private floatingTexts: FloatingText[] = [];
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
    this.battleParticles = [];
    this.floatingTexts = [];
    this.battleRounds = 0;
    this.battleEndingTimer = 0;
  }

  public containsFighter(px: number, py: number): boolean {
    for (const fighter of this.fighters) {
      const left = fighter.x - 36;
      const right = fighter.x + 36;
      const top = fighter.y - 75;
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

  public hasTrain(): boolean {
    return this.activeTrain !== null;
  }

  public getTrainPassengerPos(): { x: number; y: number } | null {
    if (!this.activeTrain) return null;
    return {
      x: this.activeTrain.x + 85,
      y: this.activeTrain.y - 20
    };
  }

  public isTrainNear(px: number, py: number): boolean {
    if (!this.activeTrain) return false;
    return (
      px >= this.activeTrain.x - 80 &&
      px <= this.activeTrain.x + 200 &&
      py >= this.activeTrain.y - 70 &&
      py <= this.activeTrain.y + 20
    );
  }

  public boardTrain(type: "snowman" | "companion"): void {
    if (this.activeTrain && !this.activeTrain.passengers.includes(type)) {
      this.activeTrain.passengers.push(type);
    }
  }

  public unboardTrain(): void {
    if (this.activeTrain) {
      this.activeTrain.passengers = [];
    }
  }

  private spawnSnowplough(): void {
    this.activePlough = {
      x: -140,
      y: this.taskbar.y,
      speed: 3.2,
      width: 80,
      height: 38,
      wheelRotation: 0,
      collectedSnow: 0,
      spray: []
    };
  }

  private spawnSnowballFight(): void {
    this.battleRounds = 0;
    this.battleEndingTimer = 0;
    this.battleParticles = [];
    this.floatingTexts = [];
    const leftX = Math.max(140, window.innerWidth * 0.22);
    const rightX = Math.min(window.innerWidth - 140, window.innerWidth * 0.78);

    this.fighters = [
      {
        x: leftX,
        y: this.taskbar.y,
        side: "left",
        health: 3,
        maxHealth: 3,
        throwCooldown: 50,
        throwPhase: 0,
        crouchProgress: 0,
        hitShake: 0,
        isWinner: false,
        isDefeated: false,
        speechText: "TEAM FROST READY!",
        speechTimer: 100
      },
      {
        x: rightX,
        y: this.taskbar.y,
        side: "right",
        health: 3,
        maxHealth: 3,
        throwCooldown: 100,
        throwPhase: 0,
        crouchProgress: 0,
        hitShake: 0,
        isWinner: false,
        isDefeated: false,
        speechText: "TEAM EMBER READY!",
        speechTimer: 100
      }
    ];
  }

  private spawnSanta(): void {
    this.activeSanta = {
      x: -220,
      y: 90,
      vx: 4.5,
      vy: 0.18,
      trail: []
    };
  }

  public spawnTrain(): void {
    this.activeTrain = {
      x: -280,
      y: this.taskbar.y,
      speed: 3.0,
      wheelRotation: 0,
      passengers: [],
      smoke: []
    };
  }

  public update(): void {
    if (this.activePlough) {
      this.activePlough.x += this.activePlough.speed;
      this.activePlough.wheelRotation += 0.12;

      const cleared = this.accumulator.clearRangeResidual(
        this.activePlough.x - 10,
        this.activePlough.x + 65,
        2.2,
        2.6
      );
      this.activePlough.collectedSnow = Math.min(42, this.activePlough.collectedSnow + cleared * 0.14);

      if (cleared > 0.1 && Math.random() < 0.85) {
        this.activePlough.spray.push({
          x: this.activePlough.x + 56 + Math.random() * 8,
          y: this.activePlough.y - 4 - Math.random() * (this.activePlough.collectedSnow * 0.35 + 8),
          vx: 1.4 + Math.random() * 2.8,
          vy: -2.0 - Math.random() * 2.6,
          radius: 1.6 + Math.random() * 2.4,
          alpha: 0.95
        });
      }

      for (let i = this.activePlough.spray.length - 1; i >= 0; i--) {
        const p = this.activePlough.spray[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28;
        p.vx *= 0.97;
        p.alpha -= 0.035;
        if (p.alpha <= 0 || p.y >= this.taskbar.y) {
          this.activePlough.spray.splice(i, 1);
        }
      }

      if (this.activePlough.x > window.innerWidth + 180) {
        this.activePlough = null;
      }
    }

    if (this.activeSanta) {
      this.activeSanta.x += this.activeSanta.vx;
      this.activeSanta.y += this.activeSanta.vy;

      if (Math.random() < 0.6) {
        this.activeSanta.trail.push({
          x: this.activeSanta.x - 20,
          y: this.activeSanta.y + (Math.random() * 12 - 6),
          alpha: 1.0,
          size: 2 + Math.random() * 3
        });
      }

      for (let i = this.activeSanta.trail.length - 1; i >= 0; i--) {
        const star = this.activeSanta.trail[i];
        star.x -= 1.2;
        star.y += 0.4;
        star.alpha -= 0.025;
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
          x: this.activeTrain.x + 130,
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

      if (this.activeTrain.x > window.innerWidth + 350) {
        this.activeTrain = null;
      }
    }

    if (this.fighters.length === 2) {
      const leftFighter = this.fighters[0];
      const rightFighter = this.fighters[1];

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

          if (fighter.hitShake > 0) {
            fighter.hitShake--;
          }

          if (fighter.throwPhase > 0) {
            fighter.throwPhase++;
            if (fighter.throwPhase === 8) {
              this.launchSnowball(fighter);
            } else if (fighter.throwPhase > 16) {
              fighter.throwPhase = 0;
            }
          }

          if (!fighter.isDefeated && !fighter.isWinner && fighter.throwPhase === 0) {
            fighter.throwCooldown--;
            if (fighter.throwCooldown <= 0) {
              fighter.throwCooldown = 80 + Math.floor(Math.random() * 45);
              fighter.throwPhase = 1;
            }
          }

          const incomingBall = this.snowballs.find((b) => b.targetSide === fighter.side);
          if (incomingBall && Math.abs(incomingBall.x - fighter.x) < 140 && Math.abs(incomingBall.x - fighter.x) > 35) {
            if (fighter.crouchProgress < 1.0) {
              fighter.crouchProgress = Math.min(1.0, fighter.crouchProgress + 0.18);
            }
          } else {
            if (fighter.crouchProgress > 0) {
              fighter.crouchProgress = Math.max(0, fighter.crouchProgress - 0.12);
            }
          }
        }
      }
    }

    for (let i = this.snowballs.length - 1; i >= 0; i--) {
      const ball = this.snowballs[i];
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vy += ball.gravity;

      if (Math.random() < 0.7) {
        ball.trail.push({
          x: ball.x,
          y: ball.y,
          alpha: 0.8,
          size: 1.5 + Math.random() * 2.2
        });
      }

      for (let t = ball.trail.length - 1; t >= 0; t--) {
        const tr = ball.trail[t];
        tr.alpha -= 0.05;
        if (tr.alpha <= 0) {
          ball.trail.splice(t, 1);
        }
      }

      const targetFighter = this.fighters.find((f) => f.side === ball.targetSide);
      if (targetFighter && !targetFighter.isDefeated) {
        const bodyHeight = 55 * (1.0 - targetFighter.crouchProgress * 0.45);
        const targetCenterY = targetFighter.y - bodyHeight * 0.55;
        const dist = Math.hypot(ball.x - targetFighter.x, ball.y - targetCenterY);

        if (dist < 24) {
          if (targetFighter.crouchProgress > 0.75 && ball.y < targetFighter.y - bodyHeight) {
            this.addFloatingText(targetFighter.x, targetFighter.y - 65, "DODGED!", "#ffeb3b");
          } else {
            targetFighter.health = Math.max(0, targetFighter.health - 1);
            targetFighter.hitShake = 22;
            this.addSnowSplatter(ball.x, ball.y, 14);
            const exclamations = ["SPLAT!", "BAM!", "POW!", "OOF!"];
            const text = exclamations[Math.floor(Math.random() * exclamations.length)];
            this.addFloatingText(targetFighter.x, targetFighter.y - 65, text, "#ff5252");

            if (targetFighter.health <= 0) {
              targetFighter.isDefeated = true;
              const winner = this.fighters.find((f) => f !== targetFighter);
              if (winner) {
                winner.isWinner = true;
                winner.speechText = "VICTORY! 🎉";
                winner.speechTimer = 220;
              }
              targetFighter.speechText = "GOOD GAME! 💫";
              targetFighter.speechTimer = 220;
              this.battleEndingTimer = 220;
            }
          }
          this.snowballs.splice(i, 1);
          continue;
        }
      }

      if (ball.y >= this.taskbar.y) {
        this.addSnowSplatter(ball.x, this.taskbar.y - 2, 8);
        this.accumulator.deposit(ball.x, 0.6);
        this.snowballs.splice(i, 1);
      }
    }

    for (let i = this.battleParticles.length - 1; i >= 0; i--) {
      const p = this.battleParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.32;
      p.vx *= 0.98;
      p.alpha -= 0.03;
      if (p.alpha <= 0 || p.y >= this.taskbar.y) {
        this.battleParticles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.vy *= 0.95;
      ft.alpha -= 0.02;
      ft.scale = Math.min(1.2, ft.scale + 0.03);
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private launchSnowball(fighter: FighterSnowman): void {
    const target = this.fighters.find((f) => f !== fighter);
    if (!target) return;

    const dx = target.x - fighter.x;
    const duration = 40 + Math.floor(Math.random() * 8);
    const vx = dx / duration;
    const vy = -12.5 - Math.random() * 2.0;

    this.snowballs.push({
      x: fighter.x + (fighter.side === "left" ? 18 : -18),
      y: fighter.y - 38,
      vx,
      vy,
      gravity: 0.52,
      targetSide: target.side,
      radius: 5.5,
      trail: []
    });

    this.battleRounds++;
    fighter.speechText = Math.random() > 0.5 ? "CATCH!" : "TAKE THIS!";
    fighter.speechTimer = 50;
  }

  private addSnowSplatter(x: number, y: number, count = 12): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.2;
      this.battleParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        radius: 1.5 + Math.random() * 2.2,
        alpha: 0.95,
        color: "#ffffff"
      });
    }
  }

  private addFloatingText(x: number, y: number, text: string, color: string): void {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
      scale: 0.8,
      vy: -1.6
    });
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
      for (const t of ball.trail) {
        ctx.fillStyle = `rgba(255, 255, 255, ${t.alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(180, 220, 255, 0.8)";
      ctx.shadowBlur = 5;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    for (const p of this.battleParticles) {
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.translate(ft.x, ft.y);
      ctx.scale(ft.scale, ft.scale);
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = "900 13px sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.75)";
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, 0, 0);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);
      ctx.restore();
    }
  }

  private drawSnowplough(ctx: CanvasRenderingContext2D, plough: SnowploughVehicle): void {
    ctx.save();
    ctx.translate(plough.x, plough.y);

    for (const sp of plough.spray) {
      ctx.fillStyle = `rgba(255, 255, 255, ${sp.alpha})`;
      ctx.beginPath();
      ctx.arc(sp.x - plough.x, sp.y - plough.y, sp.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#fbc02d";
    ctx.beginPath();
    ctx.roundRect(4, -30, 42, 20, [4, 6, 2, 2]);
    ctx.fill();

    ctx.fillStyle = "#ffd54f";
    ctx.fillRect(8, -28, 12, 6);

    ctx.fillStyle = "#4fc3f7";
    ctx.beginPath();
    ctx.roundRect(24, -27, 18, 13, [2, 4, 1, 1]);
    ctx.fill();
    ctx.strokeStyle = "#0288d1";
    ctx.lineWidth = 1;
    ctx.stroke();

    const beaconPulse = 0.5 + 0.5 * Math.sin(plough.wheelRotation * 3);
    ctx.fillStyle = `rgba(255, 152, 0, ${0.7 + beaconPulse * 0.3})`;
    ctx.beginPath();
    ctx.arc(18, -32, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#37474f";
    ctx.beginPath();
    ctx.roundRect(2, -10, 48, 10, 5);
    ctx.fill();
    ctx.strokeStyle = "#212121";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    for (let w = 0; w < 4; w++) {
      const wx = 10 + w * 10;
      this.drawWheel(ctx, wx, -5, plough.wheelRotation, 3.8);
    }

    ctx.fillStyle = "#b0bec5";
    ctx.beginPath();
    ctx.moveTo(46, -20);
    ctx.quadraticCurveTo(58, -12, 58, 0);
    ctx.lineTo(52, 0);
    ctx.quadraticCurveTo(52, -10, 42, -16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#546e7a";
    ctx.lineWidth = 1;
    ctx.stroke();

    const moundH = Math.min(22, 5 + plough.collectedSnow * 0.45);
    const moundGrad = ctx.createLinearGradient(48, -moundH, 58, 0);
    moundGrad.addColorStop(0, "#ffffff");
    moundGrad.addColorStop(1, "#d0e4f7");

    ctx.fillStyle = moundGrad;
    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.quadraticCurveTo(58 + moundH * 0.25, -moundH * 0.35, 56 + moundH * 0.15, -moundH);
    ctx.quadraticCurveTo(50, -moundH * 0.75, 46, -14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 1;
    ctx.stroke();

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

    ctx.fillStyle = "#1e88e5";
    ctx.beginPath();
    ctx.roundRect(-70, -28, 60, 22, 3);
    ctx.fill();

    ctx.fillStyle = "#ffd54f";
    ctx.fillRect(-52, -34, 10, 8);
    ctx.fillStyle = "#e53935";
    ctx.fillRect(-34, -36, 12, 10);

    this.drawWheel(ctx, -55, -4, train.wheelRotation);
    this.drawWheel(ctx, -25, -4, train.wheelRotation);

    ctx.fillStyle = "#2e7d32";
    ctx.beginPath();
    ctx.roundRect(0, -28, 75, 22, 3);
    ctx.fill();

    ctx.strokeStyle = "#ffd54f";
    ctx.lineWidth = 2;
    ctx.strokeRect(2, -26, 71, 18);

    if (train.passengers.includes("snowman")) {
      ctx.save();
      ctx.translate(22, -28);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, -10, 10, 0, Math.PI * 2);
      ctx.arc(0, -26, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(-2, -27, 1.2, 0, Math.PI * 2);
      ctx.arc(2, -27, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff6f00";
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(4, -24);
      ctx.lineTo(0, -23);
      ctx.fill();
      ctx.restore();
    }

    if (train.passengers.includes("companion")) {
      ctx.save();
      ctx.translate(52, -28);
      ctx.fillStyle = "#263238";
      ctx.beginPath();
      ctx.ellipse(0, -12, 8, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(1, -11, 5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffb300";
      ctx.beginPath();
      ctx.arc(4, -18, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    this.drawWheel(ctx, 16, -4, train.wheelRotation);
    this.drawWheel(ctx, 58, -4, train.wheelRotation);

    ctx.fillStyle = "#b71c1c";
    ctx.beginPath();
    ctx.roundRect(85, -38, 70, 30, [4, 8, 2, 2]);
    ctx.fill();

    ctx.fillStyle = "#263238";
    ctx.fillRect(135, -48, 10, 12);
    ctx.fillRect(92, -44, 22, 8);

    ctx.fillStyle = "#fff59d";
    ctx.fillRect(96, -34, 14, 12);

    this.drawWheel(ctx, 102, -4, train.wheelRotation);
    this.drawWheel(ctx, 140, -4, train.wheelRotation);

    ctx.strokeStyle = "#424242";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.lineTo(0, -12);
    ctx.moveTo(75, -12);
    ctx.lineTo(85, -12);
    ctx.stroke();

    ctx.restore();
  }

  private drawWheel(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number, radius = 7): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#37474f";
    ctx.fill();
    ctx.strokeStyle = "#78909c";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-radius * 0.85, 0);
    ctx.lineTo(radius * 0.85, 0);
    ctx.moveTo(0, -radius * 0.85);
    ctx.lineTo(0, radius * 0.85);
    ctx.strokeStyle = "#90a4ae";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "#b0bec5";
    ctx.fill();

    ctx.restore();
  }

  private drawFighter(ctx: CanvasRenderingContext2D, fighter: FighterSnowman): void {
    ctx.save();

    const shakeX = fighter.hitShake > 0 ? (Math.random() - 0.5) * 5 : 0;
    const victoryHop = fighter.isWinner ? Math.abs(Math.sin(Date.now() * 0.008)) * 12 : 0;
    ctx.translate(fighter.x + shakeX, fighter.y - victoryHop);

    const isLeft = fighter.side === "left";
    const teamColor = isLeft ? "#1976d2" : "#d32f2f";
    const accentColor = isLeft ? "#90caf9" : "#ffcdd2";

    const squashY = 1.0 - fighter.crouchProgress * 0.35;
    const stretchX = 1.0 + fighter.crouchProgress * 0.25;

    ctx.scale(stretchX, squashY);

    ctx.beginPath();
    ctx.arc(0, -18, 18, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(180, 210, 240, 0.45)";
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(0, -42, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.fillStyle = teamColor;
    ctx.beginPath();
    ctx.roundRect(-10, -55, 20, 9, [7, 7, 1, 1]);
    ctx.fill();

    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(0, -57, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = teamColor;
    ctx.beginPath();
    ctx.roundRect(-9, -32, 18, 5, 2.5);
    ctx.fill();

    ctx.fillStyle = "#222222";
    if (fighter.isDefeated) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#333333";
      ctx.beginPath();
      ctx.moveTo(-5, -45);
      ctx.lineTo(-1, -41);
      ctx.moveTo(-1, -45);
      ctx.lineTo(-5, -41);
      ctx.moveTo(1, -45);
      ctx.lineTo(5, -41);
      ctx.moveTo(5, -45);
      ctx.lineTo(1, -41);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-3, -43, 1.4, 0, Math.PI * 2);
      ctx.arc(3, -43, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#ff6f00";
    ctx.beginPath();
    ctx.moveTo(0, -41);
    ctx.lineTo(isLeft ? 6 : -6, -40);
    ctx.lineTo(0, -39);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#5d4037";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";

    const throwAngle = fighter.throwPhase > 0 ? (fighter.throwPhase < 8 ? -0.7 : 0.8) : 0;

    ctx.beginPath();
    if (isLeft) {
      ctx.moveTo(-12, -26);
      ctx.lineTo(-24, -20);
      ctx.moveTo(12, -26);
      const rightArmAngle = 0.2 + throwAngle;
      ctx.lineTo(12 + Math.cos(rightArmAngle) * 16, -26 + Math.sin(rightArmAngle) * 16);
    } else {
      ctx.moveTo(12, -26);
      ctx.lineTo(24, -20);
      ctx.moveTo(-12, -26);
      const leftArmAngle = Math.PI - 0.2 - throwAngle;
      ctx.lineTo(-12 + Math.cos(leftArmAngle) * 16, -26 + Math.sin(leftArmAngle) * 16);
    }
    ctx.stroke();

    ctx.restore();

    ctx.save();
    ctx.translate(fighter.x + shakeX, fighter.y - victoryHop);

    const heartSpacing = 12;
    const startHeartX = -((fighter.maxHealth - 1) * heartSpacing) / 2;
    const heartY = -68 - (fighter.isWinner ? 8 : 0);

    for (let h = 0; h < fighter.maxHealth; h++) {
      const hx = startHeartX + h * heartSpacing;
      const isFilled = h < fighter.health;
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(isFilled ? "❤️" : "🤍", hx, heartY);
    }

    if (fighter.speechText) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.beginPath();
      ctx.roundRect(-45, heartY - 24, 90, 20, 6);
      ctx.fill();

      ctx.strokeStyle = teamColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#263238";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(fighter.speechText, 0, heartY - 11);
    }

    ctx.restore();
  }
}

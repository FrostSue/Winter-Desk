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
  remainingFrames: number;
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
  shouldDodgeNext: boolean;
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
      const left = fighter.x - 40;
      const right = fighter.x + 40;
      const top = fighter.y - 85;
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
      x: this.activeTrain.x - 30,
      y: this.activeTrain.y - 48
    };
  }

  public isTrainNear(px: number, py: number): boolean {
    if (!this.activeTrain) return false;
    return (
      px >= this.activeTrain.x - 180 &&
      px <= this.activeTrain.x + 420 &&
      py >= this.activeTrain.y - 95 &&
      py <= this.activeTrain.y + 25
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
      x: -240,
      y: this.taskbar.y,
      speed: 2.8,
      width: 170,
      height: 65,
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
    const leftX = Math.max(160, window.innerWidth * 0.22);
    const rightX = Math.min(window.innerWidth - 160, window.innerWidth * 0.78);

    this.fighters = [
      {
        x: leftX,
        y: this.taskbar.y,
        side: "left",
        health: 3,
        maxHealth: 3,
        throwCooldown: 40,
        throwPhase: 0,
        crouchProgress: 0,
        shouldDodgeNext: false,
        hitShake: 0,
        isWinner: false,
        isDefeated: false,
        speechText: "TEAM FROST READY!",
        speechTimer: 90
      },
      {
        x: rightX,
        y: this.taskbar.y,
        side: "right",
        health: 3,
        maxHealth: 3,
        throwCooldown: 85,
        throwPhase: 0,
        crouchProgress: 0,
        shouldDodgeNext: false,
        hitShake: 0,
        isWinner: false,
        isDefeated: false,
        speechText: "TEAM EMBER READY!",
        speechTimer: 90
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
      x: -520,
      y: this.taskbar.y,
      speed: 2.6,
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
        this.activePlough.x - 20,
        this.activePlough.x + 135,
        2.2,
        3.2
      );
      this.activePlough.collectedSnow = Math.min(65, this.activePlough.collectedSnow + cleared * 0.18 + 0.08);

      if (Math.random() < 0.95) {
        const moundH = Math.min(48, 12 + this.activePlough.collectedSnow * 0.65);
        for (let sp = 0; sp < 3; sp++) {
          this.activePlough.spray.push({
            x: this.activePlough.x + 110 + Math.random() * 18,
            y: this.activePlough.y - 4 - Math.random() * moundH,
            vx: 2.0 + Math.random() * 3.8,
            vy: -2.8 - Math.random() * 3.8,
            radius: 2.0 + Math.random() * 3.2,
            alpha: 0.95
          });
        }
      }

      for (let i = this.activePlough.spray.length - 1; i >= 0; i--) {
        const p = this.activePlough.spray[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.32;
        p.vx *= 0.97;
        p.alpha -= 0.03;
        if (p.alpha <= 0 || p.y >= this.taskbar.y) {
          this.activePlough.spray.splice(i, 1);
        }
      }

      if (this.activePlough.x > window.innerWidth + 280) {
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

      if (Math.random() < 0.5) {
        this.activeTrain.smoke.push({
          x: this.activeTrain.x + 300,
          y: this.activeTrain.y - 75,
          radius: 8,
          alpha: 0.85
        });
      }

      for (let i = this.activeTrain.smoke.length - 1; i >= 0; i--) {
        const p = this.activeTrain.smoke[i];
        p.x -= 0.8;
        p.y -= 1.4;
        p.radius += 0.6;
        p.alpha -= 0.018;
        if (p.alpha <= 0) {
          this.activeTrain.smoke.splice(i, 1);
        }
      }

      if (this.activeTrain.x > window.innerWidth + 580) {
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
              fighter.throwCooldown = 70 + Math.floor(Math.random() * 35);
              fighter.throwPhase = 1;
            }
          }

          const incomingBall = this.snowballs.find((b) => b.targetSide === fighter.side);
          if (incomingBall && incomingBall.remainingFrames <= 16 && fighter.shouldDodgeNext) {
            if (fighter.crouchProgress < 1.0) {
              fighter.crouchProgress = Math.min(1.0, fighter.crouchProgress + 0.22);
            }
          } else {
            if (fighter.crouchProgress > 0) {
              fighter.crouchProgress = Math.max(0, fighter.crouchProgress - 0.14);
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
      ball.remainingFrames--;

      if (Math.random() < 0.8) {
        ball.trail.push({
          x: ball.x,
          y: ball.y,
          alpha: 0.85,
          size: 2.0 + Math.random() * 2.5
        });
      }

      for (let t = ball.trail.length - 1; t >= 0; t--) {
        const tr = ball.trail[t];
        tr.alpha -= 0.055;
        if (tr.alpha <= 0) {
          ball.trail.splice(t, 1);
        }
      }

      const targetFighter = this.fighters.find((f) => f.side === ball.targetSide);
      if (targetFighter && !targetFighter.isDefeated) {
        const isArrived = ball.remainingFrames <= 0;
        const isClose = Math.hypot(ball.x - targetFighter.x, ball.y - (targetFighter.y - 32)) < 28;

        if (isArrived || isClose) {
          if (targetFighter.crouchProgress > 0.6) {
            this.addFloatingText(targetFighter.x, targetFighter.y - 75, "DODGED! 💨", "#ffeb3b");
            targetFighter.speechText = "WOO!";
            targetFighter.speechTimer = 45;
          } else {
            targetFighter.health = Math.max(0, targetFighter.health - 1);
            targetFighter.hitShake = 28;
            this.addSnowSplatter(ball.x, ball.y, 25);
            const exclamations = ["SPLAT! 💥", "BAM! ❄️", "POW! ⚡", "OOF! 💥"];
            const text = exclamations[Math.floor(Math.random() * exclamations.length)];
            this.addFloatingText(targetFighter.x, targetFighter.y - 75, text, "#ff1744");

            if (targetFighter.health <= 0) {
              targetFighter.isDefeated = true;
              const winner = this.fighters.find((f) => f !== targetFighter);
              if (winner) {
                winner.isWinner = true;
                winner.speechText = "VICTORY! 🏆";
                winner.speechTimer = 240;
              }
              targetFighter.speechText = "GOOD GAME! 💫";
              targetFighter.speechTimer = 240;
              this.battleEndingTimer = 240;
            }
          }
          this.snowballs.splice(i, 1);
          continue;
        }
      }

      if (ball.y >= this.taskbar.y) {
        this.addSnowSplatter(ball.x, this.taskbar.y - 2, 10);
        this.accumulator.deposit(ball.x, 0.6);
        this.snowballs.splice(i, 1);
      }
    }

    for (let i = this.battleParticles.length - 1; i >= 0; i--) {
      const p = this.battleParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.34;
      p.vx *= 0.97;
      p.alpha -= 0.028;
      if (p.alpha <= 0 || p.y >= this.taskbar.y) {
        this.battleParticles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.vy *= 0.94;
      ft.alpha -= 0.018;
      ft.scale = Math.min(1.3, ft.scale + 0.04);
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private launchSnowball(fighter: FighterSnowman): void {
    const target = this.fighters.find((f) => f !== fighter);
    if (!target) return;

    const startX = fighter.x + (fighter.side === "left" ? 22 : -22);
    const startY = fighter.y - 36;
    const targetX = target.x;
    const targetY = target.y - 32;

    const dx = targetX - startX;
    const dy = targetY - startY;

    const duration = Math.max(36, Math.min(55, Math.floor(Math.abs(dx) / 18)));
    const gravity = 0.44;

    const vx = dx / duration;
    const vy = (dy - 0.5 * gravity * duration * duration) / duration;

    target.shouldDodgeNext = Math.random() < 0.35;

    this.snowballs.push({
      x: startX,
      y: startY,
      vx,
      vy,
      gravity,
      targetSide: target.side,
      radius: 6.5,
      remainingFrames: duration,
      trail: []
    });

    this.battleRounds++;
    fighter.speechText = Math.random() > 0.5 ? "CATCH! ❄️" : "TAKE THIS! 💥";
    fighter.speechTimer = 50;
  }

  private addSnowSplatter(x: number, y: number, count = 25): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 5.5;
      this.battleParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.0,
        radius: 2.0 + Math.random() * 3.5,
        alpha: 1.0,
        color: i % 3 === 0 ? "#bbdefb" : "#ffffff"
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
      vy: -2.0
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
        ctx.fillStyle = `rgba(255, 255, 255, ${t.alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(180, 220, 255, 0.9)";
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    for (const p of this.battleParticles) {
      ctx.fillStyle = p.color === "#ffffff" ? `rgba(255, 255, 255, ${p.alpha})` : `rgba(187, 222, 251, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.translate(ft.x, ft.y);
      ctx.scale(ft.scale, ft.scale);
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = "900 15px sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
      ctx.lineWidth = 3.5;
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

    ctx.fillStyle = "#f57f17";
    ctx.beginPath();
    ctx.roundRect(8, -58, 85, 38, [8, 12, 4, 4]);
    ctx.fill();

    ctx.fillStyle = "#fbc02d";
    ctx.fillRect(14, -54, 25, 12);

    ctx.fillStyle = "#81d4fa";
    ctx.beginPath();
    ctx.roundRect(46, -53, 38, 24, [4, 8, 2, 2]);
    ctx.fill();
    ctx.strokeStyle = "#0277bd";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const beaconPulse = 0.5 + 0.5 * Math.sin(plough.wheelRotation * 4);
    ctx.fillStyle = `rgba(255, 111, 0, ${0.75 + beaconPulse * 0.25})`;
    ctx.beginPath();
    ctx.arc(32, -62, 4.5, 0, Math.PI * 2);
    ctx.arc(70, -62, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#263238";
    ctx.beginPath();
    ctx.roundRect(0, -20, 105, 20, 10);
    ctx.fill();
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    for (let w = 0; w < 6; w++) {
      const wx = 12 + w * 16;
      this.drawWheel(ctx, wx, -10, plough.wheelRotation, 7.5);
    }

    ctx.fillStyle = "#37474f";
    ctx.fillRect(80, -32, 20, 8);
    ctx.fillRect(88, -24, 16, 6);

    ctx.fillStyle = "#cfd8dc";
    ctx.beginPath();
    ctx.moveTo(96, -42);
    ctx.quadraticCurveTo(124, -26, 122, 0);
    ctx.lineTo(110, 0);
    ctx.quadraticCurveTo(110, -20, 90, -34);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#78909c";
    ctx.lineWidth = 2;
    ctx.stroke();

    const moundH = Math.min(48, 14 + plough.collectedSnow * 0.65);
    const moundW = 28 + moundH * 0.35;
    const moundGrad = ctx.createLinearGradient(106, -moundH, 120 + moundW, 0);
    moundGrad.addColorStop(0, "#ffffff");
    moundGrad.addColorStop(0.65, "#e1f5fe");
    moundGrad.addColorStop(1, "#b3e5fc");

    ctx.fillStyle = moundGrad;
    ctx.beginPath();
    ctx.moveTo(108, 0);
    ctx.quadraticCurveTo(122 + moundW * 0.6, -moundH * 0.35, 118 + moundW * 0.4, -moundH);
    ctx.quadraticCurveTo(106, -moundH * 0.85, 98, -28);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.beginPath();
    ctx.arc(114 + moundW * 0.25, -moundH + 4, 8, 0, Math.PI * 2);
    ctx.arc(122 + moundW * 0.35, -moundH + 10, 10, 0, Math.PI * 2);
    ctx.arc(110 + moundW * 0.15, -moundH * 0.6, 9, 0, Math.PI * 2);
    ctx.fill();

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
      ctx.fillStyle = `rgba(240, 245, 255, ${puff.alpha})`;
      ctx.beginPath();
      ctx.arc(puff.x - train.x, puff.y - train.y, puff.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255, 238, 88, 0.22)";
    ctx.beginPath();
    ctx.moveTo(350, -45);
    ctx.lineTo(520, -90);
    ctx.lineTo(520, 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#1b5e20";
    ctx.beginPath();
    ctx.roundRect(-140, -56, 190, 44, [6, 6, 2, 2]);
    ctx.fill();
    ctx.strokeStyle = "#ffd54f";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(-142, -62, 194, 9, 4);
    ctx.fill();

    for (let w = 0; w < 4; w++) {
      const winX = -120 + w * 44;
      ctx.fillStyle = "#fff59d";
      ctx.beginPath();
      ctx.roundRect(winX, -48, 30, 22, [4, 4, 1, 1]);
      ctx.fill();
      ctx.strokeStyle = "#424242";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    if (train.passengers.includes("snowman")) {
      ctx.save();
      ctx.translate(-76, -34);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, -6, 8, 0, Math.PI * 2);
      ctx.arc(0, -18, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(-2, -19, 1, 0, Math.PI * 2);
      ctx.arc(2, -19, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff6f00";
      ctx.beginPath();
      ctx.moveTo(0, -17);
      ctx.lineTo(4, -16.5);
      ctx.lineTo(0, -15.5);
      ctx.fill();
      ctx.restore();
    }

    if (train.passengers.includes("companion")) {
      ctx.save();
      ctx.translate(-32, -34);
      ctx.fillStyle = "#263238";
      ctx.beginPath();
      ctx.ellipse(0, -10, 7, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(1, -9, 4, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffb300";
      ctx.beginPath();
      ctx.arc(3, -15, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    this.drawWheel(ctx, -115, -6, train.wheelRotation, 10);
    this.drawWheel(ctx, -85, -6, train.wheelRotation, 10);
    this.drawWheel(ctx, 15, -6, train.wheelRotation, 10);
    this.drawWheel(ctx, 45, -6, train.wheelRotation, 10);

    ctx.strokeStyle = "#424242";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(50, -20);
    ctx.lineTo(65, -20);
    ctx.stroke();

    ctx.fillStyle = "#212121";
    ctx.beginPath();
    ctx.roundRect(65, -46, 85, 34, 4);
    ctx.fill();
    ctx.strokeStyle = "#ffb300";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#37474f";
    ctx.beginPath();
    ctx.arc(85, -48, 12, Math.PI, 0);
    ctx.arc(110, -50, 15, Math.PI, 0);
    ctx.arc(135, -48, 11, Math.PI, 0);
    ctx.fill();

    this.drawWheel(ctx, 80, -6, train.wheelRotation, 10);
    this.drawWheel(ctx, 105, -6, train.wheelRotation, 10);
    this.drawWheel(ctx, 135, -6, train.wheelRotation, 10);

    ctx.strokeStyle = "#424242";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(150, -20);
    ctx.lineTo(165, -20);
    ctx.stroke();

    ctx.fillStyle = "#b71c1c";
    ctx.beginPath();
    ctx.roundRect(165, -68, 65, 56, [6, 8, 2, 2]);
    ctx.fill();

    ctx.fillStyle = "#fff59d";
    ctx.beginPath();
    ctx.roundRect(175, -58, 28, 20, 3);
    ctx.fill();
    ctx.strokeStyle = "#ffd54f";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#263238";
    ctx.beginPath();
    ctx.roundRect(228, -58, 110, 44, [4, 18, 4, 4]);
    ctx.fill();

    ctx.strokeStyle = "#ffd54f";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(250, -58);
    ctx.lineTo(250, -14);
    ctx.moveTo(280, -58);
    ctx.lineTo(280, -14);
    ctx.moveTo(310, -58);
    ctx.lineTo(310, -14);
    ctx.stroke();

    ctx.fillStyle = "#37474f";
    ctx.fillRect(294, -76, 12, 18);
    ctx.beginPath();
    ctx.ellipse(300, -76, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffd54f";
    ctx.beginPath();
    ctx.arc(260, -62, 8, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = "#ffb300";
    ctx.beginPath();
    ctx.roundRect(336, -48, 16, 16, 3);
    ctx.fill();
    ctx.fillStyle = "#ffff8d";
    ctx.beginPath();
    ctx.arc(348, -40, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#37474f";
    ctx.beginPath();
    ctx.moveTo(336, -14);
    ctx.lineTo(372, 0);
    ctx.lineTo(336, 0);
    ctx.closePath();
    ctx.fill();

    this.drawWheel(ctx, 190, -10, train.wheelRotation, 14);
    this.drawWheel(ctx, 245, -12, train.wheelRotation, 17);
    this.drawWheel(ctx, 290, -12, train.wheelRotation, 17);
    this.drawWheel(ctx, 335, -8, train.wheelRotation, 10);

    const rodAngle = train.wheelRotation;
    const rodX1 = 245 + Math.cos(rodAngle) * 9;
    const rodY1 = -12 + Math.sin(rodAngle) * 9;
    const rodX2 = 290 + Math.cos(rodAngle) * 9;
    const rodY2 = -12 + Math.sin(rodAngle) * 9;
    ctx.strokeStyle = "#cfd8dc";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(rodX1, rodY1);
    ctx.lineTo(rodX2, rodY2);
    ctx.lineTo(324, -14);
    ctx.stroke();

    ctx.restore();
  }

  private drawWheel(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number, radius = 7): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#263238";
    ctx.fill();
    ctx.strokeStyle = "#90a4ae";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-radius * 0.85, 0);
    ctx.lineTo(radius * 0.85, 0);
    ctx.moveTo(0, -radius * 0.85);
    ctx.lineTo(0, radius * 0.85);
    ctx.strokeStyle = "#b0bec5";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd54f";
    ctx.fill();

    ctx.restore();
  }

  private drawFighter(ctx: CanvasRenderingContext2D, fighter: FighterSnowman): void {
    ctx.save();

    const shakeX = fighter.hitShake > 0 ? (Math.random() - 0.5) * 8 : 0;
    const victoryHop = fighter.isWinner ? Math.abs(Math.sin(Date.now() * 0.009)) * 14 : 0;
    ctx.translate(fighter.x + shakeX, fighter.y - victoryHop);

    const isLeft = fighter.side === "left";
    const teamColor = isLeft ? "#1976d2" : "#d32f2f";
    const accentColor = isLeft ? "#90caf9" : "#ffcdd2";

    const squashY = 1.0 - fighter.crouchProgress * 0.38;
    const stretchX = 1.0 + fighter.crouchProgress * 0.28;

    ctx.scale(stretchX, squashY);

    ctx.beginPath();
    ctx.arc(0, -18, 18, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(180, 210, 240, 0.5)";
    ctx.shadowBlur = 5;
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
    ctx.arc(0, -57, 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = teamColor;
    ctx.beginPath();
    ctx.roundRect(-9, -32, 18, 5, 2.5);
    ctx.fill();

    ctx.fillStyle = "#222222";
    if (fighter.isDefeated) {
      ctx.lineWidth = 1.8;
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
      ctx.arc(-3, -43, 1.5, 0, Math.PI * 2);
      ctx.arc(3, -43, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#ff6f00";
    ctx.beginPath();
    ctx.moveTo(0, -41);
    ctx.lineTo(isLeft ? 7 : -7, -40);
    ctx.lineTo(0, -39);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#5d4037";
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";

    const throwAngle = fighter.throwPhase > 0 ? (fighter.throwPhase < 8 ? -0.85 : 0.95) : 0;

    ctx.beginPath();
    if (isLeft) {
      ctx.moveTo(-12, -26);
      ctx.lineTo(-24, -20);
      ctx.moveTo(12, -26);
      const rightArmAngle = 0.2 + throwAngle;
      ctx.lineTo(12 + Math.cos(rightArmAngle) * 18, -26 + Math.sin(rightArmAngle) * 18);
    } else {
      ctx.moveTo(12, -26);
      ctx.lineTo(24, -20);
      ctx.moveTo(-12, -26);
      const leftArmAngle = Math.PI - 0.2 - throwAngle;
      ctx.lineTo(-12 + Math.cos(leftArmAngle) * 18, -26 + Math.sin(leftArmAngle) * 18);
    }
    ctx.stroke();

    ctx.restore();

    ctx.save();
    ctx.translate(fighter.x + shakeX, fighter.y - victoryHop);

    const heartSpacing = 14;
    const startHeartX = -((fighter.maxHealth - 1) * heartSpacing) / 2;
    const heartY = -72 - (fighter.isWinner ? 10 : 0);

    for (let h = 0; h < fighter.maxHealth; h++) {
      const hx = startHeartX + h * heartSpacing;
      const isFilled = h < fighter.health;
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(isFilled ? "❤️" : "🤍", hx, heartY);
    }

    if (fighter.speechText) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.beginPath();
      ctx.roundRect(-50, heartY - 26, 100, 22, 6);
      ctx.fill();

      ctx.strokeStyle = teamColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#263238";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(fighter.speechText, 0, heartY - 11);
    }

    ctx.restore();
  }
}

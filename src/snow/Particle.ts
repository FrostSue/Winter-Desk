export class Snowflake {
  public x: number;
  public y: number;
  public radius: number;
  public baseSpeed: number;
  public currentSpeed: number;
  public opacity: number;
  public swayPhase: number;
  public swaySpeed: number;
  public swayAmplitude: number;

  constructor(width: number, height: number, spawnAtTop = false) {
    this.x = Math.random() * width;
    this.y = spawnAtTop ? -10 - Math.random() * 20 : Math.random() * height;
    this.radius = 1 + Math.random() * 2.5;
    this.baseSpeed = 0.8 + Math.random() * 2.2;
    this.currentSpeed = this.baseSpeed;
    this.opacity = 0.4 + Math.random() * 0.6;
    this.swayPhase = Math.random() * Math.PI * 2;
    this.swaySpeed = 0.01 + Math.random() * 0.03;
    this.swayAmplitude = 0.5 + Math.random() * 1.5;
  }

  public update(width: number, height: number, wind: number, speedMultiplier: number): boolean {
    this.swayPhase += this.swaySpeed;
    const sway = Math.sin(this.swayPhase) * this.swayAmplitude;

    this.x += wind + sway;
    this.y += this.baseSpeed * speedMultiplier;

    if (this.x < -20) {
      this.x = width + 10;
    } else if (this.x > width + 20) {
      this.x = -10;
    }

    if (this.y > height + 10) {
      this.reset(width);
      return true;
    }
    return false;
  }

  public reset(width: number): void {
    this.x = Math.random() * width;
    this.y = -10 - Math.random() * 20;
    this.radius = 1 + Math.random() * 2.5;
    this.baseSpeed = 0.8 + Math.random() * 2.2;
    this.opacity = 0.4 + Math.random() * 0.6;
    this.swayPhase = Math.random() * Math.PI * 2;
  }
}

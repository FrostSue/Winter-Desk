export class SnowAccumulator {
  private heights: Float32Array;
  private width: number;
  private columnWidth: number;
  private maxDepth: number;
  private decayRate: number;

  constructor(width: number, columnWidth = 4, maxDepth = 24) {
    this.width = width;
    this.columnWidth = columnWidth;
    this.maxDepth = maxDepth;
    this.decayRate = 0.002;
    const numColumns = Math.ceil(width / columnWidth);
    this.heights = new Float32Array(numColumns);
  }

  public resize(newWidth: number): void {
    this.width = newWidth;
    const numColumns = Math.ceil(newWidth / this.columnWidth);
    const oldHeights = this.heights;
    this.heights = new Float32Array(numColumns);
    const copyLen = Math.min(oldHeights.length, numColumns);
    for (let i = 0; i < copyLen; i++) {
      this.heights[i] = oldHeights[i];
    }
  }

  public deposit(x: number, amount = 0.4): void {
    if (x < 0 || x >= this.width) return;
    const col = Math.floor(x / this.columnWidth);
    if (col < 0 || col >= this.heights.length) return;

    if (this.heights[col] < this.maxDepth) {
      this.heights[col] += amount;
      if (col > 0) this.heights[col - 1] += amount * 0.45;
      if (col < this.heights.length - 1) this.heights[col + 1] += amount * 0.45;
      if (col > 1) this.heights[col - 2] += amount * 0.2;
      if (col < this.heights.length - 2) this.heights[col + 2] += amount * 0.2;
    }
  }

  public clearRange(startX: number, endX: number): void {
    const minCol = Math.max(0, Math.floor(startX / this.columnWidth));
    const maxCol = Math.min(this.heights.length - 1, Math.ceil(endX / this.columnWidth));
    for (let col = minCol; col <= maxCol; col++) {
      this.heights[col] = Math.max(0, this.heights[col] - 3.0);
    }
  }

  public clearRangeResidual(startX: number, endX: number, minResidual = 2.2, amount = 2.6): number {
    const minCol = Math.max(0, Math.floor(startX / this.columnWidth));
    const maxCol = Math.min(this.heights.length - 1, Math.ceil(endX / this.columnWidth));
    let collected = 0;
    for (let col = minCol; col <= maxCol; col++) {
      const prev = this.heights[col];
      if (prev > minResidual) {
        this.heights[col] = Math.max(minResidual, this.heights[col] - amount);
        collected += prev - this.heights[col];
      }
    }
    return collected;
  }

  public update(): void {
    for (let i = 0; i < this.heights.length; i++) {
      if (this.heights[i] > 0) {
        this.heights[i] = Math.max(0, this.heights[i] - this.decayRate);
      }
    }
  }

  public getSnowHeight(x: number): number {
    const col = Math.floor(x / this.columnWidth);
    if (col < 0 || col >= this.heights.length) return 0;
    return this.heights[col];
  }

  public draw(ctx: CanvasRenderingContext2D, baseY: number): void {
    if (this.heights.length === 0) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, baseY);

    for (let i = 0; i < this.heights.length; i++) {
      const x = i * this.columnWidth;
      const h = this.heights[i];
      const y = baseY - h;

      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        const prevX = (i - 1) * this.columnWidth;
        const prevY = baseY - this.heights[i - 1];
        const midX = (prevX + x) / 2;
        const midY = (prevY + y) / 2;
        ctx.quadraticCurveTo(prevX, prevY, midX, midY);
      }
    }

    ctx.lineTo(this.width, baseY);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, baseY - this.maxDepth, 0, baseY);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    gradient.addColorStop(0.7, "rgba(240, 245, 255, 0.90)");
    gradient.addColorStop(1, "rgba(220, 235, 255, 0.85)");

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }
}

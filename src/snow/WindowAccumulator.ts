export class WindowAccumulator {
  private heights: Float32Array;
  private driftNoise: Float32Array;
  public width: number;
  public columnWidth: number;
  public maxDepth: number;
  private decayRate: number;

  constructor(width: number, columnWidth = 5, initialDepth = 0.0, maxDepth = 14) {
    this.width = width;
    this.columnWidth = columnWidth;
    this.maxDepth = maxDepth;
    this.decayRate = 0.0003;
    const numColumns = Math.max(1, Math.ceil(width / columnWidth));
    this.heights = new Float32Array(numColumns);
    this.driftNoise = new Float32Array(numColumns);
    this.initDriftNoise();

    if (initialDepth > 0) {
      for (let i = 0; i < numColumns; i++) {
        const edgeTaper = this.getEdgeTaper(i);
        const baseline = (initialDepth + this.driftNoise[i] * 2.2) * edgeTaper;
        this.heights[i] = Math.max(0, Math.min(maxDepth * edgeTaper, baseline));
      }
    }
  }

  private initDriftNoise(): void {
    const len = this.driftNoise.length;
    for (let i = 0; i < len; i++) {
      const freq1 = Math.sin(i * 0.18);
      const freq2 = Math.cos(i * 0.065);
      const freq3 = Math.sin(i * 0.42);
      this.driftNoise[i] = freq1 * 0.55 + freq2 * 0.35 + freq3 * 0.2;
    }
  }

  public getEdgeTaper(colIndex: number): number {
    const totalCols = this.heights.length;
    const distFromBorder = Math.min(colIndex, totalCols - 1 - colIndex);
    const taperCols = 6;
    if (distFromBorder <= 0) return 0;
    if (distFromBorder >= taperCols) return 1.0;
    return Math.sin((distFromBorder / taperCols) * (Math.PI / 2));
  }

  public resize(newWidth: number): void {
    const newNumColumns = Math.max(1, Math.ceil(newWidth / this.columnWidth));
    const newHeights = new Float32Array(newNumColumns);
    const copyLen = Math.min(this.heights.length, newNumColumns);
    for (let i = 0; i < copyLen; i++) {
      newHeights[i] = this.heights[i];
    }
    this.heights = newHeights;
    this.driftNoise = new Float32Array(newNumColumns);
    this.width = newWidth;
    this.initDriftNoise();
  }

  public deposit(localX: number, amount = 0.5): void {
    const col = Math.floor(localX / this.columnWidth);
    if (col < 0 || col >= this.heights.length) return;

    const edgeFactor = this.getEdgeTaper(col);
    if (edgeFactor <= 0.02) return;

    const allowedMax = (this.maxDepth + this.driftNoise[col] * 2.0) * edgeFactor;
    if (this.heights[col] < allowedMax) {
      this.heights[col] = Math.min(allowedMax, this.heights[col] + amount * edgeFactor);

      if (col > 0) {
        const leftFactor = this.getEdgeTaper(col - 1);
        const leftMax = (this.maxDepth + this.driftNoise[col - 1] * 2.0) * leftFactor;
        this.heights[col - 1] = Math.min(leftMax, this.heights[col - 1] + amount * 0.55 * leftFactor);
      }
      if (col < this.heights.length - 1) {
        const rightFactor = this.getEdgeTaper(col + 1);
        const rightMax = (this.maxDepth + this.driftNoise[col + 1] * 2.0) * rightFactor;
        this.heights[col + 1] = Math.min(rightMax, this.heights[col + 1] + amount * 0.55 * rightFactor);
      }
      if (col > 1) {
        const left2Factor = this.getEdgeTaper(col - 2);
        const left2Max = (this.maxDepth + this.driftNoise[col - 2] * 2.0) * left2Factor;
        this.heights[col - 2] = Math.min(left2Max, this.heights[col - 2] + amount * 0.25 * left2Factor);
      }
      if (col < this.heights.length - 2) {
        const right2Factor = this.getEdgeTaper(col + 2);
        const right2Max = (this.maxDepth + this.driftNoise[col + 2] * 2.0) * right2Factor;
        this.heights[col + 2] = Math.min(right2Max, this.heights[col + 2] + amount * 0.25 * right2Factor);
      }
    }
  }

  public clearRange(localStartX: number, localEndX: number, amount = 2.4): number {
    const minCol = Math.max(0, Math.floor(localStartX / this.columnWidth));
    const maxCol = Math.min(this.heights.length - 1, Math.ceil(localEndX / this.columnWidth));
    const centerCol = (minCol + maxCol) / 2;
    const radiusCols = Math.max(1, (maxCol - minCol) / 2);
    let cleared = 0;

    for (let c = minCol; c <= maxCol; c++) {
      const prev = this.heights[c];
      const distFromCenter = Math.abs(c - centerCol) / radiusCols;
      const carveFactor = Math.max(0.2, 1.0 - distFromCenter * distFromCenter);
      const deduction = amount * carveFactor;
      this.heights[c] = Math.max(0, this.heights[c] - deduction);
      cleared += prev - this.heights[c];
    }
    return cleared;
  }

  public getHeight(localX: number): number {
    const col = Math.floor(localX / this.columnWidth);
    if (col < 0 || col >= this.heights.length) return 0;
    return this.heights[col];
  }

  public getMaxHeightInRange(localStartX: number, localEndX: number): number {
    const minCol = Math.max(0, Math.floor(localStartX / this.columnWidth));
    const maxCol = Math.min(this.heights.length - 1, Math.ceil(localEndX / this.columnWidth));
    let maxH = 0;
    for (let c = minCol; c <= maxCol; c++) {
      if (this.heights[c] > maxH) maxH = this.heights[c];
    }
    return maxH;
  }

  public getAverageHeight(): number {
    if (this.heights.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < this.heights.length; i++) {
      sum += this.heights[i];
    }
    return sum / this.heights.length;
  }

  public getColumnHeights(): Float32Array {
    return this.heights;
  }

  public update(): void {
    for (let i = 0; i < this.heights.length; i++) {
      if (this.heights[i] > 0) {
        this.heights[i] = Math.max(0, this.heights[i] - this.decayRate);
      }
    }
  }
}

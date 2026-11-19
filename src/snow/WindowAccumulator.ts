export class WindowAccumulator {
  private heights: Float32Array;
  public width: number;
  public columnWidth: number;
  public maxDepth: number;
  private decayRate: number;

  constructor(width: number, columnWidth = 6, initialDepth = 0.0, maxDepth = 12) {
    this.width = width;
    this.columnWidth = columnWidth;
    this.maxDepth = maxDepth;
    this.decayRate = 0.0004;
    const numColumns = Math.max(1, Math.ceil(width / columnWidth));
    this.heights = new Float32Array(numColumns);
    if (initialDepth > 0) {
      for (let i = 0; i < numColumns; i++) {
        this.heights[i] = Math.max(
          0,
          Math.min(maxDepth, initialDepth + Math.sin(i * 0.35) * 0.5 + (Math.random() - 0.5) * 0.3)
        );
      }
    }
  }

  public resize(newWidth: number): void {
    const newNumColumns = Math.max(1, Math.ceil(newWidth / this.columnWidth));
    const newHeights = new Float32Array(newNumColumns);
    const copyLen = Math.min(this.heights.length, newNumColumns);
    for (let i = 0; i < copyLen; i++) {
      newHeights[i] = this.heights[i];
    }
    this.heights = newHeights;
    this.width = newWidth;
  }

  public deposit(localX: number, amount = 0.35): void {
    const col = Math.floor(localX / this.columnWidth);
    if (col < 0 || col >= this.heights.length) return;
    if (this.heights[col] < this.maxDepth) {
      this.heights[col] += amount;
      if (col > 0) this.heights[col - 1] += amount * 0.5;
      if (col < this.heights.length - 1) this.heights[col + 1] += amount * 0.5;
      if (col > 1) this.heights[col - 2] += amount * 0.2;
      if (col < this.heights.length - 2) this.heights[col + 2] += amount * 0.2;
    }
  }

  public clearRange(localStartX: number, localEndX: number, amount = 2.0): number {
    const minCol = Math.max(0, Math.floor(localStartX / this.columnWidth));
    const maxCol = Math.min(this.heights.length - 1, Math.ceil(localEndX / this.columnWidth));
    let cleared = 0;
    for (let c = minCol; c <= maxCol; c++) {
      const prev = this.heights[c];
      this.heights[c] = Math.max(0, this.heights[c] - amount);
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

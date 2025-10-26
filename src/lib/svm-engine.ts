import { DataPoint } from "@/data/datasets";

export interface SVMResult {
  supportVectors: number[]; // indices of support vectors
  accuracy: number;
  precision: number;
  recall: number;
  confusionMatrix: {
    truePositive: number;
    falsePositive: number;
    trueNegative: number;
    falseNegative: number;
  };
  boundaryPoints: { x: number; y: number; value: number }[];
  margins: { upper: { x: number; y: number }[]; lower: { x: number; y: number }[] };
}

/**
 * Simplified SVM engine for client-side visualization
 * This simulates SVM behavior for educational purposes
 */
export class SimpleSVMEngine {
  private data: DataPoint[];
  private C: number;
  private gamma: number;
  private kernel: 'linear' | 'polynomial' | 'rbf' | 'sigmoid';

  constructor(
    data: DataPoint[],
    C: number,
    gamma: number,
    kernel: 'linear' | 'polynomial' | 'rbf' | 'sigmoid'
  ) {
    this.data = data;
    this.C = C;
    this.gamma = gamma;
    this.kernel = kernel;
  }

  /**
   * Train SVM and return results
   */
  train(): SVMResult {
    // Separate classes
    const positive = this.data.filter(d => d.label === 1);
    const negative = this.data.filter(d => d.label === 0);

    // Find approximate decision boundary
    const supportVectors = this.findSupportVectors(positive, negative);
    
    // Calculate metrics
    const predictions = this.data.map(d => this.predict(d));
    const metrics = this.calculateMetrics(predictions);

    // Generate boundary visualization
    const boundaryPoints = this.generateBoundary();
    const margins = this.generateMargins(boundaryPoints);

    return {
      supportVectors,
      ...metrics,
      boundaryPoints,
      margins,
    };
  }

  /**
   * Find support vectors (points near the decision boundary)
   */
  private findSupportVectors(positive: DataPoint[], negative: DataPoint[]): number[] {
    const svIndices: number[] = [];
    
    // Find center of mass for each class
    const posCenter = this.centerOfMass(positive);
    const negCenter = this.centerOfMass(negative);

    // Find points closest to the decision boundary
    this.data.forEach((point, idx) => {
      const distToPos = this.distance(point, posCenter);
      const distToNeg = this.distance(point, negCenter);
      const ratio = Math.abs(distToPos - distToNeg) / (distToPos + distToNeg);

      // Points with small ratio are near the boundary
      if (ratio < 0.3) {
        svIndices.push(idx);
      }
    });

    // Ensure we have at least a few SVs
    if (svIndices.length < 3) {
      // Add some edge points
      const sorted = this.data
        .map((d, idx) => ({ d, idx }))
        .sort((a, b) => {
          const distA = Math.abs(
            this.distance(a.d, posCenter) - this.distance(a.d, negCenter)
          );
          const distB = Math.abs(
            this.distance(b.d, posCenter) - this.distance(b.d, negCenter)
          );
          return distA - distB;
        });
      
      return sorted.slice(0, Math.min(10, Math.floor(this.data.length * 0.15))).map(s => s.idx);
    }

    return svIndices.slice(0, Math.min(15, svIndices.length));
  }

  /**
   * Predict class for a point
   */
  private predict(point: DataPoint): number {
    const positive = this.data.filter(d => d.label === 1);
    const negative = this.data.filter(d => d.label === 0);

    const posCenter = this.centerOfMass(positive);
    const negCenter = this.centerOfMass(negative);

    const score = this.decisionFunction(point, posCenter, negCenter);
    return score >= 0 ? 1 : 0;
  }

  /**
   * Decision function based on kernel
   */
  private decisionFunction(point: DataPoint, posCenter: DataPoint, negCenter: DataPoint): number {
    const distToPos = this.kernelDistance(point, posCenter);
    const distToNeg = this.kernelDistance(point, negCenter);

    // Adjust based on C parameter (strictness)
    const weight = Math.tanh(this.C * 0.5);
    return (distToNeg - distToPos) * (1 + weight * 0.5);
  }

  /**
   * Kernel-specific distance
   */
  private kernelDistance(p1: DataPoint, p2: DataPoint): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;

    switch (this.kernel) {
      case 'linear':
        return Math.sqrt(dx * dx + dy * dy);
      
      case 'polynomial':
        const linear = dx * dx + dy * dy;
        return Math.pow(linear + 1, 2);
      
      case 'rbf':
        return Math.exp(-this.gamma * (dx * dx + dy * dy));
      
      case 'sigmoid':
        return Math.tanh(this.gamma * (dx * dx + dy * dy) + 1);
      
      default:
        return Math.sqrt(dx * dx + dy * dy);
    }
  }

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(predictions: number[]): {
    accuracy: number;
    precision: number;
    recall: number;
    confusionMatrix: {
      truePositive: number;
      falsePositive: number;
      trueNegative: number;
      falseNegative: number;
    };
  } {
    let tp = 0, fp = 0, tn = 0, fn = 0;

    this.data.forEach((d, idx) => {
      const pred = predictions[idx];
      const actual = d.label;

      if (pred === 1 && actual === 1) tp++;
      else if (pred === 1 && actual === 0) fp++;
      else if (pred === 0 && actual === 0) tn++;
      else if (pred === 0 && actual === 1) fn++;
    });

    const accuracy = (tp + tn) / this.data.length;
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;

    return {
      accuracy,
      precision,
      recall,
      confusionMatrix: { truePositive: tp, falsePositive: fp, trueNegative: tn, falseNegative: fn },
    };
  }

  /**
   * Generate decision boundary points for visualization
   */
  private generateBoundary(): { x: number; y: number; value: number }[] {
    const xMin = Math.min(...this.data.map(d => d.x));
    const xMax = Math.max(...this.data.map(d => d.x));
    const yMin = Math.min(...this.data.map(d => d.y));
    const yMax = Math.max(...this.data.map(d => d.y));

    const points: { x: number; y: number; value: number }[] = [];
    const resolution = 40;

    const positive = this.data.filter(d => d.label === 1);
    const negative = this.data.filter(d => d.label === 0);
    const posCenter = this.centerOfMass(positive);
    const negCenter = this.centerOfMass(negative);

    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const x = xMin + (i / resolution) * (xMax - xMin);
        const y = yMin + (j / resolution) * (yMax - yMin);
        const point = { x, y, label: 0 as 0 | 1 };
        
        const value = this.decisionFunction(point, posCenter, negCenter);
        points.push({ x, y, value });
      }
    }

    return points;
  }

  /**
   * Generate margin boundaries
   */
  private generateMargins(boundaryPoints: { x: number; y: number; value: number }[]): {
    upper: { x: number; y: number }[];
    lower: { x: number; y: number }[];
  } {
    // Find points near the decision boundary (value ≈ 0)
    const boundary = boundaryPoints
      .filter(p => Math.abs(p.value) < 0.5)
      .sort((a, b) => a.x - b.x);

    // Margins are offset from the boundary
    const marginWidth = 1.0 / (this.C + 0.5); // Larger C = smaller margin

    const upper = boundary.map(p => ({
      x: p.x,
      y: p.y + marginWidth * (Math.max(...this.data.map(d => d.y)) - Math.min(...this.data.map(d => d.y))) * 0.05
    }));

    const lower = boundary.map(p => ({
      x: p.x,
      y: p.y - marginWidth * (Math.max(...this.data.map(d => d.y)) - Math.min(...this.data.map(d => d.y))) * 0.05
    }));

    return { upper, lower };
  }

  /**
   * Helper: Calculate center of mass
   */
  private centerOfMass(points: DataPoint[]): DataPoint {
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return {
      x: sum.x / points.length,
      y: sum.y / points.length,
      label: 0,
    };
  }

  /**
   * Helper: Euclidean distance
   */
  private distance(p1: DataPoint | { x: number; y: number }, p2: DataPoint | { x: number; y: number }): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

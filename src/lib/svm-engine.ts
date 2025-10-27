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
  private polynomialDegree: number;

  constructor(
    data: DataPoint[],
    C: number,
    gamma: number,
    kernel: 'linear' | 'polynomial' | 'rbf' | 'sigmoid',
    polynomialDegree: number = 2
  ) {
    this.data = data;
    this.C = C;
    this.gamma = gamma;
    this.kernel = kernel;
    this.polynomialDegree = polynomialDegree;
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

    // For linear kernel, find points closest to the decision boundary line
    if (this.kernel === 'linear') {
      // Calculate the decision boundary line equation based on class distribution
      const posStats = {
        x: positive.reduce((sum, p) => sum + p.x, 0) / positive.length,
        y: positive.reduce((sum, p) => sum + p.y, 0) / positive.length
      };
      
      const negStats = {
        x: negative.reduce((sum, p) => sum + p.x, 0) / negative.length,
        y: negative.reduce((sum, p) => sum + p.y, 0) / negative.length
      };
      
      // Calculate the optimal slope based on the data distribution
      const slope = -(posStats.y - negStats.y) / (posStats.x - negStats.x);
      
      // Calculate the intercept to position the line optimally
      const weight = 0.6; // Same weight as in visualization
      const midPoint = {
        x: negStats.x + weight * (posStats.x - negStats.x),
        y: negStats.y + weight * (posStats.y - negStats.y)
      };
      
      const intercept = midPoint.y - slope * midPoint.x;
      
      // Find points closest to the decision boundary line
      const pointsWithDistance = this.data.map((point, idx) => {
        // Distance from point to line: |ax + by + c| / sqrt(a^2 + b^2)
        // For line ax + by + c = 0, where a = slope, b = -1, c = intercept
        const a = slope;
        const b = -1;
        const c = intercept;
        const distance = Math.abs(a * point.x + b * point.y + c) / Math.sqrt(a * a + b * b);
        
        return { point, idx, distance };
      });
      
      // Sort by distance to boundary and take closest points
      pointsWithDistance.sort((a, b) => a.distance - b.distance);
      
      // Take points within a reasonable distance from the boundary
      // This ensures support vectors cluster near the decision boundary line
      const maxDistance = pointsWithDistance[Math.floor(pointsWithDistance.length * 0.25)].distance;
      const boundaryPoints = pointsWithDistance
        .filter(p => p.distance <= maxDistance)
        .slice(0, Math.min(12, Math.floor(this.data.length * 0.15)))
        .map(p => p.idx);
      
      return boundaryPoints;
    }

    // For polynomial kernel, find points near the curved decision boundary
    if (this.kernel === 'polynomial') {
      // Calculate class centers
      const posCenter = {
        x: positive.reduce((sum, p) => sum + p.x, 0) / positive.length,
        y: positive.reduce((sum, p) => sum + p.y, 0) / positive.length
      };
      const negCenter = {
        x: negative.reduce((sum, p) => sum + p.x, 0) / negative.length,
        y: negative.reduce((sum, p) => sum + p.y, 0) / negative.length
      };
      
      // Find points that are close to the decision boundary
      const pointsWithDistance = this.data.map((point, idx) => {
        // Calculate distance to the decision boundary based on polynomial degree
        let distanceToBoundary;
        
        if (this.polynomialDegree === 1) {
          // Linear boundary: distance to line
          // Find the optimal separating line by analyzing the data distribution
          
          // Get the minimum y-coordinate of blue points and maximum y-coordinate of orange points
          const minBlueY = Math.min(...positive.map(p => p.y));
          const maxOrangeY = Math.max(...negative.map(p => p.y));
          
          // Calculate the slope between class centers
          const slope = (posCenter.y - negCenter.y) / (posCenter.x - negCenter.x);
          
          // Find the x-coordinate where we want to place the separating line
          const separatingX = (posCenter.x + negCenter.x) / 2;
          
          // Calculate the y-coordinate for the separating line
          // Position it to ensure complete separation with a small margin
          const margin = (minBlueY - maxOrangeY) * 0.1; // 10% margin for safety
          const separatingY = maxOrangeY + (minBlueY - maxOrangeY) / 2 + margin;
          
          // Calculate the intercept
          const intercept = separatingY - slope * separatingX;
          
          // Calculate distance to the line: |ax + by + c| / sqrt(a^2 + b^2)
          // For line ax + by + c = 0, where a = slope, b = -1, c = intercept
          const a = slope;
          const b = -1;
          const c = intercept;
          distanceToBoundary = Math.abs(a * point.x + b * point.y + c) / Math.sqrt(a * a + b * b);
        } else if (this.polynomialDegree === 2) {
          // Quadratic boundary: distance to parabolic curve
          const midX = (posCenter.x + negCenter.x) / 2;
          const midY = (posCenter.y + negCenter.y) / 2;
          const xRange = Math.max(...this.data.map(d => d.x)) - Math.min(...this.data.map(d => d.x));
          const yRange = Math.max(...this.data.map(d => d.y)) - Math.min(...this.data.map(d => d.y));
          const amplitude = yRange * 0.2;
          const offset = (point.x - midX) / (xRange * 0.5);
          const expectedY = midY + amplitude * Math.sin(offset * Math.PI) + (point.x - midX) * 0.2;
          distanceToBoundary = Math.abs(point.y - expectedY);
        } else {
          // Cubic boundary: distance to wiggly curve
          const midX = (posCenter.x + negCenter.x) / 2;
          const midY = (posCenter.y + negCenter.y) / 2;
          const xRange = Math.max(...this.data.map(d => d.x)) - Math.min(...this.data.map(d => d.x));
          const yRange = Math.max(...this.data.map(d => d.y)) - Math.min(...this.data.map(d => d.y));
          const amplitude = yRange * 0.25;
          const offset = (point.x - midX) / (xRange * 0.5);
          const expectedY = midY + 
            amplitude * Math.sin(offset * Math.PI * 2) + 
            amplitude * 0.3 * Math.sin(offset * Math.PI * 4) +
            (point.x - midX) * 0.3;
          distanceToBoundary = Math.abs(point.y - expectedY);
        }
        
        return { point, idx, distanceToBoundary };
      });
      
      // Sort by distance to boundary and take closest points
      pointsWithDistance.sort((a, b) => a.distanceToBoundary - b.distanceToBoundary);
      
      // Take points within a reasonable distance from the boundary
      // Use a smaller threshold to get points very close to the boundary
      const maxDistance = pointsWithDistance[Math.floor(pointsWithDistance.length * 0.2)].distanceToBoundary;
      const boundaryPoints = pointsWithDistance
        .filter(p => p.distanceToBoundary <= maxDistance)
        .slice(0, Math.min(12, Math.floor(this.data.length * 0.15)))
        .map(p => p.idx);
      
      return boundaryPoints;
    }

    // For RBF kernel, find points near the decision boundary
    if (this.kernel === 'rbf') {
      // Find points that are close to the decision boundary based on RBF decision function
      const pointsWithScore = this.data.map((point, idx) => {
        // Calculate the decision function score at this point's location
        const posInfluence = positive.reduce((sum, pos) => {
          const distSq = Math.pow(point.x - pos.x, 2) + Math.pow(point.y - pos.y, 2);
          return sum + Math.exp(-this.gamma * distSq);
        }, 0) / positive.length;
        
        const negInfluence = negative.reduce((sum, neg) => {
          const distSq = Math.pow(point.x - neg.x, 2) + Math.pow(point.y - neg.y, 2);
          return sum + Math.exp(-this.gamma * distSq);
        }, 0) / negative.length;
        
        const cAdjustment = 1 + (this.C - 1) * 0.2;
        // The decision function value (distance from zero = how far from boundary)
        const decisionValue = (posInfluence * cAdjustment) - negInfluence;
        // Score is the absolute distance from zero (smaller = closer to boundary)
        const score = Math.abs(decisionValue);
        
        return { point, idx, score, decisionValue };
      });
      
      // Sort by score (closer to zero means closer to boundary)
      pointsWithScore.sort((a, b) => a.score - b.score);
      
      // Take points closest to the boundary (where decision function is near zero)
      // Include both purple and gray points that are near the boundary
      const threshold = Math.max(0.3, pointsWithScore[Math.min(10, pointsWithScore.length - 1)]?.score || 0.3);
      const boundaryPoints = pointsWithScore
        .filter(p => p.score <= threshold) // Only points very close to boundary
        .slice(0, Math.min(20, Math.floor(this.data.length * 0.25)));
      
      // If we didn't find enough points, take more with relaxed criteria
      if (boundaryPoints.length < 8) {
        return pointsWithScore
          .slice(0, Math.min(20, Math.floor(this.data.length * 0.3)))
          .map(p => p.idx);
      }
      
      return boundaryPoints.map(p => p.idx);
    }

    // For sigmoid kernel, find points near the decision boundary
    if (this.kernel === 'sigmoid') {
      // Find points that are close to the decision boundary based on sigmoid decision function
      const pointsWithScore = this.data.map((point, idx) => {
        // Calculate the decision function score at this point's location
        let posInfluence = 0;
        positive.forEach(pos => {
          const dotProduct = point.x * pos.x + point.y * pos.y;
          posInfluence += Math.tanh(this.gamma * dotProduct + 1);
        });
        posInfluence /= positive.length;
        
        let negInfluence = 0;
        negative.forEach(neg => {
          const dotProduct = point.x * neg.x + point.y * neg.y;
          negInfluence += Math.tanh(this.gamma * dotProduct + 1);
        });
        negInfluence /= negative.length;
        
        const cAdjustment = 1 + (this.C - 1) * 0.15;
        const decisionValue = (posInfluence * cAdjustment) - negInfluence;
        const score = Math.abs(decisionValue);
        
        return { point, idx, score, decisionValue };
      });
      
      // Sort by score (closer to zero means closer to boundary)
      pointsWithScore.sort((a, b) => a.score - b.score);
      
      // Take points closest to the boundary (where decision function is near zero)
      const threshold = Math.max(0.3, pointsWithScore[Math.min(10, pointsWithScore.length - 1)]?.score || 0.3);
      const boundaryPoints = pointsWithScore
        .filter(p => p.score <= threshold)
        .slice(0, Math.min(20, Math.floor(this.data.length * 0.25)));
      
      if (boundaryPoints.length < 8) {
        return pointsWithScore
          .slice(0, Math.min(20, Math.floor(this.data.length * 0.3)))
          .map(p => p.idx);
      }
      
      return boundaryPoints.map(p => p.idx);
    }

    // For other non-linear kernels, use the original method
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
        return Math.pow(linear + 1, this.polynomialDegree);
      
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

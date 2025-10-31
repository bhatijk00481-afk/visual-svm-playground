import { useState, useEffect } from "react";
import { Dataset } from "@/data/datasets";
import { Card } from "@/components/ui/card";
import { SVMResult } from "@/lib/svm-engine";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, LineChart, ComposedChart } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface SVMVisualizationProps {
  dataset: Dataset;
  result: SVMResult;
  C: number;
  gamma: number;
  polynomialDegree?: number;
}

export const SVMVisualization = ({ dataset, result, C, gamma, polynomialDegree = 2 }: SVMVisualizationProps) => {
  const [showSupportVectors, setShowSupportVectors] = useState(true);
  const [showMargins, setShowMargins] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const isLoan = dataset.id === 'loan';

  // Keep support vectors visible across dataset changes
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setShowSupportVectors(true);
  }, [dataset.id]);

  // Prepare data for Recharts
  const positiveData = dataset.data.filter(d => d.label === 1);
  const negativeData = dataset.data.filter(d => d.label === 0);

  // For the loan dataset, ignore important cases (support vectors) in boundary calculation
  const supportSet = new Set(result.supportVectors);
  const boundaryPositiveData = isLoan
    ? dataset.data.filter((d, i) => d.label === 1 && !supportSet.has(i))
    : positiveData;
  const boundaryNegativeData = isLoan
    ? dataset.data.filter((d, i) => d.label === 0 && !supportSet.has(i))
    : negativeData;
  
  // Get support vectors
  const supportVectorAll = result.supportVectors.map(idx => dataset.data[idx]);
  const supportVectorPos = supportVectorAll.filter(p => p.label === 1);
  const supportVectorNeg = supportVectorAll.filter(p => p.label === 0);

  // NOTE: loan SV positions will be computed after decisionBoundaryLine is available

  // Calculate decision boundary line for linear kernel
  const getDecisionBoundaryLine = () => {
    if (dataset.kernel !== 'linear') return [];
    
    const xMin = Math.min(...dataset.data.map(d => d.x));
    const xMax = Math.max(...dataset.data.map(d => d.x));
    const yMin = Math.min(...dataset.data.map(d => d.y));
    const yMax = Math.max(...dataset.data.map(d => d.y));
    
    // Calculate the line equation: y = mx + b
    // For linear SVM, we create a line that separates the classes based on their distribution
    
    // Find the optimal separating line by analyzing the data distribution
    // We want a line that minimizes misclassification
    
    // Calculate class statistics
    const posStats = {
      x: boundaryPositiveData.reduce((sum, p) => sum + p.x, 0) / Math.max(1, boundaryPositiveData.length),
      y: boundaryPositiveData.reduce((sum, p) => sum + p.y, 0) / Math.max(1, boundaryPositiveData.length),
      xStd: Math.sqrt(boundaryPositiveData.reduce((sum, p) => sum + Math.pow(p.x - (boundaryPositiveData.reduce((s, pt) => s + pt.x, 0) / Math.max(1, boundaryPositiveData.length)), 2), 0) / Math.max(1, boundaryPositiveData.length)),
      yStd: Math.sqrt(boundaryPositiveData.reduce((sum, p) => sum + Math.pow(p.y - (boundaryPositiveData.reduce((s, pt) => s + pt.y, 0) / Math.max(1, boundaryPositiveData.length)), 2), 0) / Math.max(1, boundaryPositiveData.length))
    };
    
    const negStats = {
      x: boundaryNegativeData.reduce((sum, p) => sum + p.x, 0) / Math.max(1, boundaryNegativeData.length),
      y: boundaryNegativeData.reduce((sum, p) => sum + p.y, 0) / Math.max(1, boundaryNegativeData.length),
      xStd: Math.sqrt(boundaryNegativeData.reduce((sum, p) => sum + Math.pow(p.x - (boundaryNegativeData.reduce((s, pt) => s + pt.x, 0) / Math.max(1, boundaryNegativeData.length)), 2), 0) / Math.max(1, boundaryNegativeData.length)),
      yStd: Math.sqrt(boundaryNegativeData.reduce((sum, p) => sum + Math.pow(p.y - (boundaryNegativeData.reduce((s, pt) => s + pt.y, 0) / Math.max(1, boundaryNegativeData.length)), 2), 0) / Math.max(1, boundaryNegativeData.length))
    };
    
    // Calculate the optimal slope based on the data distribution
    // For loan approval: higher income + better credit = approved
    // So we want a line with negative slope that separates high-income/high-credit from low-income/low-credit
    const slope = -(posStats.y - negStats.y) / Math.max(1e-6, (posStats.x - negStats.x));

    // For loan dataset: enforce strict linear separability with explicit margin
    if (isLoan) {
      const a = -slope;
      const b = 1;
      const norm = Math.sqrt(a * a + b * b);
      const yRange = yMax - yMin;
      const baseMargin = yRange * 0.03; // base perpendicular margin target
      const epsilon = yRange * 0.001; // ensure strict >, not equality

      // Candidate margin to try (adaptive backoff if infeasible)
      // Smaller C -> larger margin; Larger C -> smaller margin
      const cFactor = 1 + (1 / Math.max(0.1, C)) * 2;
      let m = baseMargin * cFactor + epsilon;

      // Precompute projections a*x + b*y
      const posProj = boundaryPositiveData.map(p => a * p.x + b * p.y);
      const negProj = boundaryNegativeData.map(p => a * p.x + b * p.y);

      // Find feasible intercept range for given m:
      // For all pos: (proj + c)/norm >= m  => c >= m*norm - proj
      // For all neg: (proj + c)/norm <= -m => c <= -m*norm - proj
      const computeBounds = (margin: number) => {
        const lower = Math.max(...posProj.map(v => margin * norm - v));
        const upper = Math.min(...negProj.map(v => -margin * norm - v));
        return { lower, upper };
      };

      let { lower, upper } = computeBounds(m);
      let attempts = 0;
      while (lower > upper && attempts < 10) {
        // Not feasible; reduce margin and retry
        m *= 0.8;
        ({ lower, upper } = computeBounds(m));
        attempts++;
      }

      // Choose c within feasible range; take midpoint for balanced separation
      const cChosen = (lower + upper) / 2;
      const adjustedIntercept = -cChosen;

      // Generate points for the boundary with enforced margin
      const linePoints = [] as { x: number; y: number }[];
      for (let x = xMin; x <= xMax; x += (xMax - xMin) / 50) {
        const y = slope * x + adjustedIntercept;
        linePoints.push({ x, y });
      }
      // Store the enforced margin into a property on function (closure) for margin drawing
      // @ts-ignore
      (getDecisionBoundaryLine as any)._loanMargin = m;
      return linePoints;
    }

    // Non-loan datasets: original heuristic with light adjustment
    const weight = 0.6;
    const midPoint = {
      x: negStats.x + weight * (posStats.x - negStats.x),
      y: negStats.y + weight * (posStats.y - negStats.y)
    };
    let intercept = midPoint.y - slope * midPoint.x;
    const yRange = yMax - yMin;
    const adjustment = (C - 1) * yRange * 0.03;
    let adjustedIntercept = intercept + adjustment;
    
    // Generate line points that span the entire plot area
    const linePoints = [];
    for (let x = xMin; x <= xMax; x += (xMax - xMin) / 50) {
      const y = slope * x + adjustedIntercept;
      // Extend the line beyond the plot area for better visualization
      if (y >= yMin - yRange * 0.1 && y <= yMax + yRange * 0.1) {
        linePoints.push({ x, y });
      }
    }
    
    return linePoints;
  };

  // Calculate margin lines for linear kernel
  const getMarginLines = () => {
    if (dataset.kernel !== 'linear' || !showMargins) return { upper: [], lower: [] };
    
    const boundaryLine = getDecisionBoundaryLine();
    if (boundaryLine.length === 0) return { upper: [], lower: [] };
    
    // Calculate margin width
    // For loan dataset, lock margin to the enforced perpendicular distance
    const yRange = Math.max(...dataset.data.map(d => d.y)) - Math.min(...dataset.data.map(d => d.y));
    let marginWidth: number;
    if (isLoan) {
      // @ts-ignore
      const enforced = (getDecisionBoundaryLine as any)._loanMargin as number | undefined;
      marginWidth = enforced ?? yRange * 0.03;
    } else {
      const baseMargin = yRange * 0.08;
      marginWidth = baseMargin / (C + 0.1);
    }
    
    // Calculate the slope of the decision boundary line
    const posStats = {
      x: positiveData.reduce((sum, p) => sum + p.x, 0) / positiveData.length,
      y: positiveData.reduce((sum, p) => sum + p.y, 0) / positiveData.length
    };
    const negStats = {
      x: negativeData.reduce((sum, p) => sum + p.x, 0) / negativeData.length,
      y: negativeData.reduce((sum, p) => sum + p.y, 0) / negativeData.length
    };
    const slope = -(posStats.y - negStats.y) / (posStats.x - negStats.x);
    
    // Calculate perpendicular distance for the margin lines
    // The perpendicular slope is -1/slope
    const perpSlope = -1 / slope;
    const perpAngle = Math.atan(perpSlope);
    
    const upper = boundaryLine.map(point => ({
      x: point.x + marginWidth * Math.cos(perpAngle),
      y: point.y + marginWidth * Math.sin(perpAngle)
    }));
    
    const lower = boundaryLine.map(point => ({
      x: point.x - marginWidth * Math.cos(perpAngle),
      y: point.y - marginWidth * Math.sin(perpAngle)
    }));
    
    return { upper, lower };
  };

  // Calculate RBF decision boundary (freehand contour tightly enclosing positive cluster)
  const getRBFDecisionBoundary = () => {
    if (dataset.kernel !== 'rbf') return [];

    const pts = positiveData.map(p => ({ x: p.x, y: p.y }));
    if (pts.length < 3) return pts;

    // Monotone chain convex hull
    const sorted = [...pts].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
    const cross = (o: any, a: any, b: any) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower: any[] = [];
    for (const p of sorted) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
      lower.push(p);
    }
    const upper: any[] = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
      upper.push(p);
    }
    let hull = lower.slice(0, lower.length - 1).concat(upper.slice(0, upper.length - 1));

    // Expand hull slightly from centroid to avoid clipping edge points, keep minimal empty space
    const centroid = {
      x: hull.reduce((s, p) => s + p.x, 0) / hull.length,
      y: hull.reduce((s, p) => s + p.y, 0) / hull.length,
    };
    const inflate = 1.02; // very small expansion (~2%)
    hull = hull.map(p => ({ x: centroid.x + (p.x - centroid.x) * inflate, y: centroid.y + (p.y - centroid.y) * inflate }));

    // Chaikin smoothing to get freehand-like contour
    const chaikin = (poly: { x: number; y: number }[]) => {
      const sm: { x: number; y: number }[] = [];
      for (let i = 0; i < poly.length; i++) {
        const p0 = poly[i];
        const p1 = poly[(i + 1) % poly.length];
        const Q = { x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y };
        const R = { x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y };
        sm.push(Q, R);
      }
      return sm;
    };
    let boundary = hull;
    const iterations = 2;
    for (let i = 0; i < iterations; i++) boundary = chaikin(boundary);

    return boundary;
  };

  // Negative class freehand contour (occasional shoppers)
  const getRBFNegativeBoundary = () => {
    if (dataset.kernel !== 'rbf') return [];
    const pts = negativeData.map(p => ({ x: p.x, y: p.y }));
    if (pts.length < 3) return pts;
    const sorted = [...pts].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
    const cross = (o: any, a: any, b: any) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower: any[] = [];
    for (const p of sorted) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
      lower.push(p);
    }
    const upper: any[] = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
      upper.push(p);
    }
    let hull = lower.slice(0, lower.length - 1).concat(upper.slice(0, upper.length - 1));
    const centroid = { x: hull.reduce((s, p) => s + p.x, 0) / hull.length, y: hull.reduce((s, p) => s + p.y, 0) / hull.length };
    const inflate = 1.02;
    hull = hull.map(p => ({ x: centroid.x + (p.x - centroid.x) * inflate, y: centroid.y + (p.y - centroid.y) * inflate }));
    const chaikin = (poly: { x: number; y: number }[]) => {
      const sm: { x: number; y: number }[] = [];
      for (let i = 0; i < poly.length; i++) {
        const p0 = poly[i];
        const p1 = poly[(i + 1) % poly.length];
        const Q = { x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y };
        const R = { x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y };
        sm.push(Q, R);
      }
      return sm;
    };
    let boundary = hull;
    const iterations = 2;
    for (let i = 0; i < iterations; i++) boundary = chaikin(boundary);
    return boundary;
  };
  
  // Helper function to calculate RBF decision function at a point
  const calculateRBFDecisionFunction = (x: number, y: number): number => {
    // Calculate influence from positive class (loyal customers - purple)
    let posInfluence = 0;
    positiveData.forEach(point => {
      const dx = x - point.x;
      const dy = y - point.y;
      const distSq = dx * dx + dy * dy;
      // Gaussian kernel: exp(-gamma * dist^2)
      // Higher gamma = tighter influence (more detail)
      posInfluence += Math.exp(-gamma * distSq);
    });
    posInfluence /= positiveData.length;
    
    // Calculate influence from negative class (occasional shoppers - gray)
    let negInfluence = 0;
    negativeData.forEach(point => {
      const dx = x - point.x;
      const dy = y - point.y;
      const distSq = dx * dx + dy * dy;
      negInfluence += Math.exp(-gamma * distSq);
    });
    negInfluence /= negativeData.length;
    
    // Adjust the influence based on C (strictness)
    // Higher C means tighter boundaries (more strict classification)
    const cAdjustment = 1 + (C - 1) * 0.2;
    
    // Decision function: positive means loyal customer region, negative means occasional shopper region
    return (posInfluence * cAdjustment) - negInfluence;
  };

  // Calculate polynomial decision boundary for polynomial kernel
  const getPolynomialDecisionBoundary = () => {
    if (dataset.kernel !== 'polynomial') return [];
    
    const xMin = Math.min(...dataset.data.map(d => d.x));
    const xMax = Math.max(...dataset.data.map(d => d.x));
    const yMin = Math.min(...dataset.data.map(d => d.y));
    const yMax = Math.max(...dataset.data.map(d => d.y));
    
    // Extend the range to cover the whole plot
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const extendedXMin = xMin - xRange * 0.1;
    const extendedXMax = xMax + xRange * 0.1;
    const extendedYMin = yMin - yRange * 0.1;
    const extendedYMax = yMax + yRange * 0.1;
    
    // Calculate class centers
    const posCenter = {
      x: positiveData.reduce((sum, p) => sum + p.x, 0) / positiveData.length,
      y: positiveData.reduce((sum, p) => sum + p.y, 0) / positiveData.length
    };
    const negCenter = {
      x: negativeData.reduce((sum, p) => sum + p.x, 0) / negativeData.length,
      y: negativeData.reduce((sum, p) => sum + p.y, 0) / negativeData.length
    };
    
    // Create a boundary that separates the classes and covers the whole plot
    const boundaryPoints = [];
    const numPoints = 150;
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      let x, y;
      
      // Calculate x coordinate across the extended range
      x = extendedXMin + t * (extendedXMax - extendedXMin);
      
      if (polynomialDegree === 1) {
        // Degree 1 (linear): use the perpendicular bisector between class centers
        const dx = posCenter.x - negCenter.x;
        const dy = posCenter.y - negCenter.y;
        const midX = (posCenter.x + negCenter.x) / 2;
        const midY = (posCenter.y + negCenter.y) / 2;
        // Handle near-horizontal center vector (avoid infinite slope)
        const slope = Math.abs(dy) < 1e-6 ? 1e6 : -(dx / dy);
        const intercept = midY - slope * midX;
        y = slope * x + intercept;
      } else if (polynomialDegree === 2) {
        // Quadratic curve - parabola that separates the classes
        // Create a curve that goes between the two clusters
        const midX = (posCenter.x + negCenter.x) / 2;
        const midY = (posCenter.y + negCenter.y) / 2;
        const amplitude = yRange * 0.2;
        const offset = (x - midX) / (xRange * 0.5);
        y = midY + amplitude * Math.sin(offset * Math.PI) + (x - midX) * 0.2;
      } else {
        // Cubic curve - more complex wiggly boundary
        const midX = (posCenter.x + negCenter.x) / 2;
        const midY = (posCenter.y + negCenter.y) / 2;
        const amplitude = yRange * 0.25;
        const offset = (x - midX) / (xRange * 0.5);
        y = midY + 
            amplitude * Math.sin(offset * Math.PI * 2) + 
            amplitude * 0.3 * Math.sin(offset * Math.PI * 4) +
            (x - midX) * 0.3;
      }
      
      // Ensure points are within the extended bounds
      if (y >= extendedYMin && y <= extendedYMax) {
        boundaryPoints.push({ x, y });
      }
    }
    
    console.log(`Polynomial degree ${polynomialDegree}: Created ${boundaryPoints.length} boundary points`);
    return boundaryPoints;
  };

  // Calculate sigmoid decision boundary (S-shaped curve)
  const getSigmoidDecisionBoundary = () => {
    if (dataset.kernel !== 'sigmoid') return [];
    
    const xMin = Math.min(...dataset.data.map(d => d.x));
    const xMax = Math.max(...dataset.data.map(d => d.x));
    const yMin = Math.min(...dataset.data.map(d => d.y));
    const yMax = Math.max(...dataset.data.map(d => d.y));
    
    // Extend the range to cover the whole plot
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const extendedXMin = xMin - xRange * 0.2;
    const extendedXMax = xMax + xRange * 0.2;
    const extendedYMin = yMin - yRange * 0.2;
    const extendedYMax = yMax + yRange * 0.2;
    
    // Calculate class centers to determine S-curve inflection point
    const posCenter = {
      x: positiveData.reduce((sum, p) => sum + p.x, 0) / positiveData.length,
      y: positiveData.reduce((sum, p) => sum + p.y, 0) / positiveData.length
    };
    
    const negCenter = {
      x: negativeData.reduce((sum, p) => sum + p.x, 0) / negativeData.length,
      y: negativeData.reduce((sum, p) => sum + p.y, 0) / negativeData.length
    };
    
    // Middle point - inflection point of S-curve
    const midX = (posCenter.x + negCenter.x) / 2;
    const midY = (posCenter.y + negCenter.y) / 2;
    
    // Create S-curve using sigmoid function
    const boundaryPoints: { x: number; y: number }[] = [];
    const numPoints = 400; // Much higher resolution for ultra-smooth curve
    
    // Parameters for S-curve shape
    const amplitude = yRange * 0.35; // More pronounced S-shape
    const steepness = Math.max(1.5, gamma * 0.8); // Extra gradual transition for ultra-smooth S
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = extendedXMin + t * (extendedXMax - extendedXMin);
      
      // Calculate sigmoid S-curve using tanh with smoothing
      // This creates a smooth S-shape transitioning from -1 to +1
      const sigmoidArg = (x - midX) / steepness;
      const sigmoidValue = Math.tanh(sigmoidArg);
      
      // Create S-curve that transitions between the class regions
      // Reverse the sign so upper S is above red, lower S is below green
      const y = midY - amplitude * sigmoidValue;
      
      // Adjust based on C (strictness) - shifts the curve up/down
      const cShift = (C - 1) * yRange * 0.02;
      const adjustedY = y + cShift;
      
      if (adjustedY >= extendedYMin && adjustedY <= extendedYMax) {
        boundaryPoints.push({ x, y: adjustedY });
      }
    }
    
    // Apply smoothing to make the curve even smoother
    const smoothedPoints: { x: number; y: number }[] = [];
    const windowSize = 25; // Very large smoothing window for ultra-smooth S-curve
    for (let i = 0; i < boundaryPoints.length; i++) {
      let sumY = 0;
      let count = 0;
      for (let w = -windowSize; w <= windowSize; w++) {
        const idx = i + w;
        if (idx >= 0 && idx < boundaryPoints.length) {
          sumY += boundaryPoints[idx].y;
          count++;
        }
      }
      smoothedPoints.push({ x: boundaryPoints[i].x, y: sumY / count });
    }
    
    return smoothedPoints;
  };
  
  // Helper function to calculate sigmoid decision function
  const calculateSigmoidDecisionFunction = (x: number, y: number): number => {
    // For sigmoid kernel with health risk data (age vs cholesterol)
    // Create an S-curve based on the sigmoid function
    // Risk increases with age (x) and cholesterol (y)
    
    // Calculate distances to class centers
    const posCenter = {
      x: positiveData.reduce((sum, p) => sum + p.x, 0) / positiveData.length,
      y: positiveData.reduce((sum, p) => sum + p.y, 0) / positiveData.length
    };
    
    const negCenter = {
      x: negativeData.reduce((sum, p) => sum + p.x, 0) / negativeData.length,
      y: negativeData.reduce((sum, p) => sum + p.y, 0) / negativeData.length
    };
    
    // Distance to each class center
    const distToPos = Math.sqrt((x - posCenter.x) ** 2 + (y - posCenter.y) ** 2);
    const distToNeg = Math.sqrt((x - negCenter.x) ** 2 + (y - negCenter.y) ** 2);
    
    // Use sigmoid to create S-shaped transition
    // Higher gamma = steeper S-curve
    const normalizedDiff = (distToNeg - distToPos) / Math.max(distToPos + distToNeg, 0.0001);
    const sigmoidValue = Math.tanh(gamma * normalizedDiff * 10);
    
    // Adjust based on C (strictness)
    const cAdjustment = 1 + (C - 1) * 0.2;
    
    return sigmoidValue * cAdjustment;
  };

  const decisionBoundaryLine = dataset.kernel === 'linear' ? getDecisionBoundaryLine() 
    : dataset.kernel === 'rbf' ? getRBFDecisionBoundary() 
    : dataset.kernel === 'sigmoid' ? getSigmoidDecisionBoundary()
    : getPolynomialDecisionBoundary();
  const rbfNegativeBoundary = dataset.kernel === 'rbf' ? getRBFNegativeBoundary() : [];
  const marginLines = getMarginLines();

  // For loan dataset, compute exactly one visual support vector on each margin (after boundary exists)
  let loanSVPos: { x: number; y: number }[] = [];
  let loanSVNeg: { x: number; y: number }[] = [];
  let loanDerived: {
    slope?: number;
    intercept?: number;
    a?: number;
    b?: number;
    c?: number;
    norm?: number;
    margin?: number;
  } = {};
  if (isLoan && decisionBoundaryLine && decisionBoundaryLine.length >= 2) {
    const first = decisionBoundaryLine[0];
    const last = decisionBoundaryLine[decisionBoundaryLine.length - 1];
    const dxSpan = (last.x - first.x);
    const slope = (last.y - first.y) / (Math.abs(dxSpan) < 1e-6 ? 1e-6 : dxSpan);
    const intercept = first.y - slope * first.x;
    // @ts-ignore
    const m = (getDecisionBoundaryLine as any)._loanMargin as number | undefined;
    const margin = m ?? (Math.max(...dataset.data.map(d => d.y)) - Math.min(...dataset.data.map(d => d.y))) * 0.03;
    const a = -slope;
    const b = 1;
    const norm = Math.sqrt(a * a + b * b);
    if (norm > 0 && Number.isFinite(norm)) {
      const dx = (margin * a) / norm;
      const dy = (margin * b) / norm;
      const xMinAll = Math.min(...dataset.data.map(d => d.x));
      const xMaxAll = Math.max(...dataset.data.map(d => d.x));
      const xMid = (xMinAll + xMaxAll) / 2;
      const yOnBoundary = slope * xMid + intercept;
      if (Number.isFinite(yOnBoundary)) {
        loanSVPos = [{ x: xMid + dx, y: yOnBoundary + dy }];
        loanSVNeg = [{ x: xMid - dx, y: yOnBoundary - dy }];
        loanDerived = { slope, intercept, a, b, c: -intercept, norm, margin };
      }
    }
  }

  // Custom tooltip with enhanced info
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const dataIdx = dataset.data.findIndex(d => d.x === data.x && d.y === data.y);
      const isSupportVector = result.supportVectors.includes(dataIdx);
      
      return (
        <div className="card-neuro p-4 text-xs max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-foreground">
              {data.label === 1 ? dataset.positiveLabel : dataset.negativeLabel}
            </p>
            {isSupportVector && (
              <Badge className="text-xs bg-primary text-primary-foreground">
                Important case
              </Badge>
            )}
          </div>
          <div className="space-y-1 text-muted-foreground">
            <p>
              {dataset.xAxisLabel}: {typeof data.x === 'number' ? data.x.toFixed(1) : data.x}
            </p>
            <p>
              {dataset.yAxisLabel}: {typeof data.y === 'number' ? data.y.toFixed(1) : data.y}
            </p>
          </div>
          {isSupportVector && (
            <p className="text-xs text-primary mt-2 italic">
              This case helped define the decision boundary
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <Card className="card-neuro">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Live Data Visualization</h3>
                <p className="text-muted-foreground">
                  Each dot represents one data point. Watch how they separate into groups!
                </p>
              </div>

              {/* Display Toggles */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={showSupportVectors}
                    onCheckedChange={setShowSupportVectors}
                  />
                  <span className="text-muted-foreground">
                    Show important teaching cases
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={showMargins}
                    onCheckedChange={setShowMargins}
                  />
                  <span className="text-muted-foreground">
                    Show safety buffer zones
                  </span>
                </div>
              </div>
            </div>

            {/* Info Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                {positiveData.length} {dataset.positiveLabel}
              </Badge>
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                {negativeData.length} {dataset.negativeLabel}
              </Badge>
              {/* Removed 'important cases' badge as requested */}
            </div>

            <div className="card-neuro-inset p-4 rounded-2xl">
              <ResponsiveContainer width="100%" height={500}>
                <ComposedChart
                  margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={dataset.xAxisLabel}
                    label={{ 
                      value: dataset.xAxisLabel, 
                      position: 'bottom',
                      offset: 40,
                      style: { fill: 'hsl(var(--foreground))', fontSize: '14px', fontWeight: 500 }
                    }}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name={dataset.yAxisLabel}
                    label={{ 
                      value: dataset.yAxisLabel, 
                      angle: -90, 
                      position: 'left',
                      offset: 40,
                      style: { fill: 'hsl(var(--foreground))', fontSize: '14px', fontWeight: 500 }
                    }}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  
                  {/* Decision Boundary Line for Linear Kernel */}
                  {dataset.kernel === 'linear' && decisionBoundaryLine.length > 0 && (
                    <Line
                      name="Decision Boundary"
                      data={decisionBoundaryLine}
                      dataKey="y"
                      stroke="hsl(var(--foreground))"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={false}
                      connectNulls={false}
                    />
                  )}
                  
                  {/* Decision Boundary Curve for Polynomial Kernel */}
                  {dataset.kernel === 'polynomial' && decisionBoundaryLine.length > 0 && (
                    <Line
                      name="Decision Boundary"
                      data={decisionBoundaryLine}
                      dataKey="y"
                      stroke="hsl(var(--foreground))"
                      strokeWidth={4}
                      strokeDasharray="8 4"
                      dot={false}
                      connectNulls={true}
                    />
                  )}
                  
                  {/* Decision Boundary Curves for RBF Kernel (positive and negative clusters) */}
                  {dataset.kernel === 'rbf' && decisionBoundaryLine.length > 0 && (
                    <Line
                      name={`${dataset.positiveLabel} region`}
                      data={decisionBoundaryLine}
                      dataKey="y"
                      stroke={dataset.positiveColor}
                      strokeWidth={3}
                      dot={false}
                      connectNulls={true}
                    />
                  )}
                  {dataset.kernel === 'rbf' && rbfNegativeBoundary.length > 0 && (
                    <Line
                      name={`${dataset.negativeLabel} region`}
                      data={rbfNegativeBoundary}
                      dataKey="y"
                      stroke={dataset.negativeColor}
                      strokeWidth={3}
                      dot={false}
                      connectNulls={true}
                    />
                  )}
                  
                  {/* Decision Boundary Curve for Sigmoid Kernel */}
                  {dataset.kernel === 'sigmoid' && decisionBoundaryLine.length > 0 && (
                    <Line
                      name="Decision Boundary"
                      data={decisionBoundaryLine}
                      dataKey="y"
                      stroke="hsl(var(--foreground))"
                      strokeWidth={3}
                      strokeDasharray="8 4"
                      dot={false}
                      connectNulls={true}
                    />
                  )}
                  
                  {/* Debug: Show if polynomial boundary exists */}
                  {dataset.kernel === 'polynomial' && decisionBoundaryLine.length === 0 && (
                    <Line
                      name="Debug: No Boundary Found"
                      data={[{ x: 0, y: 0 }]}
                      dataKey="y"
                      stroke="red"
                      strokeWidth={2}
                      dot={true}
                    />
                  )}
                  
                  {/* Margin Lines for Linear Kernel */}
                  {dataset.kernel === 'linear' && showMargins && marginLines.upper.length > 0 && (
                    <>
                      <Line
                        name="Upper Margin"
                        data={marginLines.upper}
                        dataKey="y"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        dot={false}
                        connectNulls={false}
                      />
                      <Line
                        name="Lower Margin"
                        data={marginLines.lower}
                        dataKey="y"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        dot={false}
                        connectNulls={false}
                      />
                    </>
                  )}
                  
                  <Scatter
                    name={dataset.positiveLabel}
                    data={(() => {
                      if (!(isLoan && loanSVPos.length === 1 && loanDerived.norm)) return positiveData;
                      const xMinAll = Math.min(...dataset.data.map(d => d.x));
                      const xMaxAll = Math.max(...dataset.data.map(d => d.x));
                      const yMinAll = Math.min(...dataset.data.map(d => d.y));
                      const yMaxAll = Math.max(...dataset.data.map(d => d.y));
                      const yRangeAll = yMaxAll - yMinAll;
                      const sv = loanSVPos[0];
                      const a = loanDerived.a as number;
                      const b = loanDerived.b as number;
                      const c = loanDerived.c as number;
                      const norm = loanDerived.norm as number;
                      const margin = (loanDerived.margin as number) || 0;
                      const buffer = yRangeAll * 0.12;
                      const targetSigned = (margin + buffer) * norm;

                      // Compute centroid of current green points
                      const cx = positiveData.reduce((s, p) => s + p.x, 0) / Math.max(1, positiveData.length);
                      const cy = positiveData.reduce((s, p) => s + p.y, 0) / Math.max(1, positiveData.length);
                      let vx = sv.x - cx;
                      let vy = sv.y - cy;
                      const vnorm = Math.sqrt(vx * vx + vy * vy) || 1e-6;
                      // Direction vector (keep orientation; uniform translation only)
                      vx /= vnorm; vy /= vnorm;

                      // Determine max uniform translation t that preserves boundary clearance for all points
                      let tBound = 0.8 * vnorm; // cap distance to move (scaled back to absolute units)
                      // But enforce boundary constraint: s1 = s0 + t*(a*vx + b*vy) >= targetSigned
                      const denom = a * vx + b * vy;
                      if (denom < 0) {
                        // Moving towards SV reduces distance; find min over points
                        let minTB = Infinity;
                        for (const p of positiveData) {
                          const s0 = a * p.x + b * p.y + c;
                          const tMax = (s0 - targetSigned) / (-denom);
                          if (isFinite(tMax)) minTB = Math.min(minTB, tMax);
                        }
                        if (isFinite(minTB)) tBound = Math.min(tBound, Math.max(0, minTB));
                      }
                      // Translate all points by t*dir (absolute units)
                      const moveX = vx * tBound;
                      const moveY = vy * tBound;
                      const moved = positiveData.map(p => ({ x: p.x + moveX, y: p.y + moveY, label: p.label }));
                      // Spread along boundary tangent without changing boundary distance
                      const tHatX = -b / norm;
                      const tHatY = a / norm;
                      const nHatX = a / norm;
                      const nHatY = b / norm;
                      // Project to tangent/normal coordinates
                      const coords = moved.map(pt => ({
                        t: pt.x * tHatX + pt.y * tHatY,
                        n: pt.x * nHatX + pt.y * nHatY,
                        label: pt.label,
                      }));
                      // Sort by tangent coordinate
                      coords.sort((p1, p2) => p1.t - p2.t);
                      // Compute safe global tangent range using plot corners to avoid clamping
                      const corners = [
                        { x: xMinAll, y: yMinAll },
                        { x: xMinAll, y: yMaxAll },
                        { x: xMaxAll, y: yMinAll },
                        { x: xMaxAll, y: yMaxAll },
                      ];
                      const tCornerVals = corners.map(pt => pt.x * tHatX + pt.y * tHatY);
                      const tGlobalMin = Math.min(...tCornerVals);
                      const tGlobalMax = Math.max(...tCornerVals);
                      // Center spacing around current tangent centroid
                      const tCentroid = coords.reduce((s, p) => s + p.t, 0) / Math.max(1, coords.length);
                      // Max half-span without exceeding chart bounds
                      const halfSpanBound = Math.max(0, Math.min(tGlobalMax - tCentroid, tCentroid - tGlobalMin));
                      // Choose generous half-span but within bound
                      const targetHalfSpan = halfSpanBound * 0.85;
                      const start = tCentroid - targetHalfSpan;
                      // Create uneven gaps using deterministic weights per point
                      const rand = (x: number, y: number, k: number) => {
                        const s = Math.sin(x * 12.9898 + y * 78.233 + k * 45.123) * 43758.5453;
                        return s - Math.floor(s); // [0,1)
                      };
                      const weights: number[] = coords.map((pt, i) => 0.4 + 1.6 * rand(pt.t, pt.n, i));
                      const totalW = Math.max(1e-6, weights.reduce((s, w) => s + w, 0));
                      const cumulative: number[] = [];
                      let acc = 0;
                      for (let i = 0; i < weights.length; i++) {
                        acc += weights[i];
                        cumulative.push(acc / totalW);
                      }
                      const spaced = coords.map((pt, i) => ({
                        t: start + cumulative[i] * (2 * targetHalfSpan),
                        n: pt.n,
                        label: pt.label,
                      }));
                      // Compute global normal (vertical wrt boundary) limits from chart corners
                      const cornersN = [
                        { x: xMinAll, y: yMinAll },
                        { x: xMinAll, y: yMaxAll },
                        { x: xMaxAll, y: yMinAll },
                        { x: xMaxAll, y: yMaxAll },
                      ];
                      const nCornerVals = cornersN.map(pt => pt.x * nHatX + pt.y * nHatY);
                      const nGlobalMin = Math.min(...nCornerVals);
                      const nGlobalMax = Math.max(...nCornerVals);
                      // Ensure minimum clearance above boundary and a top padding
                      const nMinAllowed = (targetSigned - c) / norm + yRangeAll * 0.03;
                      const nMaxAllowed = nGlobalMax - yRangeAll * 0.04;
                      // Spread across the full upper region by sampling uneven normal positions in [nMinAllowed, nMaxAllowed]
                      const rand01 = (x: number, y: number, k: number) => {
                        const s = Math.sin(x * 19.19 + y * 7.07 + k * 31.31) * 12345.6789;
                        return s - Math.floor(s);
                      };
                      const spreadArea = spaced.map((pt, i) => {
                        const r = rand01(pt.t, pt.n, i);
                        const nTarget = nMinAllowed + r * Math.max(0, (nMaxAllowed - nMinAllowed));
                        return { t: pt.t, n: nTarget, label: pt.label };
                      });
                      // Reconstruct back to x,y and clamp
                      return spreadArea.map(pt => {
                        const nClamped = Math.max(nMinAllowed, Math.min(nMaxAllowed, pt.n));
                        let xNew = pt.t * tHatX + nClamped * nHatX;
                        let yNew = pt.t * tHatY + nClamped * nHatY;
                        xNew = Math.max(xMinAll, Math.min(xMaxAll, xNew));
                        yNew = Math.max(yMinAll, Math.min(yMaxAll, yNew));
                        return { x: xNew, y: yNew, label: 1 as 1 };
                      });
                    })()}
                    fill={dataset.positiveColor}
                    fillOpacity={0.7}
                    onClick={(data) => {
                      const idx = dataset.data.findIndex(d => d.x === data.x && d.y === data.y);
                      setSelectedPoint(idx);
                    }}
                  />
                  <Scatter
                    name={dataset.negativeLabel}
                    data={(() => {
                      if (!(isLoan && loanSVNeg.length === 1 && loanDerived.norm)) return negativeData;
                      const xMinAll = Math.min(...dataset.data.map(d => d.x));
                      const xMaxAll = Math.max(...dataset.data.map(d => d.x));
                      const yMinAll = Math.min(...dataset.data.map(d => d.y));
                      const yMaxAll = Math.max(...dataset.data.map(d => d.y));
                      const yRangeAll = yMaxAll - yMinAll;
                      const sv = loanSVNeg[0];
                      const a = loanDerived.a as number;
                      const b = loanDerived.b as number;
                      const c = loanDerived.c as number;
                      const norm = loanDerived.norm as number;
                      const margin = (loanDerived.margin as number) || 0;
                      const targetSigned = (margin + yRangeAll * 0.02) * norm; // positive magnitude

                      // Centroid of current red points
                      const cx = negativeData.reduce((s, p) => s + p.x, 0) / Math.max(1, negativeData.length);
                      const cy = negativeData.reduce((s, p) => s + p.y, 0) / Math.max(1, negativeData.length);
                      let vx = sv.x - cx;
                      let vy = sv.y - cy;
                      const vnorm = Math.sqrt(vx * vx + vy * vy) || 1e-6;
                      vx /= vnorm; vy /= vnorm;

                      // Start with a cap on translation in absolute units
                      let tBound = 0.8 * vnorm;
                      const denom = a * vx + b * vy; // change in signed value per unit t
                      if (denom > 0) {
                        // Moving toward SV increases s; ensure s1 <= -targetSigned
                        let minTB = Infinity;
                        for (const p of negativeData) {
                          const s0 = a * p.x + b * p.y + c;
                          const tMax = (-targetSigned - s0) / denom;
                          if (isFinite(tMax)) minTB = Math.min(minTB, tMax);
                        }
                        if (isFinite(minTB)) tBound = Math.min(tBound, Math.max(0, minTB));
                      }
                      // Apply uniform translation
                      const moveX = vx * tBound;
                      const moveY = vy * tBound;
                      const moved = negativeData.map(p => ({ x: p.x + moveX, y: p.y + moveY, label: p.label }));
                      // Spread along boundary tangent without changing boundary distance
                      const tHatX = -b / norm;
                      const tHatY = a / norm;
                      const nHatX = a / norm;
                      const nHatY = b / norm;
                      const coords = moved.map(pt => ({
                        t: pt.x * tHatX + pt.y * tHatY,
                        n: pt.x * nHatX + pt.y * nHatY,
                        label: pt.label,
                      }));
                      coords.sort((p1, p2) => p1.t - p2.t);
                      // Compute safe global tangent range using plot corners
                      const cornersT2 = [
                        { x: xMinAll, y: yMinAll },
                        { x: xMinAll, y: yMaxAll },
                        { x: xMaxAll, y: yMinAll },
                        { x: xMaxAll, y: yMaxAll },
                      ];
                      const tCornerVals2 = cornersT2.map(pt => pt.x * tHatX + pt.y * tHatY);
                      const tGlobalMin2 = Math.min(...tCornerVals2);
                      const tGlobalMax2 = Math.max(...tCornerVals2);
                      const tCentroid2 = coords.reduce((s, p) => s + p.t, 0) / Math.max(1, coords.length);
                      const halfSpanBound2 = Math.max(0, Math.min(tGlobalMax2 - tCentroid2, tCentroid2 - tGlobalMin2));
                      const targetHalfSpan2 = halfSpanBound2 * 0.85;
                      const start2 = tCentroid2 - targetHalfSpan2;
                      // Uneven tangent distribution
                      const rand2 = (x: number, y: number, k: number) => {
                        const s = Math.sin(x * 21.21 + y * 9.19 + k * 17.17) * 76543.2109;
                        return s - Math.floor(s);
                      };
                      const weights2: number[] = coords.map((pt, i) => 0.4 + 1.6 * rand2(pt.t, pt.n, i));
                      const totalW2 = Math.max(1e-6, weights2.reduce((s, w) => s + w, 0));
                      const cumulative2: number[] = [];
                      let acc2 = 0;
                      for (let i = 0; i < weights2.length; i++) {
                        acc2 += weights2[i];
                        cumulative2.push(acc2 / totalW2);
                      }
                      const spaced2 = coords.map((pt, i) => ({ t: start2 + cumulative2[i] * (2 * targetHalfSpan2), n: pt.n, label: pt.label }));
                      // Compute normal limits for lower region
                      const cornersN2 = [
                        { x: xMinAll, y: yMinAll },
                        { x: xMinAll, y: yMaxAll },
                        { x: xMaxAll, y: yMinAll },
                        { x: xMaxAll, y: yMaxAll },
                      ];
                      const nCornerVals2 = cornersN2.map(pt => pt.x * nHatX + pt.y * nHatY);
                      const nGlobalMin2 = Math.min(...nCornerVals2);
                      const nGlobalMax2 = Math.max(...nCornerVals2);
                      const nMaxAllowedLower = (-targetSigned - c) / norm - yRangeAll * 0.03;
                      const nMinAllowedLower = nGlobalMin2 + yRangeAll * 0.04;
                      const rand01b = (x: number, y: number, k: number) => {
                        const s = Math.sin(x * 13.37 + y * 3.14 + k * 2.71) * 24680.1357;
                        return s - Math.floor(s);
                      };
                      const spreadArea2 = spaced2.map((pt, i) => {
                        const r = rand01b(pt.t, pt.n, i);
                        const minN = nMinAllowedLower;
                        const maxN = Math.min(nMaxAllowedLower, nGlobalMax2 - yRangeAll * 0.05);
                        const nTarget = minN + r * Math.max(0, (maxN - minN));
                        return { t: pt.t, n: nTarget, label: pt.label };
                      });
                      return spreadArea2.map(pt => {
                        const nClamped = Math.max(nMinAllowedLower, Math.min(nMaxAllowedLower, pt.n));
                        let xNew = pt.t * tHatX + nClamped * nHatX;
                        let yNew = pt.t * tHatY + nClamped * nHatY;
                        xNew = Math.max(xMinAll, Math.min(xMaxAll, xNew));
                        yNew = Math.max(yMinAll, Math.min(yMaxAll, yNew));
                        return { x: xNew, y: yNew, label: 0 as 0 };
                      });
                    })()}
                    fill={dataset.negativeColor}
                    fillOpacity={0.7}
                    onClick={(data) => {
                      const idx = dataset.data.findIndex(d => d.x === data.x && d.y === data.y);
                      setSelectedPoint(idx);
                    }}
                  />
                  
                  {/* Support Vectors - shown as larger, outlined dots */}
                  {showSupportVectors && !isLoan && (
                    <>
                      <Scatter
                        name="Support Vectors (Approved)"
                        data={supportVectorPos}
                        fill="none"
                        stroke={dataset.positiveColor}
                        strokeWidth={3}
                        r={8}
                        onClick={(data) => {
                          const idx = dataset.data.findIndex(d => d.x === data.x && d.y === data.y);
                          setSelectedPoint(idx);
                        }}
                      />
                      <Scatter
                        name="Support Vectors (Rejected)"
                        data={supportVectorNeg}
                        fill="none"
                        stroke={dataset.negativeColor}
                        strokeWidth={3}
                        r={8}
                        onClick={(data) => {
                          const idx = dataset.data.findIndex(d => d.x === data.x && d.y === data.y);
                          setSelectedPoint(idx);
                        }}
                      />
                    </>
                  )}
                  {showSupportVectors && isLoan && loanSVPos.length === 1 && loanSVNeg.length === 1 && (
                    <>
                      <Scatter
                        name="Support Vector (Approved)"
                        data={loanSVPos}
                        fill="none"
                        stroke={dataset.positiveColor}
                        strokeWidth={3}
                        r={9}
                      />
                      <Scatter
                        name="Support Vector (Rejected)"
                        data={loanSVNeg}
                        fill="none"
                        stroke={dataset.negativeColor}
                        strokeWidth={3}
                        r={9}
                      />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Selected Point Inspector */}
            {selectedPoint !== null && (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground">Inspecting Case #{selectedPoint + 1}</h4>
                  <button
                    onClick={() => setSelectedPoint(null)}
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    Close ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">{dataset.xAxisLabel}</div>
                    <div className="font-semibold">{dataset.data[selectedPoint].x.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">{dataset.yAxisLabel}</div>
                    <div className="font-semibold">{dataset.data[selectedPoint].y.toFixed(1)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-muted-foreground mb-1">Actual Label</div>
                    <div className="font-semibold">
                      {dataset.data[selectedPoint].label === 1 ? dataset.positiveLabel : dataset.negativeLabel}
                    </div>
                  </div>
                  {result.supportVectors.includes(selectedPoint) && (
                    <div className="col-span-2 p-3 rounded-xl bg-primary/10 text-xs italic">
                      ⭐ This is an important teaching case! It sits near the decision boundary and 
                      helped the computer learn where to draw the line.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Explanation Panel */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-primary/5">
                <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                  <span className="text-xl">→</span>
                  Horizontal Movement
                </h4>
                <p className="text-sm text-muted-foreground">{dataset.xAxisExplanation}</p>
              </div>
              <div className="p-4 rounded-2xl bg-accent/5">
                <h4 className="font-semibold text-accent mb-2 flex items-center gap-2">
                  <span className="text-xl">↑</span>
                  Vertical Movement
                </h4>
                <p className="text-sm text-muted-foreground">{dataset.yAxisExplanation}</p>
              </div>
            </div>

            {/* Current Settings Display removed as requested */}
          </div>
        </Card>
      </div>
    </div>
  );
};

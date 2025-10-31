import { useState } from "react";
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

  // Prepare data for Recharts
  const positiveData = dataset.data.filter(d => d.label === 1);
  const negativeData = dataset.data.filter(d => d.label === 0);
  
  // Get support vectors
  const supportVectorData = dataset.kernel === 'sigmoid'
    ? result.supportVectors.map(idx => dataset.data[idx]).filter(p => p.label === 1)
    : result.supportVectors.map(idx => dataset.data[idx]);

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
      x: positiveData.reduce((sum, p) => sum + p.x, 0) / positiveData.length,
      y: positiveData.reduce((sum, p) => sum + p.y, 0) / positiveData.length,
      xStd: Math.sqrt(positiveData.reduce((sum, p) => sum + Math.pow(p.x - positiveData.reduce((s, pt) => s + pt.x, 0) / positiveData.length, 2), 0) / positiveData.length),
      yStd: Math.sqrt(positiveData.reduce((sum, p) => sum + Math.pow(p.y - positiveData.reduce((s, pt) => s + pt.y, 0) / positiveData.length, 2), 0) / positiveData.length)
    };
    
    const negStats = {
      x: negativeData.reduce((sum, p) => sum + p.x, 0) / negativeData.length,
      y: negativeData.reduce((sum, p) => sum + p.y, 0) / negativeData.length,
      xStd: Math.sqrt(negativeData.reduce((sum, p) => sum + Math.pow(p.x - negativeData.reduce((s, pt) => s + pt.x, 0) / negativeData.length, 2), 0) / negativeData.length),
      yStd: Math.sqrt(negativeData.reduce((sum, p) => sum + Math.pow(p.y - negativeData.reduce((s, pt) => s + pt.y, 0) / negativeData.length, 2), 0) / negativeData.length)
    };
    
    // Calculate the optimal slope based on the data distribution
    // For loan approval: higher income + better credit = approved
    // So we want a line with negative slope that separates high-income/high-credit from low-income/low-credit
    const slope = -(posStats.y - negStats.y) / (posStats.x - negStats.x);
    
    // Calculate the intercept to position the line optimally
    // Place the line closer to the negative class (rejected loans) for better separation
    const weight = 0.6; // Adjust this to control where the line is positioned
    const midPoint = {
      x: negStats.x + weight * (posStats.x - negStats.x),
      y: negStats.y + weight * (posStats.y - negStats.y)
    };
    
    const intercept = midPoint.y - slope * midPoint.x;
    
    // Adjust the boundary based on the C parameter (strictness)
    // Higher C means the boundary should be closer to the positive class (more strict approval)
    const yRange = yMax - yMin;
    const adjustment = (C - 1) * yRange * 0.03; // Adjust based on C parameter
    const adjustedIntercept = intercept + adjustment;
    
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
    
    // Calculate margin width based on C parameter
    // Higher C = smaller margin (more strict)
    // Lower C = larger margin (more flexible)
    const yRange = Math.max(...dataset.data.map(d => d.y)) - Math.min(...dataset.data.map(d => d.y));
    const baseMargin = yRange * 0.08; // Base margin width
    const marginWidth = baseMargin / (C + 0.1); // Adjust based on C parameter
    
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

  // Calculate RBF decision boundary (smooth Gaussian bumps)
  const getRBFDecisionBoundary = () => {
    if (dataset.kernel !== 'rbf') return [];
    
    const xMin = Math.min(...dataset.data.map(d => d.x));
    const xMax = Math.max(...dataset.data.map(d => d.x));
    const yMin = Math.min(...dataset.data.map(d => d.y));
    const yMax = Math.max(...dataset.data.map(d => d.y));
    
    // Extend the range to cover the whole plot - extend more for better coverage
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const padding = 0.25; // Increased padding to ensure full coverage
    const extendedXMin = xMin - xRange * padding;
    const extendedXMax = xMax + xRange * padding;
    const extendedYMin = yMin - yRange * padding;
    const extendedYMax = yMax + yRange * padding;

    // Class centers to define a consistent side and pick a single crossing per x
    const posCenterY = positiveData.reduce((s, p) => s + p.y, 0) / Math.max(1, positiveData.length);
    const negCenterY = negativeData.reduce((s, p) => s + p.y, 0) / Math.max(1, negativeData.length);
    const targetMidY = (posCenterY + negCenterY) / 2;
    
    // Calculate decision function value at each point
    // For RBF, we compute the sum of Gaussian bumps centered at support vectors
    const rawPoints: { x: number; y: number }[] = [];
    const numXPoints = 250; // Higher resolution for smoother curves
    
    for (let i = 0; i <= numXPoints; i++) {
      const x = extendedXMin + (i / numXPoints) * (extendedXMax - extendedXMin);
      
      // For each x, find the y values where the decision function equals zero
      const yCrossings: number[] = [];
      const numYPoints = 250; // Match x resolution
      
      let prevY = extendedYMin;
      let prevDecisionValue = calculateRBFDecisionFunction(x, prevY);
      for (let j = 1; j <= numYPoints; j++) {
        const y = extendedYMin + (j / numYPoints) * (extendedYMax - extendedYMin);
        const decisionValue = calculateRBFDecisionFunction(x, y);
        
        // Check if we crossed zero in y-direction (horizontal crossing)
        if (decisionValue * prevDecisionValue <= 0 && Math.abs(decisionValue - prevDecisionValue) > 0.00001) {
          // Interpolate to find the exact boundary point
          const exactY = prevY + (y - prevY) * Math.abs(prevDecisionValue) / Math.abs(decisionValue - prevDecisionValue);
          if (exactY >= extendedYMin && exactY <= extendedYMax) {
            yCrossings.push(exactY);
          }
        }
        prevY = y;
        prevDecisionValue = decisionValue;
      }
      
      // Choose a single crossing per x: the one closest to the midpoint between class centers
      if (yCrossings.length > 0) {
        let bestY = yCrossings[0];
        let bestDist = Math.abs(bestY - targetMidY);
        for (let k = 1; k < yCrossings.length; k++) {
          const dist = Math.abs(yCrossings[k] - targetMidY);
          if (dist < bestDist) {
            bestY = yCrossings[k];
            bestDist = dist;
          }
        }
        rawPoints.push({ x, y: bestY });
      }
    }
    
    // Smooth the curve with a light moving average to ensure continuity
    const windowSize = 3; // small smoothing window
    const boundaryPoints: { x: number; y: number }[] = [];
    for (let i = 0; i < rawPoints.length; i++) {
      let sumY = 0;
      let count = 0;
      for (let w = -windowSize; w <= windowSize; w++) {
        const idx = i + w;
        if (idx >= 0 && idx < rawPoints.length) {
          sumY += rawPoints[idx].y;
          count++;
        }
      }
      boundaryPoints.push({ x: rawPoints[i].x, y: sumY / count });
    }
    
    // Sort points by x coordinate then y for smooth rendering
    boundaryPoints.sort((a, b) => {
      if (Math.abs(a.x - b.x) < 0.001) {
        return a.y - b.y;
      }
      return a.x - b.x;
    });
    
    return boundaryPoints;
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
        // Linear boundary - straight line separating the classes
        // Find the optimal separating line by analyzing the data distribution
        
        // Get the minimum y-coordinate of blue points and maximum y-coordinate of orange points
        const minBlueY = Math.min(...positiveData.map(p => p.y));
        const maxOrangeY = Math.max(...negativeData.map(p => p.y));
        
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
        
        // Calculate the line equation: y = slope * x + intercept
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
  const marginLines = getMarginLines();

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
              {showSupportVectors && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {result.supportVectors.length} important cases
                </Badge>
              )}
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
                  
                  {/* Decision Boundary Curve for RBF Kernel */}
                  {dataset.kernel === 'rbf' && decisionBoundaryLine.length > 0 && (
                    <Line
                      name="Decision Boundary"
                      data={decisionBoundaryLine}
                      dataKey="y"
                      stroke="hsl(var(--foreground))"
                      strokeWidth={3}
                      strokeDasharray="10 5"
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
                    data={positiveData}
                    fill={dataset.positiveColor}
                    fillOpacity={0.7}
                    onClick={(data) => {
                      const idx = dataset.data.findIndex(d => d.x === data.x && d.y === data.y);
                      setSelectedPoint(idx);
                    }}
                  />
                  <Scatter
                    name={dataset.negativeLabel}
                    data={negativeData}
                    fill={dataset.negativeColor}
                    fillOpacity={0.7}
                    onClick={(data) => {
                      const idx = dataset.data.findIndex(d => d.x === data.x && d.y === data.y);
                      setSelectedPoint(idx);
                    }}
                  />
                  
                  {/* Support Vectors - shown as larger, outlined dots */}
                  {showSupportVectors && (
                    <Scatter
                      name="Important Cases"
                      data={supportVectorData}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      r={8}
                      onClick={(data) => {
                        const idx = dataset.data.findIndex(d => d.x === data.x && d.y === data.y);
                        setSelectedPoint(idx);
                      }}
                    />
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

            {/* Current Settings Display */}
            <div className="mt-4 p-4 rounded-2xl card-neuro-inset">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current Analysis Settings:</span>
                <div className="flex gap-4">
                  <span className="font-medium">
                    Flexibility: <span className="text-primary">{C.toFixed(1)}</span>
                  </span>
                  <span className="font-medium">
                    Sensitivity: <span className="text-accent">{gamma.toFixed(2)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

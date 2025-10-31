export interface DataPoint {
  x: number;
  y: number;
  label: 0 | 1; // 0 = negative class, 1 = positive class
}

export interface Dataset {
  id: string;
  name: string;
  icon: string;
  description: string;
  scenario: string;
  xAxisLabel: string;
  yAxisLabel: string;
  xAxisExplanation: string;
  yAxisExplanation: string;
  positiveLabel: string;
  negativeLabel: string;
  positiveColor: string;
  negativeColor: string;
  kernel: 'linear' | 'polynomial' | 'rbf' | 'sigmoid';
  data: DataPoint[];
  overview: {
    whatYouSee: string;
    theGroups: string;
    measuring: string;
  };
}

// Helper to generate sample data
function generateLinearData(): DataPoint[] {
  const data: DataPoint[] = [];
  
  // Rejected loans (bottom-left) bounds
  const negIncomeMin = 10000;  // 10k
  const negIncomeMax = 38000;  // 38k
  const negCreditMin = 320;    // 320
  const negCreditMax = 560;    // 560

  // Approved loans (top-right) bounds
  const posIncomeMin = 90000;  // 90k
  const posIncomeMax = 125000; // 125k
  const posCreditMin = 780;    // 780
  const posCreditMax = 930;    // 930

  const makeJitteredGrid = (
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    count: number
  ): { x: number; y: number }[] => {
    const result: { x: number; y: number }[] = [];
    const width = xMax - xMin;
    const height = yMax - yMin;
    const aspect = width / Math.max(1, height);
    const cols = Math.ceil(Math.sqrt(count * aspect));
    const rows = Math.ceil(count / Math.max(1, cols));
    const dx = width / cols;
    const dy = height / rows;
    let placed = 0;
    for (let r = 0; r < rows && placed < count; r++) {
      for (let c = 0; c < cols && placed < count; c++) {
        const cx = xMin + (c + 0.5) * dx;
        const cy = yMin + (r + 0.5) * dy;
        const jx = (Math.random() - 0.5) * dx * 0.4; // lower jitter to keep spacing
        const jy = (Math.random() - 0.5) * dy * 0.4;
        const x = Math.min(xMax - dx * 0.15, Math.max(xMin + dx * 0.15, cx + jx));
        const y = Math.min(yMax - dy * 0.15, Math.max(yMin + dy * 0.15, cy + jy));
        result.push({ x, y });
        placed++;
      }
    }
    return result.slice(0, count);
  };

  const posPoints = makeJitteredGrid(posIncomeMin, posIncomeMax, posCreditMin, posCreditMax, 60)
    .map(p => ({ x: p.x, y: p.y, label: 1 as 1 }));
  const negPoints = makeJitteredGrid(negIncomeMin, negIncomeMax, negCreditMin, negCreditMax, 40)
    .map(p => ({ x: p.x, y: p.y, label: 0 as 0 }));

  data.push(...posPoints, ...negPoints);
  
  return data;
}

function generatePolynomialData(): DataPoint[] {
  const data: DataPoint[] = [];
  
  // On Track students (blue points) - create a single well-defined cluster
  // High study hours, high scores - top right area
  for (let i = 0; i < 50; i++) {
    const hours = 25 + Math.random() * 15; // 25-40 hours
    const score = 75 + Math.random() * 20; // 75-95 scores
    data.push({
      x: hours,
      y: score,
      label: 1
    });
  }
  
  // Needs Support students (orange points) - create a single well-defined cluster
  // Low study hours, low scores - bottom left area
  for (let i = 0; i < 50; i++) {
    const hours = 5 + Math.random() * 15; // 5-20 hours
    const score = 20 + Math.random() * 30; // 20-50 scores
    data.push({
      x: hours,
      y: score,
      label: 0
    });
  }
  
  return data;
}

function generateRBFData(): DataPoint[] {
  const data: DataPoint[] = [];
  
  // Loyal customers (slightly larger compact cluster)
  const center = { x: 22, y: 95 };
  const rx = 5;   // widen a bit
  const ry = 9;   // taller a bit
  for (let i = 0; i < 60; i++) {
    // Rejection sample to ensure points stay within ellipse boundary
    let px = 0; let py = 0; let ok = false; let guard = 0;
    while (!ok && guard < 100) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()); // denser near center
      px = center.x + Math.cos(angle) * rx * r + (Math.random() - 0.5) * 0.6; // tiny jitter
      py = center.y + Math.sin(angle) * ry * r + (Math.random() - 0.5) * 0.8; // tiny jitter
      const nx = (px - center.x) / rx;
      const ny = (py - center.y) / ry;
      ok = nx * nx + ny * ny <= 1.0; // inside ellipse
      guard++;
    }
    data.push({ x: px, y: py, label: 1 });
  }
  
  // Occasional shoppers (their own compact cluster, separate from loyal)
  const centerNeg = { x: 10, y: 50 };
  const rxNeg = 6;
  const ryNeg = 8;
  for (let i = 0; i < 50; i++) {
    let qx = 0; let qy = 0; let ok = false; let guard = 0;
    while (!ok && guard < 100) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random());
      qx = centerNeg.x + Math.cos(angle) * rxNeg * r + (Math.random() - 0.5) * 0.8;
      qy = centerNeg.y + Math.sin(angle) * ryNeg * r + (Math.random() - 0.5) * 1.0;
      const nx = (qx - centerNeg.x) / rxNeg;
      const ny = (qy - centerNeg.y) / ryNeg;
      ok = nx * nx + ny * ny <= 1.0;
      // keep well outside loyal ellipse too
      const lx = (qx - center.x) / (rx * 1.1);
      const ly = (qy - center.y) / (ry * 1.1);
      if (lx * lx + ly * ly <= 1.0) ok = false;
      guard++;
    }
    data.push({ x: qx, y: qy, label: 0 });
  }
  
  return data;
}

function generateSigmoidData(): DataPoint[] {
  const data: DataPoint[] = [];
  
  // At Risk (older age, high cholesterol - S-curve)
  for (let i = 0; i < 50; i++) {
    const age = 50 + Math.random() * 35; // 50-85
    const cholesterol = 200 + (age - 50) * 3 + Math.random() * 50;
    data.push({
      x: age,
      y: cholesterol,
      label: cholesterol > 220 ? 1 : 0
    });
  }
  
  // Healthy Range (younger, lower cholesterol)
  for (let i = 0; i < 50; i++) {
    const age = 25 + Math.random() * 35; // 25-60
    const cholesterol = 150 + age * 0.5 + Math.random() * 40;
    data.push({
      x: age,
      y: cholesterol,
      label: cholesterol > 220 ? 1 : 0
    });
  }
  
  return data;
}

export const datasets: Dataset[] = [
  {
    id: 'loan',
    name: 'Loan Approval Dataset',
    icon: '🏦',
    description: 'Bank deciding which loans to approve',
    scenario: 'Banking professionals analyzing loan approvals',
    xAxisLabel: 'Annual Income ($)',
    yAxisLabel: 'Credit Score',
    xAxisExplanation: 'Moving right → Higher income',
    yAxisExplanation: 'Moving up → Better credit score',
    positiveLabel: 'Approved',
    negativeLabel: 'Rejected',
    positiveColor: 'hsl(140, 50%, 55%)', // success green
    negativeColor: 'hsl(0, 70%, 65%)', // destructive red
    kernel: 'linear',
    data: generateLinearData(),
    overview: {
      whatYouSee: 'This shows 100 loan applications. Each dot is one person applying for a loan.',
      theGroups: 'Green dots = Approved loans, Red dots = Rejected loans',
      measuring: 'We\'re looking at their income (left to right) and credit score (bottom to top)'
    }
  },
  {
    id: 'students',
    name: 'Student Performance Zones',
    icon: '📚',
    description: 'Teacher identifying students who need help',
    scenario: 'Teachers understanding student performance patterns',
    xAxisLabel: 'Study Hours per Week',
    yAxisLabel: 'Quiz Score (%)',
    xAxisExplanation: 'Moving right → More study hours',
    yAxisExplanation: 'Moving up → Higher quiz scores',
    positiveLabel: 'On Track',
    negativeLabel: 'Needs Support',
    positiveColor: 'hsl(210, 80%, 65%)', // primary blue
    negativeColor: 'hsl(25, 85%, 65%)', // warning coral
    kernel: 'polynomial',
    data: generatePolynomialData(),
    overview: {
      whatYouSee: 'This shows 100 students. Each dot represents one student\'s weekly study habits and performance.',
      theGroups: 'Blue dots = Students on track, Orange dots = Students needing support',
      measuring: 'We\'re tracking study hours per week and quiz scores'
    }
  },
  {
    id: 'customers',
    name: 'Customer Shopping Patterns',
    icon: '🛍️',
    description: 'Store understanding customer loyalty',
    scenario: 'Business analysts reviewing shopping behaviors',
    xAxisLabel: 'Purchase Frequency (times/month)',
    yAxisLabel: 'Average Spend ($)',
    xAxisExplanation: 'Moving right → More frequent purchases',
    yAxisExplanation: 'Moving up → Higher spending',
    positiveLabel: 'Loyal Customer',
    negativeLabel: 'Occasional Shopper',
    positiveColor: 'hsl(280, 60%, 70%)', // secondary purple
    negativeColor: 'hsl(220, 10%, 45%)', // muted gray
    kernel: 'rbf',
    data: generateRBFData(),
    overview: {
      whatYouSee: 'This shows 100 customers. Each dot is a customer\'s shopping pattern over the past 6 months.',
      theGroups: 'Purple dots = Loyal customers, Gray dots = Occasional shoppers',
      measuring: 'We\'re looking at how often they shop and how much they spend'
    }
  },
  {
    id: 'health',
    name: 'Health Risk Assessment',
    icon: '🏥',
    description: 'Clinic identifying patients at risk',
    scenario: 'Healthcare workers reviewing patient risk categories',
    xAxisLabel: 'Age (years)',
    yAxisLabel: 'Cholesterol Level (mg/dL)',
    xAxisExplanation: 'Moving right → Older age',
    yAxisExplanation: 'Moving up → Higher cholesterol',
    positiveLabel: 'At Risk',
    negativeLabel: 'Healthy Range',
    positiveColor: 'hsl(0, 70%, 65%)', // destructive red
    negativeColor: 'hsl(140, 50%, 55%)', // success green
    kernel: 'sigmoid',
    data: generateSigmoidData(),
    overview: {
      whatYouSee: 'This shows 100 patients. Each dot represents one patient\'s health indicators.',
      theGroups: 'Red dots = At risk patients, Green dots = Healthy range',
      measuring: 'We\'re comparing age with cholesterol levels'
    }
  }
];

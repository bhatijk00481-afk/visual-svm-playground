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
  
  // Approved loans (higher income, better credit)
  for (let i = 0; i < 60; i++) {
    data.push({
      x: 40000 + Math.random() * 60000, // Income: 40k-100k
      y: 650 + Math.random() * 200, // Credit: 650-850
      label: 1
    });
  }
  
  // Rejected loans (lower income, worse credit)
  for (let i = 0; i < 40; i++) {
    data.push({
      x: 15000 + Math.random() * 35000, // Income: 15k-50k
      y: 400 + Math.random() * 200, // Credit: 400-600
      label: 0
    });
  }
  
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
  
  // Loyal customers (frequent, high spend - forms clusters)
  const centers = [
    { x: 20, y: 80 },
    { x: 25, y: 100 },
    { x: 18, y: 120 }
  ];
  
  centers.forEach(center => {
    for (let i = 0; i < 20; i++) {
      data.push({
        x: center.x + (Math.random() - 0.5) * 10,
        y: center.y + (Math.random() - 0.5) * 30,
        label: 1
      });
    }
  });
  
  // Occasional shoppers (spread out, lower frequency/spend)
  for (let i = 0; i < 40; i++) {
    data.push({
      x: 2 + Math.random() * 15,
      y: 20 + Math.random() * 60,
      label: 0
    });
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
    name: 'Loan Approval Predictor',
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

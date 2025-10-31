import { useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { DatasetSelector } from "@/components/DatasetSelector";
import { DatasetOverview } from "@/components/DatasetOverview";
import { SVMVisualization } from "@/components/SVMVisualization";
import { ModelSummary } from "@/components/ModelSummary";
import { UnderstandingCards } from "@/components/UnderstandingCards";
import { ControlPanel } from "@/components/ControlPanel";
import { datasets, Dataset } from "@/data/datasets";
import { SimpleSVMEngine, SVMResult } from "@/lib/svm-engine";

const Index = () => {
  const [selectedDataset, setSelectedDataset] = useState<Dataset>(datasets[0]);
  const [C, setC] = useState<number>(1.0);
  const [gamma, setGamma] = useState<number>(0.1);
  const [polynomialDegree, setPolynomialDegree] = useState<number>(2);
  const [svmResult, setSvmResult] = useState<SVMResult | null>(null);

  // Train SVM whenever parameters change
  useEffect(() => {
    const engine = new SimpleSVMEngine(selectedDataset.data, C, gamma, selectedDataset.kernel, polynomialDegree);
    const result = engine.train();
    setSvmResult(result);
  }, [selectedDataset, C, gamma, polynomialDegree]);

  const handleReset = () => {
    setC(1.0);
    setGamma(0.1);
    setPolynomialDegree(2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Hero />
      
      <DatasetSelector 
        selectedDataset={selectedDataset}
        onSelectDataset={(dataset) => {
          setSelectedDataset(dataset);
          // Reset parameters when switching datasets
          setC(1.0);
          setGamma(0.1);
        }}
      />

      {selectedDataset && svmResult && (
        <>
          <DatasetOverview dataset={selectedDataset} />
          
          <ControlPanel
            selectedDataset={selectedDataset}
            onSelectDataset={(dataset) => {
              setSelectedDataset(dataset);
              handleReset();
            }}
            C={C}
            gamma={gamma}
            onCChange={setC}
            onGammaChange={setGamma}
            onReset={handleReset}
            polynomialDegree={polynomialDegree}
            onPolynomialDegreeChange={setPolynomialDegree}
          />

          <SVMVisualization 
            dataset={selectedDataset}
            result={svmResult}
            C={C}
            gamma={gamma}
            polynomialDegree={polynomialDegree}
          />

          <ModelSummary 
            dataset={selectedDataset}
            result={svmResult}
          />

          {/* ParameterControls removed as requested */}

          <UnderstandingCards
            dataset={selectedDataset}
            result={svmResult}
            C={C}
            gamma={gamma}
          />
        </>
      )}

      {/* Footer */}
      <footer className="px-6 py-12 mt-16 border-t border-border/50">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Ready to Learn More?</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            You've just explored Support Vector Machines (SVMs) — a powerful way computers learn to classify data. 
            Try different scenarios and settings to build your intuition!
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <div className="px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium">
              ✓ No math required
            </div>
            <div className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              ✓ Real-world examples
            </div>
            <div className="px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
              ✓ Interactive learning
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

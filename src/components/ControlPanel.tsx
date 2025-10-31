import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Dataset } from "@/data/datasets";

interface ControlPanelProps {
  selectedDataset: Dataset;
  onSelectDataset: (dataset: Dataset) => void;
  C: number;
  gamma: number;
  onCChange: (value: number) => void;
  onGammaChange: (value: number) => void;
  onReset: () => void;
  polynomialDegree?: number;
  onPolynomialDegreeChange?: (value: number) => void;
}

export const ControlPanel = ({
  C,
  onCChange,
  gamma,
  onGammaChange,
  selectedDataset,
  polynomialDegree = 2,
  onPolynomialDegreeChange,
}: ControlPanelProps) => {

  const getEmojiForC = () => {
    if (C < 2) return '😊';
    if (C < 5) return '😐';
    return '😤';
  };

  // Only strictness control is kept

  // Determine selected RBF preset based on current gamma/C
  const getRbfPreset = () => {
    if (selectedDataset?.kernel !== 'rbf') return '';
    if (gamma >= 5 || C >= 50) return 'high';
    if (gamma <= 0.2 && C <= 5) return 'low';
    return 'balanced';
  };
  const rbfPreset = getRbfPreset();

  return (
    <div className="px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <Card className="card-neuro p-8">
          <h3 className="text-2xl font-bold text-foreground mb-6">Control Panel</h3>

          {/* Strictness Slider hidden for RBF */}
          {(!selectedDataset || selectedDataset.kernel !== 'rbf') && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Strictness Level
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getEmojiForC()}</span>
                  <div className="px-3 py-1 rounded-full card-neuro-inset">
                    <span className="text-sm font-bold text-primary">{C.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              
              <Slider
                value={[C]}
                onValueChange={(values) => onCChange(values[0])}
                min={0.1}
                max={10}
                step={0.1}
                className="mb-4 py-2"
                aria-label="Strictness Level"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Flexible</span>
                <span>Strict</span>
              </div>
            </div>
          )}

          {selectedDataset && selectedDataset.kernel === 'rbf' && (
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Cluster Controls (RBF)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  className={
                    rbfPreset === 'low'
                      ? "px-4 py-2 rounded-lg border border-primary bg-primary/10 text-foreground font-medium"
                      : "px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-secondary/50 transition"
                  }
                  onClick={() => { onGammaChange(0.1); onCChange(1); }}
                  aria-label="Set low gamma and C"
                  aria-pressed={rbfPreset === 'low'}
                >
                  Low gamma/C
                </button>
                <button
                  type="button"
                  className={
                    rbfPreset === 'balanced'
                      ? "px-4 py-2 rounded-lg border border-primary bg-primary/10 text-foreground font-medium"
                      : "px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-secondary/50 transition"
                  }
                  onClick={() => { onGammaChange(1); onCChange(10); }}
                  aria-label="Set balanced gamma and C"
                  aria-pressed={rbfPreset === 'balanced'}
                >
                  Balanced
                </button>
                <button
                  type="button"
                  className={
                    rbfPreset === 'high'
                      ? "px-4 py-2 rounded-lg border border-primary bg-primary/10 text-foreground font-medium"
                      : "px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-secondary/50 transition"
                  }
                  onClick={() => { onGammaChange(10); onCChange(100); }}
                  aria-label="Set high gamma and C"
                  aria-pressed={rbfPreset === 'high'}
                >
                  High gamma/C
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Low = single larger cluster · High = multiple small clusters
              </p>
            </div>
          )}

          {selectedDataset && selectedDataset.kernel === 'polynomial' && onPolynomialDegreeChange && (
            <div className="mb-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Degree
                </h4>
                <div className="px-3 py-1 rounded-full card-neuro-inset">
                  <span className="text-sm font-bold text-accent">Degree {polynomialDegree}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {[1,2,3].map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-label={`Set polynomial degree to ${d}`}
                    onClick={() => onPolynomialDegreeChange(d)}
                    className={
                      d === polynomialDegree
                        ? "px-4 py-2 rounded-lg border border-primary bg-primary/10 text-foreground font-medium"
                        : "px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-secondary/50 transition"
                    }
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

        </Card>
      </div>
    </div>
  );
};

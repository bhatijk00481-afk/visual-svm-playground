import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { datasets, Dataset } from "@/data/datasets";
import { cn } from "@/lib/utils";
import { RotateCcw, Shuffle } from "lucide-react";

interface ControlPanelProps {
  selectedDataset: Dataset;
  onSelectDataset: (dataset: Dataset) => void;
  C: number;
  gamma: number;
  onCChange: (value: number) => void;
  onGammaChange: (value: number) => void;
  onReset: () => void;
}

export const ControlPanel = ({
  selectedDataset,
  onSelectDataset,
  C,
  gamma,
  onCChange,
  onGammaChange,
  onReset,
}: ControlPanelProps) => {
  const handleSurpriseMe = () => {
    const randomC = Math.random() * 9.9 + 0.1;
    const randomGamma = Math.random() * 0.99 + 0.01;
    onCChange(randomC);
    onGammaChange(randomGamma);
  };

  const kernelButtons = [
    { kernel: 'linear', label: 'Straight Line', icon: '─', desc: 'Simple dividing line' },
    { kernel: 'polynomial', label: 'Curved Line', icon: '〰️', desc: 'Wavy boundary' },
    { kernel: 'rbf', label: 'Circles & Clusters', icon: '◯', desc: 'Island-like groups' },
    { kernel: 'sigmoid', label: 'Smooth S-Curve', icon: '∿', desc: 'Gradual transition' },
  ];

  const getEmojiForC = () => {
    if (C < 2) return '😊';
    if (C < 5) return '😐';
    return '😤';
  };

  const getEmojiForGamma = () => {
    if (gamma < 0.2) return '🔭';
    if (gamma < 0.5) return '👁️';
    return '🔬';
  };

  return (
    <div className="px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <Card className="card-neuro p-8">
          <h3 className="text-2xl font-bold text-foreground mb-6">Control Panel</h3>

          {/* Quick Dataset Switcher */}
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Quick Switch Scenario
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {datasets.map((dataset) => (
                <button
                  key={dataset.id}
                  onClick={() => onSelectDataset(dataset)}
                  className={cn(
                    "p-3 rounded-xl text-left transition-all duration-300",
                    selectedDataset.id === dataset.id
                      ? "card-neuro-active"
                      : "card-neuro hover:scale-105"
                  )}
                >
                  <div className="text-2xl mb-1">{dataset.icon}</div>
                  <div className="text-xs font-medium text-foreground">{dataset.name.split(' ')[0]}</div>
                  {selectedDataset.id === dataset.id && (
                    <div className="text-xs text-primary mt-1">✓ Active</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Learning Style */}
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Learning Style
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {kernelButtons.map((btn) => {
                const dataset = datasets.find(d => d.kernel === btn.kernel);
                const isActive = selectedDataset.kernel === btn.kernel;
                
                return (
                  <button
                    key={btn.kernel}
                    onClick={() => dataset && onSelectDataset(dataset)}
                    className={cn(
                      "p-4 rounded-xl text-left transition-all duration-300 group",
                      isActive ? "card-neuro-active" : "card-neuro hover:scale-105"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{btn.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{btn.label}</div>
                        <div className="text-xs text-muted-foreground">{btn.desc}</div>
                      </div>
                      {isActive && <div className="text-primary text-xl">✓</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Strictness Slider */}
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
              className="mb-2"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>Flexible</span>
              <span>Strict</span>
            </div>
          </div>

          {/* Gamma Slider (for RBF kernel) */}
          {selectedDataset.kernel === 'rbf' && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Detail Level
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getEmojiForGamma()}</span>
                  <div className="px-3 py-1 rounded-full card-neuro-inset">
                    <span className="text-sm font-bold text-accent">{gamma.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <Slider
                value={[gamma]}
                onValueChange={(values) => onGammaChange(values[0])}
                min={0.01}
                max={1}
                step={0.01}
                className="mb-2"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Big Picture</span>
                <span>Fine Details</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onReset}
              variant="outline"
              className="btn-neuro flex-1"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Recommended
            </Button>
            <Button
              onClick={handleSurpriseMe}
              variant="outline"
              className="btn-neuro flex-1"
              size="lg"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Surprise Me
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

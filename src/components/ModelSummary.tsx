import { Dataset } from "@/data/datasets";
import { SVMResult } from "@/lib/svm-engine";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Download, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface ModelSummaryProps {
  dataset: Dataset;
  result: SVMResult;
}

export const ModelSummary = ({ dataset, result }: ModelSummaryProps) => {
  const [showTechnical, setShowTechnical] = useState(false);

  const { accuracy, precision, recall, confusionMatrix } = result;
  const { truePositive, falsePositive, trueNegative, falseNegative } = confusionMatrix;

  const getKernelExplanation = () => {
    switch (dataset.kernel) {
      case 'linear':
        return "It learned to draw a straight line separating the groups";
      case 'polynomial':
        return "It learned that the boundary curves like a hill";
      case 'rbf':
        return "It learned to draw circles around similar groups";
      case 'sigmoid':
        return "It learned a smooth S-curve transition";
    }
  };

  return (
    <div className="px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <Card className="card-neuro">
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-bold text-foreground mb-2">
                  How the Computer Learned to Decide
                </h3>
                <p className="text-muted-foreground">
                  Here's what the computer figured out from the data
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {showTechnical ? "Technical View" : "Simple View"}
                </span>
                <Switch
                  checked={showTechnical}
                  onCheckedChange={setShowTechnical}
                />
                {showTechnical ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </div>
            </div>

            {/* Results in Plain English */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
                <div className="text-4xl font-bold text-success mb-2">
                  ✓ {Math.round(accuracy * 100)}%
                </div>
                <div className="text-sm text-foreground font-medium mb-1">Overall Accuracy</div>
                <div className="text-xs text-muted-foreground">
                  Got it right {truePositive + trueNegative} out of {dataset.data.length} times
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <div className="text-4xl font-bold text-primary mb-2">
                  {Math.round(precision * 100)}%
                </div>
                <div className="text-sm text-foreground font-medium mb-1">
                  When it said "{dataset.positiveLabel}"
                </div>
                <div className="text-xs text-muted-foreground">
                  Was correct {truePositive} out of {truePositive + falsePositive} times
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                <div className="text-4xl font-bold text-accent mb-2">
                  {Math.round(recall * 100)}%
                </div>
                <div className="text-sm text-foreground font-medium mb-1">
                  Found {dataset.positiveLabel} cases
                </div>
                <div className="text-xs text-muted-foreground">
                  Caught {truePositive} out of {truePositive + falseNegative} actual ones
                </div>
              </div>
            </div>

            {/* Confusion Matrix - Simple Version */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">Decision Breakdown</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl card-neuro-inset bg-success/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-success font-medium">✓ Correctly {dataset.positiveLabel}</span>
                    <span className="text-2xl font-bold text-success">{truePositive}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Said "{dataset.positiveLabel}" and was right
                  </p>
                </div>

                <div className="p-4 rounded-2xl card-neuro-inset bg-warning/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-warning font-medium">✗ Mistakenly {dataset.positiveLabel}</span>
                    <span className="text-2xl font-bold text-warning">{falsePositive}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Said "{dataset.positiveLabel}" but was wrong
                  </p>
                </div>

                <div className="p-4 rounded-2xl card-neuro-inset bg-success/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-success font-medium">✓ Correctly {dataset.negativeLabel}</span>
                    <span className="text-2xl font-bold text-success">{trueNegative}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Said "{dataset.negativeLabel}" and was right
                  </p>
                </div>

                <div className="p-4 rounded-2xl card-neuro-inset bg-warning/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-warning font-medium">✗ Mistakenly {dataset.negativeLabel}</span>
                    <span className="text-2xl font-bold text-warning">{falseNegative}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Said "{dataset.negativeLabel}" but was wrong
                  </p>
                </div>
              </div>
            </div>

            {/* What the Computer Learned */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="text-xl">💡</span>
                What the Computer Learned
              </h4>
              <p className="text-muted-foreground mb-4">{getKernelExplanation()}</p>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="px-3 py-1 rounded-full bg-primary/20 text-primary font-medium">
                  {result.supportVectors.length} important teaching cases
                </div>
                <span className="text-muted-foreground">
                  These special dots defined where to draw the boundary
                </span>
              </div>
            </div>

            {/* Technical Details (shown when toggled) */}
            {showTechnical && (
              <div className="p-6 rounded-2xl card-neuro-inset space-y-4">
                <h4 className="font-semibold text-foreground">Technical Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Accuracy</div>
                    <div className="font-mono font-bold">{accuracy.toFixed(4)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Precision</div>
                    <div className="font-mono font-bold">{precision.toFixed(4)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Recall</div>
                    <div className="font-mono font-bold">{recall.toFixed(4)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">F1 Score</div>
                    <div className="font-mono font-bold">
                      {((2 * precision * recall) / (precision + recall) || 0).toFixed(4)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-muted-foreground mb-2">Confusion Matrix</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-success/10">TP: {truePositive}</div>
                    <div className="p-2 rounded bg-warning/10">FP: {falsePositive}</div>
                    <div className="p-2 rounded bg-warning/10">FN: {falseNegative}</div>
                    <div className="p-2 rounded bg-success/10">TN: {trueNegative}</div>
                  </div>
                </div>

                <div>
                  <div className="text-muted-foreground mb-2">Support Vectors</div>
                  <div className="text-xs">
                    Indices: [{result.supportVectors.slice(0, 10).join(", ")}
                    {result.supportVectors.length > 10 && "..."}]
                  </div>
                </div>
              </div>
            )}

            {/* Download Options */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50">
              <Button variant="outline" className="btn-neuro" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download decisions (spreadsheet)
              </Button>
              <Button variant="outline" className="btn-neuro" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Save this picture (image)
              </Button>
              {showTechnical && (
                <Button variant="outline" className="btn-neuro" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  See the math behind it (PDF)
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

import { Dataset } from "@/data/datasets";
import { Card } from "@/components/ui/card";
import { BarChart3, Users, TrendingUp } from "lucide-react";

interface DatasetOverviewProps {
  dataset: Dataset;
}

export const DatasetOverview = ({ dataset }: DatasetOverviewProps) => {
  const positiveCount = dataset.data.filter(d => d.label === 1).length;
  const negativeCount = dataset.data.filter(d => d.label === 0).length;
  const total = dataset.data.length;
  const positivePercentage = Math.round((positiveCount / total) * 100);

  return (
    <div className="px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <Card className="card-neuro">
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-border/50">
              <div className="text-4xl">{dataset.icon}</div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">{dataset.name}</h3>
                <p className="text-muted-foreground">{dataset.scenario}</p>
              </div>
            </div>

            {/* Three Info Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* What You're Looking At */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <BarChart3 className="w-5 h-5" />
                  <h4 className="font-semibold">What You're Looking At</h4>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {dataset.overview.whatYouSee}
                </p>
              </div>

              {/* The Two Groups */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-success">
                  <Users className="w-5 h-5" />
                  <h4 className="font-semibold">The Two Groups</h4>
                </div>
                <p className="text-sm text-foreground mb-3">
                  {dataset.overview.theGroups}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: dataset.positiveColor }}
                      />
                      <span className="text-sm">{dataset.positiveLabel}</span>
                    </div>
                    <span className="text-sm font-medium">{positiveCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: dataset.negativeColor }}
                      />
                      <span className="text-sm">{dataset.negativeLabel}</span>
                    </div>
                    <span className="text-sm font-medium">{negativeCount}</span>
                  </div>
                </div>
              </div>

              {/* What We're Measuring */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-accent">
                  <TrendingUp className="w-5 h-5" />
                  <h4 className="font-semibold">What We're Measuring</h4>
                </div>
                <p className="text-sm text-foreground mb-2">
                  {dataset.overview.measuring}
                </p>
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-primary/5">
                    <div className="text-xs font-medium text-primary mb-1">Horizontal Axis (X)</div>
                    <div className="text-xs text-muted-foreground">{dataset.xAxisExplanation}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-accent/5">
                    <div className="text-xs font-medium text-accent mb-1">Vertical Axis (Y)</div>
                    <div className="text-xs text-muted-foreground">{dataset.yAxisExplanation}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Check */}
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Group Balance</span>
                <span className="text-sm font-medium text-foreground">
                  {positivePercentage}% {dataset.positiveLabel}
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden card-neuro-inset">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${positivePercentage}%`,
                    backgroundColor: dataset.positiveColor 
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 italic">
                {Math.abs(positivePercentage - 50) < 10 
                  ? "✓ This data is fairly balanced between both groups" 
                  : `Notice: More ${positivePercentage > 50 ? dataset.positiveLabel : dataset.negativeLabel} cases in this dataset`
                }
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

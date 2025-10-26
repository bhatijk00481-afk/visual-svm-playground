import { useState } from "react";
import { Dataset } from "@/data/datasets";
import { Card } from "@/components/ui/card";
import { SVMResult } from "@/lib/svm-engine";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface SVMVisualizationProps {
  dataset: Dataset;
  result: SVMResult;
  C: number;
  gamma: number;
}

export const SVMVisualization = ({ dataset, result, C, gamma }: SVMVisualizationProps) => {
  const [showSupportVectors, setShowSupportVectors] = useState(true);
  const [showMargins, setShowMargins] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  // Prepare data for Recharts
  const positiveData = dataset.data.filter(d => d.label === 1);
  const negativeData = dataset.data.filter(d => d.label === 0);
  
  // Get support vectors
  const supportVectorData = result.supportVectors.map(idx => dataset.data[idx]);

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
                <ScatterChart
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
                </ScatterChart>
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

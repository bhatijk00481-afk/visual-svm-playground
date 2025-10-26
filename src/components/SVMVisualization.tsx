import { Dataset } from "@/data/datasets";
import { Card } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SVMVisualizationProps {
  dataset: Dataset;
  C: number;
  gamma: number;
}

export const SVMVisualization = ({ dataset, C, gamma }: SVMVisualizationProps) => {
  // Prepare data for Recharts
  const positiveData = dataset.data.filter(d => d.label === 1);
  const negativeData = dataset.data.filter(d => d.label === 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="card-neuro p-3 text-xs">
          <p className="font-semibold mb-1">
            {data.label === 1 ? dataset.positiveLabel : dataset.negativeLabel}
          </p>
          <p className="text-muted-foreground">
            {dataset.xAxisLabel}: {typeof data.x === 'number' ? data.x.toFixed(1) : data.x}
          </p>
          <p className="text-muted-foreground">
            {dataset.yAxisLabel}: {typeof data.y === 'number' ? data.y.toFixed(1) : data.y}
          </p>
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
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">Live Data Visualization</h3>
              <p className="text-muted-foreground">
                Each dot represents one data point. Watch how they separate into groups!
              </p>
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
                    fillOpacity={0.8}
                  />
                  <Scatter
                    name={dataset.negativeLabel}
                    data={negativeData}
                    fill={dataset.negativeColor}
                    fillOpacity={0.8}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

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

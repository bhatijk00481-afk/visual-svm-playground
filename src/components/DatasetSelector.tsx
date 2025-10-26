import { datasets, Dataset } from "@/data/datasets";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DatasetSelectorProps {
  selectedDataset: Dataset;
  onSelectDataset: (dataset: Dataset) => void;
}

export const DatasetSelector = ({ selectedDataset, onSelectDataset }: DatasetSelectorProps) => {
  return (
    <section id="dataset-section" className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose a Real-World Scenario
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pick a situation that matches your work or interests. Each one uses real patterns from that field.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {datasets.map((dataset) => {
            const isSelected = selectedDataset.id === dataset.id;
            
            return (
              <Card
                key={dataset.id}
                className={cn(
                  "cursor-pointer transition-all duration-300 border-0 overflow-hidden group",
                  isSelected ? "card-neuro-active" : "card-neuro hover:scale-105"
                )}
                onClick={() => onSelectDataset(dataset)}
              >
                <div className="p-6 space-y-4">
                  {/* Icon and Badge */}
                  <div className="flex items-center justify-between">
                    <div className="text-5xl transform group-hover:scale-110 transition-transform duration-300">
                      {dataset.icon}
                    </div>
                    {isSelected && (
                      <div className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        Active
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-foreground">
                    {dataset.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {dataset.description}
                  </p>

                  {/* Preview Badge */}
                  <div className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: dataset.positiveColor }}
                    />
                    <span className="text-muted-foreground">{dataset.positiveLabel}</span>
                    <span className="text-muted-foreground/50">vs</span>
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: dataset.negativeColor }}
                    />
                    <span className="text-muted-foreground">{dataset.negativeLabel}</span>
                  </div>

                  {/* Kernel Badge */}
                  <div className="pt-2">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-background text-xs font-medium card-neuro-inset">
                      <span className="capitalize">{dataset.kernel}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Helper Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground italic">
            💡 Not sure which to pick? Try "Loan Approval" first — it has the clearest pattern!
          </p>
        </div>
      </div>
    </section>
  );
};

import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ParameterControlsProps {
  C: number;
  gamma: number;
  onCChange: (value: number) => void;
  onGammaChange: (value: number) => void;
}

export const ParameterControls = ({ C, gamma, onCChange, onGammaChange }: ParameterControlsProps) => {
  return (
    <div className="px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <Card className="card-neuro">
          <div className="p-8 space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Adjust the Learning</h3>
              <p className="text-muted-foreground">
                Move these sliders to see how the computer's decision-making changes in real-time
              </p>
            </div>

            {/* C Parameter - Flexibility */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-semibold text-foreground">Flexibility</h4>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="card-neuro max-w-xs">
                        <p className="text-sm">
                          <strong>Lower values:</strong> The computer is more flexible and allows some mistakes to find a simpler pattern
                          <br /><br />
                          <strong>Higher values:</strong> The computer tries harder to get everything exactly right, even if it means a more complex pattern
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="px-4 py-2 rounded-full card-neuro-inset">
                  <span className="text-lg font-bold text-primary">{C.toFixed(1)}</span>
                </div>
              </div>

              <div className="px-4">
                <Slider
                  value={[C]}
                  onValueChange={(values) => onCChange(values[0])}
                  min={0.1}
                  max={10}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground px-4">
                <span>More flexible<br />(Allows mistakes)</span>
                <span className="text-center">Balanced</span>
                <span className="text-right">Very strict<br />(Avoids mistakes)</span>
              </div>

              <div className="p-4 rounded-2xl bg-primary/5">
                <p className="text-sm text-muted-foreground">
                  {C < 2 
                    ? "🌊 Flexible mode: The line is smoother but might miss some points" 
                    : C < 5 
                    ? "⚖️ Balanced mode: Good mix of accuracy and simplicity"
                    : "🎯 Strict mode: Trying to classify every point perfectly"
                  }
                </p>
              </div>
            </div>

            {/* Gamma Parameter - Sensitivity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-semibold text-foreground">Sensitivity</h4>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="card-neuro max-w-xs">
                        <p className="text-sm">
                          <strong>Lower values:</strong> The computer looks at the big picture and makes broader generalizations
                          <br /><br />
                          <strong>Higher values:</strong> The computer pays attention to small details and makes more specific boundaries
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="px-4 py-2 rounded-full card-neuro-inset">
                  <span className="text-lg font-bold text-accent">{gamma.toFixed(2)}</span>
                </div>
              </div>

              <div className="px-4">
                <Slider
                  value={[gamma]}
                  onValueChange={(values) => onGammaChange(values[0])}
                  min={0.01}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground px-4">
                <span>Big picture<br />(Broad patterns)</span>
                <span className="text-center">Moderate</span>
                <span className="text-right">Fine details<br />(Specific patterns)</span>
              </div>

              <div className="p-4 rounded-2xl bg-accent/5">
                <p className="text-sm text-muted-foreground">
                  {gamma < 0.2 
                    ? "🔭 Big picture view: Looking for general trends across all data" 
                    : gamma < 0.5 
                    ? "👁️ Moderate view: Balancing general trends with local patterns"
                    : "🔬 Detailed view: Paying attention to small clusters and details"
                  }
                </p>
              </div>
            </div>

            {/* Combined Explanation */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="text-xl">💡</span>
                How These Work Together
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Think of it like teaching someone to sort items: <strong>Flexibility</strong> is how strict you are about mistakes, 
                and <strong>Sensitivity</strong> is how much detail they should pay attention to. Finding the right balance helps 
                the computer learn patterns that work well with new data!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

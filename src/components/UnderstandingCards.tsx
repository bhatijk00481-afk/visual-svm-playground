import { Card } from "@/components/ui/card";
import { Dataset } from "@/data/datasets";
import { SVMResult } from "@/lib/svm-engine";
import { Lightbulb, Shield, Target, TrendingUp } from "lucide-react";

interface UnderstandingCardsProps {
  dataset: Dataset;
  result: SVMResult;
  C: number;
  gamma: number;
}

export const UnderstandingCards = ({ dataset, result, C, gamma }: UnderstandingCardsProps) => {
  const getStrictnessLevel = () => {
    if (C < 2) return { level: "Flexible", emoji: "🌊", desc: "Allows some mistakes for a smoother pattern" };
    if (C < 5) return { level: "Balanced", emoji: "⚖️", desc: "Good mix of accuracy and simplicity" };
    return { level: "Very Strict", emoji: "🎯", desc: "Tries to get every case exactly right" };
  };

  const getDetailLevel = () => {
    if (gamma < 0.2) return { level: "Big Picture", emoji: "🔭", desc: "Looking for general trends" };
    if (gamma < 0.5) return { level: "Moderate", emoji: "👁️", desc: "Balancing broad and local patterns" };
    return { level: "Fine Details", emoji: "🔬", desc: "Paying attention to specific clusters" };
  };

  const strictness = getStrictnessLevel();
  const detail = getDetailLevel();

  return (
    <div className="px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-foreground mb-3">Understanding the Magic</h3>
          <p className="text-lg text-muted-foreground">
            Let's break down how the computer actually learned to make decisions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: What Is This Line? */}
          <Card className="card-neuro p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-xl font-semibold text-foreground">What Is This Line?</h4>
            </div>
            
            <div className="space-y-3 text-muted-foreground">
              <p className="leading-relaxed">
                Imagine you're sorting apples into "good" and "bad". You'd draw an imaginary line: 
                apples on this side are good, on that side are bad.
              </p>
              <p className="leading-relaxed">
                That's exactly what the computer does with data! It finds the best way to separate 
                the groups so that similar cases end up on the same side.
              </p>
              <div className="p-3 rounded-xl bg-primary/5 text-sm italic">
                💡 For your {dataset.name}, it's separating {dataset.positiveLabel} from {dataset.negativeLabel}
              </div>
            </div>
          </Card>

          {/* Card 2: Important Teaching Cases */}
          <Card className="card-neuro p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-success/10">
                <Target className="w-6 h-6 text-success" />
              </div>
              <h4 className="text-xl font-semibold text-foreground">Important Teaching Cases</h4>
            </div>
            
            <div className="space-y-3 text-muted-foreground">
              <p className="leading-relaxed">
                The computer doesn't need to look at EVERY case to learn. It only focuses on 
                the tricky ones right at the edge — these are called <strong>"support vectors"</strong>.
              </p>
              <p className="leading-relaxed">
                They're like guardrails that keep the boundary line in the right place. Move a support 
                vector, and the whole decision line shifts!
              </p>
              <div className="p-3 rounded-xl bg-success/5 text-sm">
                <strong className="text-success">{result.supportVectors.length} special cases</strong> 
                <span className="ml-1">taught the computer where to draw the line</span>
              </div>
            </div>
          </Card>

          {/* Card 3: The Safety Buffer */}
          <Card className="card-neuro p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-warning/10">
                <Shield className="w-6 h-6 text-warning" />
              </div>
              <h4 className="text-xl font-semibold text-foreground">What's the Safety Buffer?</h4>
            </div>
            
            <div className="space-y-3 text-muted-foreground">
              <p className="leading-relaxed">
                The computer doesn't just draw a line — it creates a "zone of doubt" around it. 
                It's most confident when cases are far from this zone.
              </p>
              <p className="leading-relaxed">
                Think of it like a cliff edge with a caution area. The farther you are from the edge, 
                the safer you feel!
              </p>
              <div className="p-3 rounded-xl bg-warning/5 text-sm italic">
                ⚠️ Cases inside the buffer zone are borderline — the computer is less certain about them
              </div>
            </div>
          </Card>

          {/* Card 4: Your Current Settings */}
          <Card className="card-neuro p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-accent/10">
                <Lightbulb className="w-6 h-6 text-accent" />
              </div>
              <h4 className="text-xl font-semibold text-foreground">Why These Settings?</h4>
            </div>
            
            <div className="space-y-4 text-muted-foreground">
              <div className="p-3 rounded-xl card-neuro-inset">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground">Flexibility Level</span>
                  <span className="text-2xl">{strictness.emoji}</span>
                </div>
                <div className="text-sm">
                  <strong className="text-primary">{strictness.level}:</strong> {strictness.desc}
                </div>
              </div>

              <div className="p-3 rounded-xl card-neuro-inset">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground">Detail Level</span>
                  <span className="text-2xl">{detail.emoji}</span>
                </div>
                <div className="text-sm">
                  <strong className="text-accent">{detail.level}:</strong> {detail.desc}
                </div>
              </div>

              <p className="text-sm italic">
                💡 Try adjusting these to see how the computer's decisions change!
              </p>
            </div>
          </Card>
        </div>

        {/* How Do We Know It's Working? */}
        <Card className="card-neuro mt-6 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-gradient-to-br from-success/20 to-primary/20">
              <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-2xl font-semibold text-foreground">How Do We Know It's Working?</h4>
          </div>

          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              We test the computer's decisions against what we already know is correct. Think of it like 
              checking a student's homework against the answer key.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-success/5 border border-success/20">
                <div className="text-success font-semibold mb-2">✓ Got It Right</div>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {result.confusionMatrix.truePositive + result.confusionMatrix.trueNegative}
                </div>
                <div className="text-xs text-muted-foreground">
                  Out of {dataset.data.length} total cases
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-warning/5 border border-warning/20">
                <div className="text-warning font-semibold mb-2">✗ Made Mistakes</div>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {result.confusionMatrix.falsePositive + result.confusionMatrix.falseNegative}
                </div>
                <div className="text-xs text-muted-foreground">
                  {((result.confusionMatrix.falsePositive + result.confusionMatrix.falseNegative) / dataset.data.length * 100).toFixed(1)}% error rate
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 text-sm">
              <strong className="text-foreground">Remember:</strong> 
              <span className="text-muted-foreground ml-1">
                No computer is perfect! The goal is to find a good balance between getting cases right 
                and keeping the pattern simple enough to work with new data.
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

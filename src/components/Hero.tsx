import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, HelpCircle } from "lucide-react";

export const Hero = () => {
  return (
    <section className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-20 left-[10%] w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 animate-float" />
        <div className="absolute top-40 right-[15%] w-24 h-24 rounded-full bg-gradient-to-br from-secondary/20 to-warning/20 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-[20%] w-40 h-40 rounded-full bg-gradient-to-br from-success/20 to-primary/20 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-40 right-[25%] w-28 h-28 rounded-full bg-gradient-to-br from-accent/20 to-secondary/20 animate-float" style={{ animationDelay: '3s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 text-primary font-medium mb-4 card-neuro-inset">
          <Sparkles className="w-5 h-5" />
          <span>No Math Required</span>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
          See How Machines Learn to Sort Things Into Groups
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Just click, explore, and understand — watch how a computer learns to separate loans into "approved" and "rejected" or students into "needs help" and "doing well"
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button 
            size="lg" 
            className="btn-neuro bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-10 py-6"
            onClick={() => document.getElementById('dataset-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Start Exploring
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                variant="outline" 
                className="btn-neuro bg-background text-foreground border-0 text-lg px-10 py-6"
              >
                <HelpCircle className="w-5 h-5 mr-2" />
                What is This?
              </Button>
            </DialogTrigger>
            <DialogContent className="card-neuro max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl">Welcome to Interactive Machine Learning!</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-foreground">
                <p className="text-lg leading-relaxed">
                  This tool helps you understand how computers learn to make decisions by looking at patterns in data — without any complicated math or programming.
                </p>
                
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-primary/5">
                    <h3 className="font-semibold text-primary mb-2">🎯 What You'll Learn</h3>
                    <p className="text-muted-foreground">
                      How machines draw invisible lines or boundaries to separate different groups — like approved vs rejected loans, or healthy vs at-risk patients.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-success/5">
                    <h3 className="font-semibold text-success mb-2">👥 Who It's For</h3>
                    <p className="text-muted-foreground">
                      Bank employees, teachers, healthcare workers, business analysts — anyone who works with data but doesn't need to be a programmer.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-accent/5">
                    <h3 className="font-semibold text-accent mb-2">🚀 How It Works</h3>
                    <p className="text-muted-foreground">
                      Pick a real-world scenario (like loan approvals), adjust some simple settings, and watch as the computer figures out how to separate the groups. Everything updates instantly!
                    </p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground italic pt-2">
                  Technical note: This demonstrates Support Vector Machines (SVMs), a popular machine learning technique. But you don't need to know that to use it!
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-8 pt-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
            <span>Real-time visualization</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
            <span>No technical knowledge needed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
            <span>Learn by exploring</span>
          </div>
        </div>
      </div>
    </section>
  );
};

import { useState, useEffect } from "react";
import { Shield, Globe, Mic, Zap, Database, Brain, ImageIcon, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";
import AnalysisInput from "@/components/AnalysisInput";
import ResultPanel from "@/components/ResultPanel";
import { AnalysisResult } from "@/lib/types";
import { analyzeNews, analyzeUrl } from "@/lib/analyze";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const PIPELINE_STEPS = [
  { icon: Globe, label: "Detecting language..." },
  { icon: Brain, label: "Extracting claims..." },
  { icon: Database, label: "Matching against claims database..." },
  { icon: Shield, label: "Verifying events & entities..." },
  { icon: Zap, label: "Checking trusted sources..." },
  { icon: Shield, label: "Detecting manipulation signals..." },
  { icon: Brain, label: "Calculating trust score..." },
];

const Index = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isLoading) { setCurrentStep(0); return; }
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < PIPELINE_STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleAnalyze = async (text: string) => {
    setIsLoading(true); setResult(null);
    try { setResult(await analyzeNews(text)); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Analysis failed"); }
    finally { setIsLoading(false); }
  };

  const handleAnalyzeUrl = async (url: string) => {
    setIsLoading(true); setResult(null);
    try { setResult(await analyzeUrl(url)); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Could not analyze this URL"); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 md:py-20">
        {!result && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 space-y-4">
            {/* Emotional Hook / Mission */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 mb-4"
            >
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-bold text-destructive">Stop Fake News Before It Spreads</span>
            </motion.div>

            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Check if a news article is
              <br />
              <span className="text-primary">fake in seconds</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              AI + real-time internet verification. Paste any news text, URL, or upload a screenshot and get instant results with proof links from trusted sources.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {[
                { icon: Globe, label: "Multi-Language" },
                { icon: Mic, label: "Voice Input" },
                { icon: ImageIcon, label: "Screenshot OCR" },
                { icon: Database, label: "Claims Database" },
                { icon: Zap, label: "AI Verified" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-xs font-medium text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 space-y-6 max-w-md mx-auto">
            <div className="relative inline-flex items-center justify-center w-20 h-20">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <AnimatePresence mode="wait">
                {PIPELINE_STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  if (i !== currentStep) return null;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
                      <StepIcon className="h-4 w-4 text-primary" />{step.label}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              {PIPELINE_STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= currentStep ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Step {currentStep + 1} of {PIPELINE_STEPS.length}</p>
          </motion.div>
        )}

        {result ? (
          <ResultPanel result={result} onReset={() => setResult(null)} />
        ) : (
          !isLoading && <AnalysisInput onSubmit={handleAnalyze} onSubmitUrl={handleAnalyzeUrl} isLoading={isLoading} />
        )}
      </main>
    </div>
  );
};

export default Index;

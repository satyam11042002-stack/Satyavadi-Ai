import { useState } from "react";
import { Shield, Globe, Mic, Zap } from "lucide-react";
import Header from "@/components/Header";
import AnalysisInput from "@/components/AnalysisInput";
import ResultPanel from "@/components/ResultPanel";
import { AnalysisResult } from "@/lib/types";
import { analyzeNews, analyzeUrl } from "@/lib/analyze";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Index = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async (text: string) => {
    setIsLoading(true);
    setResult(null);
    try {
      const analysis = await analyzeNews(text);
      setResult(analysis);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeUrl = async (url: string) => {
    setIsLoading(true);
    setResult(null);
    try {
      const analysis = await analyzeUrl(url);
      setResult(analysis);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not analyze this URL");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 md:py-20">
        {!result && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10 space-y-4"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              AI Misinformation Detection
              <br />
              <span className="text-primary">Platform</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Analyze news articles, WhatsApp forwards, and claims in any language. Get AI-powered trust scores with multi-layer verification.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {[
                { icon: Globe, label: "Multi-Language" },
                { icon: Mic, label: "Voice Input" },
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 space-y-4"
          >
            <div className="relative inline-flex items-center justify-center w-20 h-20">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Running AI analysis pipeline...</p>
            <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground/70">
              <span>Language Detection → Claim Extraction → Event Verification</span>
              <span>Source Matching → Manipulation Detection → Trust Score</span>
            </div>
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

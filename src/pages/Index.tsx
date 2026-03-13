import { useState } from "react";
import { Shield } from "lucide-react";
import Header from "@/components/Header";
import AnalysisInput from "@/components/AnalysisInput";
import ResultPanel from "@/components/ResultPanel";
import { AnalysisResult } from "@/lib/types";
import { analyzeNews } from "@/lib/analyze";
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 md:py-20">
        {!result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10 space-y-4"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Check if a news article is fake
              <br />
              <span className="text-primary">in seconds</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Paste any news article, headline, or URL below. Our AI will analyze it for credibility, emotional manipulation, and source reliability.
            </p>
          </motion.div>
        )}

        {result ? (
          <ResultPanel result={result} onReset={() => setResult(null)} />
        ) : (
          <AnalysisInput onSubmit={handleAnalyze} isLoading={isLoading} />
        )}
      </main>
    </div>
  );
};

export default Index;

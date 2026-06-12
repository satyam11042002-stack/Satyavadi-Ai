import { useState } from "react";
import { Shield, CheckCircle, XCircle, AlertTriangle, Send, RotateCcw } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import TrustScoreRing from "@/components/TrustScoreRing";

interface VerifyResult {
  status: "correct" | "incorrect" | "partially_correct";
  confidenceScore: number;
  analysis: {
    factuallyCorrect: boolean;
    missingInfo?: string | null;
    misleadingInfo?: string | null;
  };
  correctedAnswer: string;
  improvedVersion: string;
  keyPoints: string[];
  finalVerdict: string;
}

const statusConfig = {
  correct: { icon: CheckCircle, label: "✅ Correct", className: "bg-success/10 text-success border-success/30" },
  incorrect: { icon: XCircle, label: "❌ Incorrect", className: "bg-destructive/10 text-destructive border-destructive/30" },
  partially_correct: { icon: AlertTriangle, label: "⚠️ Partially Correct", className: "bg-warning/10 text-warning border-warning/30" },
};

const VerifyPage = () => {
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (!question.trim() || !aiAnswer.trim()) {
      toast.error("Please enter both a question and an AI answer");
      return;
    }
    setIsLoading(true);
    setResult(null);
    try {
      const data = await callEdgeFunction("verify-answer", {
        question: question.trim(),
        aiAnswer: aiAnswer.trim(),
      });
      setResult(data);
    } catch (err) {
      console.error("Verify error:", err);
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setQuestion("");
    setAiAnswer("");
  };

  const cfg = result ? statusConfig[result.status] : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 md:py-20 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Verify AI Answer
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Paste any question and the AI's answer — Satyavadi AI will fact-check it and provide corrections.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Question</label>
                <Textarea
                  placeholder="e.g. What is the capital of Australia?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">AI Answer to verify</label>
                <Textarea
                  placeholder="e.g. The capital of Australia is Sydney."
                  value={aiAnswer}
                  onChange={(e) => setAiAnswer(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              <Button onClick={handleVerify} disabled={isLoading} className="w-full gap-2" size="lg">
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Verify Answer
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Status Badge */}
              {cfg && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm ${cfg.className}`}>
                  <cfg.icon className="h-4 w-4" />
                  {cfg.label}
                </div>
              )}

              {/* Confidence Score */}
              <div className="flex justify-center">
                <TrustScoreRing score={result.confidenceScore} size={120} />
              </div>

              {/* Analysis */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h3 className="font-semibold text-foreground text-sm">🧠 Analysis</h3>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>
                    <span className="font-medium text-foreground">Factually correct:</span>{" "}
                    {result.analysis.factuallyCorrect ? "Yes" : "No"}
                  </li>
                  {result.analysis.missingInfo && (
                    <li>
                      <span className="font-medium text-foreground">Missing info:</span> {result.analysis.missingInfo}
                    </li>
                  )}
                  {result.analysis.misleadingInfo && (
                    <li>
                      <span className="font-medium text-foreground">Misleading info:</span> {result.analysis.misleadingInfo}
                    </li>
                  )}
                </ul>
              </div>

              {/* Corrected Answer */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-2">
                <h3 className="font-semibold text-foreground text-sm">✔ Corrected Answer</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.correctedAnswer}</p>
              </div>

              {/* Improved Version */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-2">
                <h3 className="font-semibold text-foreground text-sm">🔄 Improved Version</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.improvedVersion}</p>
              </div>

              {/* Key Points */}
              {result.keyPoints && result.keyPoints.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5 space-y-2">
                  <h3 className="font-semibold text-foreground text-sm">📌 Key Points</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    {result.keyPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Final Verdict */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <h3 className="font-semibold text-foreground text-sm mb-1">🔍 Final Verdict</h3>
                <p className="text-sm text-foreground">{result.finalVerdict}</p>
              </div>

              <Button onClick={handleReset} variant="outline" className="w-full gap-2">
                <RotateCcw className="h-4 w-4" />
                Verify Another Answer
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default VerifyPage;

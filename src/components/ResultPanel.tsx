import { AnalysisResult } from "@/lib/types";
import VerdictBadge from "./VerdictBadge";
import TrustScoreRing from "./TrustScoreRing";
import AnalysisSignals from "./AnalysisSignals";
import ShareCard from "./ShareCard";
import { motion } from "framer-motion";
import { RotateCcw, AlertCircle, Lightbulb, Tag, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultPanelProps {
  result: AnalysisResult;
  onReset: () => void;
}

const probabilityColor = (p: number) => {
  if (p < 35) return "bg-success";
  if (p < 65) return "bg-warning";
  return "bg-destructive";
};

const ResultPanel = ({ result, onReset }: ResultPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-3xl mx-auto space-y-4"
    >
      {/* Main verdict card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <VerdictBadge verdict={result.verdict} />
          <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> New Analysis
          </Button>
        </div>

        {/* Trust Score + Probability */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <TrustScoreRing score={result.trustScore} />
          <div className="flex-1 w-full space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground">Fake News Probability</span>
              <span className="font-bold text-foreground">{result.probability}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.probability}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`h-full rounded-full ${probabilityColor(result.probability)}`}
              />
            </div>
          </div>
        </div>

        {/* Extracted headline */}
        {result.extractedHeadline && (
          <div className="px-3 py-2 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-0.5">Extracted Headline</p>
            <p className="text-sm font-semibold text-foreground">{result.extractedHeadline}</p>
            {result.sourceUrl && (
              <a
                href={result.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
              >
                <ExternalLink className="h-3 w-3" /> View Source
              </a>
            )}
          </div>
        )}

        {/* Analysis Signals */}
        {result.signals && result.signals.length > 0 && (
          <AnalysisSignals signals={result.signals} />
        )}

        {/* Reasons */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-muted-foreground" /> Key Findings
          </h3>
          <ul className="space-y-1">
            {result.reasons.map((r, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Explanation + Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-warning" /> Explanation
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{result.explanation}</p>
          {result.suspiciousKeywords.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" /> Suspicious Keywords
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.suspiciousKeywords.map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs rounded-md bg-destructive/10 text-destructive font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <ShieldCheckIcon /> Fact-Check Suggestions
          </h3>
          <ul className="space-y-1.5">
            {result.factCheckSuggestions.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Share Card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Share This Analysis</h3>
        <ShareCard result={result} />
      </div>

      {/* Original text preview */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">ANALYZED TEXT</h3>
        <p className="text-sm text-foreground/80 line-clamp-3">{result.inputText}</p>
      </div>
    </motion.div>
  );
};

function ShieldCheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
  );
}

export default ResultPanel;

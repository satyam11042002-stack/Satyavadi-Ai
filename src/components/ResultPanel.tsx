import { useState } from "react";
import { AnalysisResult } from "@/lib/types";
import VerdictBadge from "./VerdictBadge";
import TrustScoreRing from "./TrustScoreRing";
import AnalysisSignals from "./AnalysisSignals";
import ShareCard from "./ShareCard";
import { motion } from "framer-motion";
import {
  RotateCcw, AlertCircle, Lightbulb, Tag, ExternalLink,
  ShieldCheck, Users, MapPin, Calendar, Quote, Newspaper,
  AlertTriangle, Eye, Volume2, VolumeX, Database, CheckCircle2,
  XCircle, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ResultPanelProps {
  result: AnalysisResult;
  onReset: () => void;
}

const probabilityColor = (p: number) => {
  if (p < 35) return "bg-success";
  if (p < 65) return "bg-warning";
  return "bg-destructive";
};

const layerStatusColor = (status: string) => {
  if (["confirmed", "matched", "high"].includes(status)) return "text-success";
  if (["unverified", "partial", "medium"].includes(status)) return "text-warning";
  return "text-destructive";
};

const layerStatusBg = (status: string) => {
  if (["confirmed", "matched", "high"].includes(status)) return "bg-success/10 border-success/20";
  if (["unverified", "partial", "medium"].includes(status)) return "bg-warning/10 border-warning/20";
  return "bg-destructive/10 border-destructive/20";
};

const ResultPanel = ({ result, onReset }: ResultPanelProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakResult = () => {
    if (!("speechSynthesis" in window)) {
      toast.error("Text-to-speech not supported in this browser");
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const verdictText = result.verdict === "real" ? "likely real" : result.verdict === "misleading" ? "possibly misleading" : "likely fake";
    const speechText = `According to TruthLens analysis, this claim appears to be ${verdictText} with a trust score of ${result.trustScore} out of 100. ${result.explanation}`;
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    if (result.detectedLanguage && result.detectedLanguage !== "en") {
      const voices = window.speechSynthesis.getVoices();
      const langVoice = voices.find(v => v.lang.startsWith(result.detectedLanguage!));
      if (langVoice) utterance.voice = langVoice;
    }
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const dbMatch = result.claimDatabaseMatch;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-3xl mx-auto space-y-4"
    >
      {/* Main verdict card */}
      <div className="rounded-2xl glass-card-strong p-6 space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <VerdictBadge verdict={result.verdict} />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={speakResult} className="text-muted-foreground hover:text-foreground">
              {isSpeaking ? <VolumeX className="h-4 w-4 text-primary" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> New Analysis
            </Button>
          </div>
        </div>

        {/* Detected Language */}
        {result.detectedLanguage && result.detectedLanguage !== "en" && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            🌐 Analyzed in {result.detectedLanguageName || result.detectedLanguage}
          </div>
        )}

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

        {/* Main Claim Detected */}
        {result.mainClaim && (
          <div className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Quote className="h-3.5 w-3.5" /> Main Claim Detected
            </h3>
            <p className="text-sm font-medium text-foreground leading-relaxed">
              "{result.mainClaim}"
            </p>
          </div>
        )}

        {/* Claim Database Match */}
        {dbMatch?.matched && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`px-4 py-3 rounded-xl border ${
              dbMatch.matchedStatus === "fake"
                ? "bg-destructive/5 border-destructive/20"
                : dbMatch.matchedStatus === "real"
                ? "bg-success/5 border-success/20"
                : "bg-warning/5 border-warning/20"
            }`}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 text-foreground">
              <Database className="h-3.5 w-3.5 text-primary" /> Claims Database Match
            </h3>
            <div className="flex items-start gap-3">
              {dbMatch.matchedStatus === "fake" ? (
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              ) : dbMatch.matchedStatus === "real" ? (
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              ) : (
                <HelpCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">"{dbMatch.matchedClaim}"</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    Status:{" "}
                    <span className={`font-bold uppercase ${
                      dbMatch.matchedStatus === "fake" ? "text-destructive"
                      : dbMatch.matchedStatus === "real" ? "text-success"
                      : "text-warning"
                    }`}>
                      {dbMatch.matchedStatus}
                    </span>
                  </span>
                  <span>Similarity: {dbMatch.similarityScore}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Extracted headline */}
        {result.extractedHeadline && (
          <div className="px-3 py-2 rounded-xl bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-0.5">Extracted Headline</p>
            <p className="text-sm font-semibold text-foreground">{result.extractedHeadline}</p>
            {result.sourceUrl && (
              <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                <ExternalLink className="h-3 w-3" /> View Source
              </a>
            )}
          </div>
        )}

        {/* Verification Layers */}
        {result.verificationLayers && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> Multi-Layer Verification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { key: "eventVerification", label: "Event Verification", data: result.verificationLayers.eventVerification },
                { key: "entityRecognition", label: "Entity Recognition", data: result.verificationLayers.entityRecognition },
                { key: "sourceCredibility", label: "Source Credibility", data: result.verificationLayers.sourceCredibility },
              ].map(({ key, label, data }) => (
                <div key={key} className={`rounded-xl border p-3 ${layerStatusBg(data.status)}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground">{label}</span>
                    <span className={`text-xs font-bold uppercase ${layerStatusColor(data.status)}`}>{data.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{data.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source Confirmation */}
        {result.matchingSources && result.matchingSources.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Newspaper className="h-4 w-4 text-success" /> Source Confirmation
            </h3>
            <div className="px-3 py-2.5 rounded-xl bg-success/5 border border-success/20">
              <p className="text-xs text-muted-foreground mb-2">Sources reporting similar claim:</p>
              <div className="flex flex-wrap gap-1.5">
                {result.matchingSources.map((source, i) => (
                  <span key={i} className="px-2.5 py-1 text-xs rounded-full bg-success/10 text-success font-medium border border-success/20">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        {result.matchingSources && result.matchingSources.length === 0 && (
          <div className="px-3 py-2.5 rounded-xl bg-warning/5 border border-warning/20">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-1">
              <Newspaper className="h-4 w-4 text-warning" /> Source Confirmation
            </h3>
            <p className="text-xs text-warning">No confirmation from major news sources.</p>
          </div>
        )}

        {/* Extracted Entities */}
        {result.entities && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" /> Extracted Entities
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {result.entities.people?.map((e, i) => (
                <span key={`p-${i}`} className="px-2 py-0.5 text-xs rounded-md bg-primary/10 text-primary font-medium inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />{e}
                </span>
              ))}
              {result.entities.locations?.map((e, i) => (
                <span key={`l-${i}`} className="px-2 py-0.5 text-xs rounded-md bg-accent/50 text-accent-foreground font-medium inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{e}
                </span>
              ))}
              {result.entities.organizations?.map((e, i) => (
                <span key={`o-${i}`} className="px-2 py-0.5 text-xs rounded-md bg-secondary text-secondary-foreground font-medium">{e}</span>
              ))}
              {result.entities.events?.map((e, i) => (
                <span key={`e-${i}`} className="px-2 py-0.5 text-xs rounded-md bg-muted text-muted-foreground font-medium inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />{e}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Manipulation Signals */}
        {result.manipulationSignals && result.manipulationSignals.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-destructive" /> Manipulation Signals
            </h3>
            <div className="space-y-2">
              {result.manipulationSignals.map((signal, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="px-3 py-2.5 rounded-xl bg-destructive/5 border border-destructive/15"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-destructive">{signal.technique}</p>
                      <p className="text-xs text-foreground italic">"{signal.phrase}"</p>
                      <p className="text-xs text-muted-foreground">{signal.explanation}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
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

      {/* Explainable AI - Why this verdict */}
      <div className="rounded-2xl glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Lightbulb className="h-4 w-4 text-warning" /> Why This Claim Is{" "}
          {result.verdict === "real" ? "Credible" : result.verdict === "misleading" ? "Possibly Misleading" : "Likely Fake"}
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

      {/* Fact-Check Suggestions */}
      <div className="rounded-2xl glass-card p-5 space-y-3">
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

      {/* Share Card */}
      <div className="rounded-2xl glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Share This Analysis</h3>
        <ShareCard result={result} />
      </div>

      {/* Original text preview */}
      <div className="rounded-2xl glass-card p-5">
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

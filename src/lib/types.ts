export type Verdict = "real" | "misleading" | "fake";

export interface AnalysisSignal {
  label: string;
  detected: boolean;
  severity: "low" | "medium" | "high";
}

export interface AnalysisResult {
  id: string;
  verdict: Verdict;
  probability: number;
  trustScore: number;
  reasons: string[];
  suspiciousKeywords: string[];
  factCheckSuggestions: string[];
  explanation: string;
  inputText: string;
  analyzedAt: string;
  sourceUrl?: string;
  extractedHeadline?: string;
  signals: AnalysisSignal[];
}

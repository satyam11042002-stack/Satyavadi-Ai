export type Verdict = "real" | "misleading" | "fake";

export interface AnalysisResult {
  id: string;
  verdict: Verdict;
  probability: number;
  reasons: string[];
  suspiciousKeywords: string[];
  factCheckSuggestions: string[];
  explanation: string;
  inputText: string;
  analyzedAt: string;
}

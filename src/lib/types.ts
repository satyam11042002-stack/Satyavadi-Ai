export type Verdict = "real" | "misleading" | "fake";

export interface AnalysisSignal {
  label: string;
  detected: boolean;
  severity: "low" | "medium" | "high";
}

export interface VerificationLayer {
  status: string;
  detail: string;
}

export interface ExtractedEntities {
  people: string[];
  organizations: string[];
  locations: string[];
  events: string[];
}

export interface ManipulationSignal {
  phrase: string;
  technique: string;
  explanation: string;
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
  entities?: ExtractedEntities;
  verificationLayers?: {
    eventVerification: VerificationLayer;
    entityRecognition: VerificationLayer;
    sourceCredibility: VerificationLayer;
  };
  mainClaim?: string;
  matchingSources?: string[];
  manipulationSignals?: ManipulationSignal[];
  detectedLanguage?: string;
  detectedLanguageName?: string;
}

export type Verdict = "verified_real" | "likely_real" | "future_planned" | "unverified" | "likely_fake";

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

export interface ClaimDatabaseMatch {
  matched: boolean;
  matchedClaim: string | null;
  matchedStatus: string | null;
  similarityScore: number | null;
}

export interface AnalysisResult {
  id: string;
  verdict: Verdict;
  probability: number;
  trustScore: number;
  confidence?: number;
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
  claimDatabaseMatch?: ClaimDatabaseMatch;
  searchResults?: SearchResult[];
  trustedSourceCount?: number;
  searchSource?: "cache" | "api" | "skipped" | "limit_reached";
  apiUsage?: {
    remaining: number;
    limit: number;
    used: number;
  };
}

export interface SearchResult {
  title: string;
  link: string;
  snippet?: string;
  isTrusted: boolean;
  domain: string;
}

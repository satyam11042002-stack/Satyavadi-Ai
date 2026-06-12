import { AnalysisResult, Verdict } from "./types";
import { saveToHistory } from "./history";
import { callEdgeFunction } from "./edgeClient";

export async function analyzeNews(text: string): Promise<AnalysisResult> {
  const data = await callEdgeFunction("analyze-news", { text });
  return buildResult(data, text.slice(0, 300));
}

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  const data = await callEdgeFunction("analyze-news", { url });
  return buildResult(data, data.extractedHeadline || url, url, data.extractedHeadline);
}

function buildResult(
  data: any,
  inputText: string,
  sourceUrl?: string,
  extractedHeadline?: string
): AnalysisResult {
  const result: AnalysisResult = {
    id: crypto.randomUUID(),
    verdict: data.verdict as Verdict,
    probability: data.probability ?? 50,
    trustScore: data.trustScore ?? (100 - (data.probability ?? 50)),
    confidence: data.confidence,
    reasons: data.reasons || [],
    suspiciousKeywords: data.suspiciousKeywords || [],
    factCheckSuggestions: data.factCheckSuggestions || [],
    explanation: data.explanation || "",
    inputText,
    analyzedAt: new Date().toISOString(),
    sourceUrl: sourceUrl || data.sourceUrl,
    extractedHeadline: extractedHeadline || data.extractedHeadline,
    signals: data.signals || [],
    entities: data.entities,
    verificationLayers: data.verificationLayers,
    mainClaim: data.mainClaim,
    matchingSources: data.matchingSources || [],
    manipulationSignals: data.manipulationSignals || [],
    detectedLanguage: data.detectedLanguage,
    detectedLanguageName: data.detectedLanguageName,
    claimDatabaseMatch: data.claimDatabaseMatch,
    searchResults: data.searchResults || [],
    trustedSourceCount: data.trustedSourceCount ?? 0,
    searchSource: data.searchSource,
    apiUsage: data.apiUsage,
  };

  saveToHistory(result);
  return result;
}

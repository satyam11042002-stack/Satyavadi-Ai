import { AnalysisResult, Verdict } from "./types";
import { saveToHistory } from "./history";

export async function analyzeNews(text: string): Promise<AnalysisResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-news`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Analysis failed. Please try again.");
  }

  const data = await response.json();
  return buildResult(data, text.slice(0, 300));
}

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-news`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Could not analyze this URL. Please try again.");
  }

  const data = await response.json();
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
    reasons: data.reasons || [],
    suspiciousKeywords: data.suspiciousKeywords || [],
    factCheckSuggestions: data.factCheckSuggestions || [],
    explanation: data.explanation || "",
    inputText,
    analyzedAt: new Date().toISOString(),
    sourceUrl: sourceUrl || data.sourceUrl,
    extractedHeadline: extractedHeadline || data.extractedHeadline,
    signals: data.signals || [],
  };

  saveToHistory(result);
  return result;
}

import { AnalysisResult, Verdict } from "./types";
import { saveToHistory } from "./history";

export async function analyzeNews(text: string): Promise<AnalysisResult> {
  // Use Lovable AI via edge function
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
    throw new Error("Analysis failed. Please try again.");
  }

  const data = await response.json();

  const result: AnalysisResult = {
    id: crypto.randomUUID(),
    verdict: data.verdict as Verdict,
    probability: data.probability,
    reasons: data.reasons || [],
    suspiciousKeywords: data.suspiciousKeywords || [],
    factCheckSuggestions: data.factCheckSuggestions || [],
    explanation: data.explanation || "",
    inputText: text.slice(0, 300),
    analyzedAt: new Date().toISOString(),
  };

  saveToHistory(result);
  return result;
}

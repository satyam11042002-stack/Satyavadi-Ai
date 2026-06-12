import { AnalysisResult, Verdict } from "./types";
import { saveToHistory } from "./history";

const FUNCTION_TIMEOUT_MS = 90_000;

async function callEdgeFunction(name: string, body: Record<string, unknown>) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Backend is not configured. Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY environment variables."
    );
  }

  const endpoint = `${supabaseUrl}/functions/v1/${name}`;
  const attempt = async (): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FUNCTION_TIMEOUT_MS);
    try {
      return await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  };

  let response: Response;
  try {
    response = await attempt();
  } catch (err) {
    // Network-level failure (TypeError: Failed to fetch, AbortError, DNS, offline, cold-start, etc.)
    console.error(`[${name}] network error (attempt 1):`, err);
    // Backend cold-start: retry once after a brief delay
    await new Promise((r) => setTimeout(r, 1500));
    try {
      response = await attempt();
    } catch (err2) {
      console.error(`[${name}] network error (attempt 2):`, err2);
      const message =
        err2 instanceof DOMException && err2.name === "AbortError"
          ? "The server took too long to respond. Please try again."
          : !navigator.onLine
          ? "You appear to be offline. Check your internet connection and try again."
          : "Could not reach the verification service. The backend may be starting up — please retry in a few seconds.";
      throw new Error(message);
    }
  }

  if (!response.ok) {
    let errBody: any = null;
    const raw = await response.text().catch(() => "");
    try { errBody = raw ? JSON.parse(raw) : null; } catch { /* not json */ }
    console.error(`[${name}] HTTP ${response.status}:`, errBody || raw);
    const message =
      errBody?.error ||
      (response.status === 429 && "Rate limited. Please wait a moment and try again.") ||
      (response.status === 402 && "AI credits exhausted. Please add credits in Settings.") ||
      (response.status >= 500 && `Server error (${response.status}). Please try again.`) ||
      `Request failed (${response.status}).`;
    throw new Error(message);
  }

  try {
    return await response.json();
  } catch (err) {
    console.error(`[${name}] invalid JSON response:`, err);
    throw new Error("Received an invalid response from the server.");
  }
}

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

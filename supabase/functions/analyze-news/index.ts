import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Trusted Sources ─────────────────────────────────────────────────
const TRUSTED_DOMAINS = [
  "ndtv.com", "bbc.com", "bbc.co.uk", "thehindu.com", "indiatoday.in",
  "timesofindia.com", "timesofindia.indiatimes.com", "hindustantimes.com",
  "reuters.com", "apnews.com", "theguardian.com", "indianexpress.com",
];

function isDomainTrusted(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return TRUSTED_DOMAINS.some(d => hostname === d || hostname.endsWith("." + d));
  } catch { return false; }
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

// ── Known Claims Database ────────────────────────────────────────────
const KNOWN_CLAIMS = [
  { claim: "5G towers cause COVID-19", status: "fake", sources: ["WHO", "BBC", "Reuters"] },
  { claim: "COVID-19 vaccines contain microchips", status: "fake", sources: ["CDC", "WHO", "Reuters"] },
  { claim: "Drinking bleach cures COVID-19", status: "fake", sources: ["WHO", "FDA", "BBC"] },
  { claim: "Earth is flat", status: "fake", sources: ["NASA", "ESA"] },
  { claim: "Moon landing was faked by NASA", status: "fake", sources: ["NASA", "Smithsonian"] },
  { claim: "Bill Gates wants to implant microchips through vaccines", status: "fake", sources: ["Reuters", "AP", "BBC"] },
  { claim: "Climate change is a hoax", status: "fake", sources: ["NASA", "IPCC", "Nature"] },
  { claim: "Eating garlic prevents COVID-19", status: "misleading", sources: ["WHO"] },
  { claim: "Drinking hot water kills coronavirus", status: "misleading", sources: ["WHO", "BBC"] },
  { claim: "WhatsApp messages are always encrypted end to end", status: "real", sources: ["WhatsApp", "EFF"] },
  { claim: "India won the 2024 T20 World Cup", status: "real", sources: ["BBC", "ESPN", "The Hindu"] },
  { claim: "India won the 2023 Cricket World Cup", status: "fake", sources: ["ESPN", "BBC"] },
  { claim: "COVID-19 originated from a lab in Wuhan", status: "misleading", sources: ["WHO", "Nature"] },
  { claim: "Artificial sweeteners cause cancer", status: "misleading", sources: ["WHO", "FDA"] },
  { claim: "Russia invaded Ukraine in February 2022", status: "real", sources: ["BBC", "Reuters", "AP", "CNN"] },
  { claim: "The Panama Canal was sold to China", status: "fake", sources: ["Reuters", "AP"] },
  { claim: "Elon Musk bought Twitter in 2022", status: "real", sources: ["Reuters", "BBC", "NYT"] },
];

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "dare", "ought",
  "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "as", "into", "through", "during", "before", "after", "above", "below",
  "between", "out", "off", "over", "under", "again", "further", "then",
  "once", "here", "there", "when", "where", "why", "how", "all", "each",
  "every", "both", "few", "more", "most", "other", "some", "such", "no",
  "not", "only", "own", "same", "so", "than", "too", "very", "just",
  "because", "but", "and", "or", "if", "while", "that", "this", "these",
  "those", "it", "its", "they", "them", "their", "we", "our", "you",
  "your", "he", "him", "his", "she", "her", "who", "which", "what",
]);

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function cosineSimilarity(textA: string, textB: string): number {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const allTerms = new Set([...tokensA, ...tokensB]);
  const freqA = new Map<string, number>();
  const freqB = new Map<string, number>();
  for (const t of tokensA) freqA.set(t, (freqA.get(t) || 0) + 1);
  for (const t of tokensB) freqB.set(t, (freqB.get(t) || 0) + 1);
  let dot = 0, magA = 0, magB = 0;
  for (const term of allTerms) {
    const a = freqA.get(term) || 0;
    const b = freqB.get(term) || 0;
    dot += a * b; magA += a * a; magB += b * b;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function findMatchingClaim(inputText: string) {
  let best: { claim: typeof KNOWN_CLAIMS[0]; similarity: number } | null = null;
  for (const entry of KNOWN_CLAIMS) {
    const sim = cosineSimilarity(inputText, entry.claim);
    if (sim > (best?.similarity ?? 0)) best = { claim: entry, similarity: sim };
  }
  return best && best.similarity >= 0.55 ? best : null;
}

// ── Supabase Client (service role for cache/usage) ──────────────────
function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, serviceKey);
}

// ── Cache System ────────────────────────────────────────────────────
function hashQuery(query: string): string {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, " ").slice(0, 300);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const chr = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return "q_" + Math.abs(hash).toString(36);
}

async function getCachedSearch(supabase: any, queryText: string) {
  const hash = hashQuery(queryText);
  const { data } = await supabase
    .from("search_cache")
    .select("*")
    .eq("query_hash", hash)
    .single();

  if (!data) return null;

  // Cache expires after 6 hours
  const cacheAge = Date.now() - new Date(data.created_at).getTime();
  if (cacheAge > 6 * 60 * 60 * 1000) {
    await supabase.from("search_cache").delete().eq("id", data.id);
    return null;
  }

  return { results: data.search_results, trustedCount: data.trusted_count, fromCache: true };
}

async function setCachedSearch(supabase: any, queryText: string, results: any[], trustedCount: number) {
  const hash = hashQuery(queryText);
  await supabase.from("search_cache").upsert({
    query_hash: hash,
    query_text: queryText.slice(0, 500),
    search_results: results,
    trusted_count: trustedCount,
    created_at: new Date().toISOString(),
  }, { onConflict: "query_hash" });
}

// ── Usage Tracking ──────────────────────────────────────────────────
function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function getUsageInfo(supabase: any) {
  const monthKey = getCurrentMonthKey();
  const { data } = await supabase
    .from("api_usage")
    .select("*")
    .eq("month_key", monthKey)
    .single();

  if (!data) {
    return { usageCount: 0, maxLimit: 200, remaining: 200, limitReached: false };
  }

  const remaining = Math.max(0, data.max_limit - data.usage_count);
  return {
    usageCount: data.usage_count,
    maxLimit: data.max_limit,
    remaining,
    limitReached: remaining <= 0,
  };
}

async function incrementUsage(supabase: any) {
  const monthKey = getCurrentMonthKey();
  const { data: existing } = await supabase
    .from("api_usage")
    .select("*")
    .eq("month_key", monthKey)
    .single();

  if (existing) {
    await supabase
      .from("api_usage")
      .update({ usage_count: existing.usage_count + 1, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase.from("api_usage").insert({
      month_key: monthKey,
      usage_count: 1,
      max_limit: 200,
    });
  }
}

// ── SerpAPI Search ──────────────────────────────────────────────────
async function searchWithSerpApi(query: string) {
  const SERP_API_KEY = Deno.env.get("SERP_API_KEY");
  if (!SERP_API_KEY) {
    console.warn("SERP_API_KEY not configured, skipping search");
    return { results: [], trustedCount: 0 };
  }

  try {
    const searchQuery = encodeURIComponent(query.slice(0, 200));
    const url = `https://serpapi.com/search.json?q=${searchQuery}&api_key=${SERP_API_KEY}&num=5&hl=en`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("SerpAPI error:", res.status);
      return { results: [], trustedCount: 0 };
    }

    const data = await res.json();
    const organic = data.organic_results || [];
    const results = organic.slice(0, 5).map((r: any) => ({
      title: r.title || "",
      link: r.link || "",
      snippet: r.snippet || "",
      domain: extractDomain(r.link || ""),
      isTrusted: isDomainTrusted(r.link || ""),
    }));

    const trustedCount = results.filter((r: any) => r.isTrusted).length;
    return { results, trustedCount };
  } catch (e) {
    console.error("SerpAPI fetch error:", e);
    return { results: [], trustedCount: 0 };
  }
}

// ── Article URL Extraction ──────────────────────────────────────────
async function extractArticleFromUrl(url: string) {
  const fetchRes = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SatyavadiAI/1.0)" },
  });
  if (!fetchRes.ok) throw new Error("Could not fetch the article. Try pasting the article text directly.");
  const html = await fetchRes.text();

  let headline = "";
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  headline = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
  if (ogTitle) headline = ogTitle[1].trim();

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : html;
  const cleaned = bodyHtml
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < 50) throw new Error("Could not extract enough text from this URL.");
  return { text: cleaned, headline };
}

// ── System Prompt ───────────────────────────────────────────────────
function buildSystemPrompt(
  claimMatch?: { claim: typeof KNOWN_CLAIMS[0]; similarity: number } | null,
  searchInfo?: { trustedCount: number; resultsSummary: string }
): string {
  let claimContext = "";
  if (claimMatch && claimMatch.similarity >= 0.55) {
    claimContext = `
## KNOWN CLAIM MATCH
- Matched: "${claimMatch.claim.claim}"
- Status: ${claimMatch.claim.status}
- Verified By: ${claimMatch.claim.sources.join(", ")}
- Similarity: ${(claimMatch.similarity * 100).toFixed(0)}%
Use this as strong evidence.
`;
  }

  let searchContext = "";
  if (searchInfo) {
    searchContext = `
## REAL-TIME SEARCH RESULTS
- Trusted sources found: ${searchInfo.trustedCount}
- Search summary: ${searchInfo.resultsSummary}
DECISION RULE from search:
- 2+ trusted sources → lean toward "verified_real" or "likely_real"
- 1 trusted source → lean toward "unverified" or "likely_real" with lower confidence
- 0 trusted sources → lean toward "unverified" (NOT "likely_fake" unless strong contrary evidence)
`;
  }

  return `You are Satyavadi AI, an advanced misinformation detection system. Current date: ${new Date().toISOString().split("T")[0]}.
${claimContext}${searchContext}
## 5-CATEGORY VERDICT SYSTEM
1. "verified_real" — Confirmed by multiple credible sources
2. "likely_real" — Aligns with credible reporting, minor concerns
3. "future_planned" — Future event, planned initiative
4. "unverified" — Cannot confirm or deny
5. "likely_fake" — Strong evidence of fabrication. ONLY when contradicted by trusted sources.

## CONFIDENCE (0-100)
90-100: Very high | 70-89: Good | 50-69: Moderate | 0-49: Low

## SAFE RULE: If unsure → "unverified" not "likely_fake"

## LANGUAGE: Detect input language. Return explanation, reasons, factCheckSuggestions, mainClaim in the SAME language.

Respond with valid JSON only:
{
  "verdict": "verified_real"|"likely_real"|"future_planned"|"unverified"|"likely_fake",
  "probability": <0-100 fake probability>,
  "trustScore": <0-100>,
  "confidence": <0-100>,
  "mainClaim": "<main claim, ORIGINAL LANGUAGE>",
  "reasons": [<3-5 strings, ORIGINAL LANGUAGE>],
  "suspiciousKeywords": [<0-5 suspicious words>],
  "factCheckSuggestions": [<2-4 suggestions, ORIGINAL LANGUAGE>],
  "explanation": "<2-3 sentences, ORIGINAL LANGUAGE>",
  "detectedLanguage": "<ISO 639-1>",
  "detectedLanguageName": "<English name>",
  "matchingSources": [<source names>],
  "manipulationSignals": [{"phrase":"<text>","technique":"<name>","explanation":"<why>"}],
  "entities": {"people":[],"organizations":[],"locations":[],"events":[]},
  "verificationLayers": {
    "eventVerification": {"status":"confirmed"|"unverified"|"contradicted","detail":"<short>"},
    "entityRecognition": {"status":"matched"|"partial"|"unmatched","detail":"<short>"},
    "sourceCredibility": {"status":"high"|"medium"|"low","detail":"<short>"}
  },
  "claimDatabaseMatch": {"matched":<bool>,"matchedClaim":"<or null>","matchedStatus":"<or null>","similarityScore":<or null>},
  "signals": [
    {"label":"Emotional/Sensational Language","detected":<bool>,"severity":"low"|"medium"|"high"},
    {"label":"Suspicious/Exaggerated Claims","detected":<bool>,"severity":"low"|"medium"|"high"},
    {"label":"Lack of Credible Sources","detected":<bool>,"severity":"low"|"medium"|"high"},
    {"label":"Logical Inconsistencies","detected":<bool>,"severity":"low"|"medium"|"high"},
    {"label":"Clickbait Headline Patterns","detected":<bool>,"severity":"low"|"medium"|"high"}
  ]
}`;
}

// ── Main Handler ────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, url, forceInternetCheck } = await req.json();
    const supabase = getSupabaseAdmin();

    let articleText = text;
    let extractedHeadline = "";
    let sourceUrl = url || "";

    if (url && !text) {
      try {
        const extracted = await extractArticleFromUrl(url);
        articleText = extracted.text;
        extractedHeadline = extracted.headline;
      } catch (e) {
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Could not access this URL." }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!articleText || articleText.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Text must be at least 20 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get usage info
    const usageInfo = await getUsageInfo(supabase);

    // Run claim matching
    const claimMatch = findMatchingClaim(articleText);
    const searchQuery = extractedHeadline || articleText.slice(0, 200);

    // ── Smart Search Decision ───────────────────────────────────────
    let searchData = { results: [] as any[], trustedCount: 0 };
    let searchSource: "cache" | "api" | "skipped" | "limit_reached" = "skipped";

    // Step 1: Check cache first
    const cached = await getCachedSearch(supabase, searchQuery);
    if (cached) {
      searchData = { results: cached.results, trustedCount: cached.trustedCount };
      searchSource = "cache";
      console.log("Search cache HIT for:", searchQuery.slice(0, 60));
    } else if (usageInfo.limitReached) {
      // Step 2: Check if limit reached
      searchSource = "limit_reached";
      console.log("API limit reached, skipping SerpAPI");
    } else if (forceInternetCheck || !claimMatch) {
      // Step 3: Call SerpAPI (if forced or no claim match = low initial confidence)
      searchData = await searchWithSerpApi(searchQuery);
      searchSource = "api";
      await incrementUsage(supabase);
      // Save to cache
      if (searchData.results.length > 0) {
        await setCachedSearch(supabase, searchQuery, searchData.results, searchData.trustedCount);
      }
      console.log("SerpAPI called, results cached for:", searchQuery.slice(0, 60));
    } else {
      // Step 4: Claim match found with high confidence → skip API
      searchSource = "skipped";
      console.log("High confidence claim match, skipping SerpAPI");
    }

    // Refresh usage after potential increment
    const finalUsage = searchSource === "api" ? await getUsageInfo(supabase) : usageInfo;

    const searchSummary = searchData.results.length > 0
      ? searchData.results.map((r: any) => `[${r.domain}${r.isTrusted ? " ✓" : ""}] ${r.title}`).join("; ")
      : "No search results available";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: buildSystemPrompt(claimMatch, searchData.results.length > 0 ? { trustedCount: searchData.trustedCount, resultsSummary: searchSummary } : undefined) },
          { role: "user", content: `Analyze this news text for authenticity:\n\n${articleText.slice(0, 5000)}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI analysis failed");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse AI response");

    const result = JSON.parse(jsonMatch[0]);

    // Inject claim database match if AI didn't
    if (claimMatch && !result.claimDatabaseMatch?.matched) {
      result.claimDatabaseMatch = {
        matched: true,
        matchedClaim: claimMatch.claim.claim,
        matchedStatus: claimMatch.claim.status,
        similarityScore: Math.round(claimMatch.similarity * 100),
      };
    }

    // Attach search results & metadata
    result.searchResults = searchData.results;
    result.trustedSourceCount = searchData.trustedCount;
    result.searchSource = searchSource;
    result.apiUsage = {
      remaining: finalUsage.remaining,
      limit: finalUsage.maxLimit,
      used: finalUsage.usageCount,
    };

    if (extractedHeadline) result.extractedHeadline = extractedHeadline;
    if (sourceUrl) result.sourceUrl = sourceUrl;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-news error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

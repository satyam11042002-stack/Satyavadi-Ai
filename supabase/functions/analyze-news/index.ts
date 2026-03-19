import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
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
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function findMatchingClaim(inputText: string): { claim: typeof KNOWN_CLAIMS[0]; similarity: number } | null {
  let best: { claim: typeof KNOWN_CLAIMS[0]; similarity: number } | null = null;
  for (const entry of KNOWN_CLAIMS) {
    const sim = cosineSimilarity(inputText, entry.claim);
    if (sim > (best?.similarity ?? 0)) {
      best = { claim: entry, similarity: sim };
    }
  }
  return best && best.similarity >= 0.55 ? best : null;
}

// ── Article URL Extraction ───────────────────────────────────────────
async function extractArticleFromUrl(url: string) {
  const fetchRes = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; TruthLens/1.0)" },
  });
  if (!fetchRes.ok) {
    throw new Error("Could not fetch the article. The website may be blocking automated access. Try pasting the article text directly.");
  }
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

  if (cleaned.length < 50) {
    throw new Error("Could not extract enough text from this URL. Try pasting the article text directly.");
  }

  return { text: cleaned, headline };
}

// ── System Prompt ────────────────────────────────────────────────────
function buildSystemPrompt(claimMatch?: { claim: typeof KNOWN_CLAIMS[0]; similarity: number } | null): string {
  let claimContext = "";
  if (claimMatch && claimMatch.similarity >= 0.55) {
    claimContext = `
## KNOWN CLAIM MATCH (from verified database)
A similar claim was found in our verified claims database:
- Matched Claim: "${claimMatch.claim.claim}"
- Database Status: ${claimMatch.claim.status}
- Verified By: ${claimMatch.claim.sources.join(", ")}
- Similarity Score: ${(claimMatch.similarity * 100).toFixed(0)}%

IMPORTANT: Use this database match as strong evidence. If similarity is very high (>80%), heavily weight this match in your verdict.
`;
  }

  return `You are an advanced misinformation detection AI with a multi-layer verification pipeline. Your goal is to minimize false positives — real news must NOT be incorrectly labeled as fake.

IMPORTANT: The current date is ${new Date().toISOString().split("T")[0]}. Use this for temporal reasoning about events.
${claimContext}
## 5-CATEGORY VERDICT SYSTEM (CRITICAL)
You MUST classify every claim into exactly ONE of these 5 categories:

1. "verified_real" — Claim matches confirmed events verified by multiple credible sources. Use when evidence is strong and clear.
2. "likely_real" — Claim aligns with credible reporting but may lack full confirmation. Minor concerns but generally trustworthy.
3. "future_planned" — Claim references a future event, a planned initiative, or something scheduled that has NOT happened yet. Use when:
   - Text contains future indicators: "will", "by 2030", "by 2035", "expected", "planned", "scheduled", "aims to", "target", "upcoming"
   - Event date is after the current date
   - A credible authority (NASA, ISRO, WHO, government) is mentioned → "future_planned"
   - No credible authority → still use "future_planned" but with lower confidence
   - NEVER classify future events as "likely_fake" unless there is strong evidence of fabrication
4. "unverified" — Cannot confirm or deny. No strong evidence either way. Use when:
   - No credible sources confirm OR deny the claim
   - System is not confident in any other category
   - ALWAYS prefer "unverified" over "likely_fake" when in doubt
5. "likely_fake" — Strong evidence of fabrication, contradiction by trusted sources, or known misinformation pattern. ONLY use when:
   - Claim directly contradicts established verified facts
   - Claim matches known misinformation in the database
   - Multiple credible sources actively debunk the claim

## CONFIDENCE SCORE
You MUST provide a "confidence" field (0-100) indicating how confident you are in your verdict:
- 90-100: Very high confidence, strong evidence
- 70-89: Good confidence, solid evidence
- 50-69: Moderate confidence, some uncertainty
- 0-49: Low confidence, significant uncertainty

## DECISION PRIORITY ORDER
1. Claim matches database with high similarity → Use database status (verified_real or likely_fake)
2. Future claim detected → "future_planned"
3. Trusted sources confirm → "likely_real" or "verified_real"
4. Strong manipulation signals + no sources → "likely_fake"
5. Otherwise → "unverified"

## AUTHORITY DETECTION
Detect trusted organizations in the text. If present, increase trust score:
NASA, ISRO, WHO, UN, EU, major government bodies, established universities, CDC, FDA, IPCC, World Bank, IMF

## LANGUAGE HANDLING
- Detect the language of the input text.
- Return "explanation", "reasons", "factCheckSuggestions", and "mainClaim" in the SAME LANGUAGE as the input.
- Return "detectedLanguage" as ISO 639-1 code and "detectedLanguageName" as English name.

## PIPELINE

### Step 1: Claim Extraction
- Identify the single most important factual claim.
- Focus on key subjects, events, numerical facts, dates.

### Step 2: Future Event Detection
- Check for future indicators: "will", "by 20XX", "expected", "planned", "scheduled", "aims to", "target"
- Compare event dates against current date ${new Date().toISOString().split("T")[0]}
- Future events → "future_planned", NEVER "likely_fake"

### Step 3: Event Verification
- THREE possible outcomes:
  - "confirmed": Event happened and is verified
  - "unverified": Future event or no information to confirm
  - "contradicted": Impossible or directly contradicts established facts

### Step 4: Named Entity Recognition
- Extract people, organizations, locations, events
- Check for trusted authorities

### Step 5: Trusted Source Matching
- List specific trusted sources that would report this story
- If sources confirm → increase trust score

### Step 6: Manipulation Detection
- Detect fear-based language, urgency, emotional exaggeration, conspiracy wording
- Extract specific phrases and explain techniques

## TRUST SCORE INTERPRETATION
- 80-100: Multiple credible sources confirm. Verified event. No manipulation.
- 60-79: Some credible sources. Event likely real. Minor concerns.
- 40-59: Unverified. No strong confirmation or denial.
- 0-39: Contradicted by evidence. Known misinformation.

## SAFE CLASSIFICATION RULE
If the system is not confident → return "unverified" instead of "likely_fake".
Avoid false positives at all costs.

You MUST respond with valid JSON only, no markdown. Use this exact structure:
{
  "verdict": "verified_real" | "likely_real" | "future_planned" | "unverified" | "likely_fake",
  "probability": <number 0-100, fake news probability>,
  "trustScore": <number 0-100>,
  "confidence": <number 0-100, how confident the system is in this verdict>,
  "mainClaim": "<the single most important factual claim, IN THE ORIGINAL LANGUAGE>",
  "reasons": [<3-5 short strings explaining key findings, IN THE ORIGINAL LANGUAGE>],
  "suspiciousKeywords": [<0-5 suspicious words/phrases, empty if none>],
  "factCheckSuggestions": [<2-4 actionable verification suggestions, IN THE ORIGINAL LANGUAGE>],
  "explanation": "<2-3 sentence explanation, IN THE ORIGINAL LANGUAGE>",
  "detectedLanguage": "<ISO 639-1 language code>",
  "detectedLanguageName": "<English name of the language>",
  "matchingSources": [<list of specific trusted news source names>],
  "manipulationSignals": [
    {"phrase": "<exact text from article>", "technique": "<technique name>", "explanation": "<why this is manipulative, IN ORIGINAL LANGUAGE>"}
  ],
  "entities": {
    "people": [<person names>],
    "organizations": [<org names>],
    "locations": [<places/countries>],
    "events": [<events or dates>]
  },
  "verificationLayers": {
    "eventVerification": {"status": "confirmed"|"unverified"|"contradicted", "detail": "<short explanation>"},
    "entityRecognition": {"status": "matched"|"partial"|"unmatched", "detail": "<short explanation>"},
    "sourceCredibility": {"status": "high"|"medium"|"low", "detail": "<short explanation>"}
  },
  "claimDatabaseMatch": {
    "matched": <boolean>,
    "matchedClaim": "<matched claim text or null>",
    "matchedStatus": "<true|false|misleading or null>",
    "similarityScore": <number 0-100 or null>
  },
  "signals": [
    {"label": "Emotional/Sensational Language", "detected": <boolean>, "severity": "low"|"medium"|"high"},
    {"label": "Suspicious/Exaggerated Claims", "detected": <boolean>, "severity": "low"|"medium"|"high"},
    {"label": "Lack of Credible Sources", "detected": <boolean>, "severity": "low"|"medium"|"high"},
    {"label": "Logical Inconsistencies", "detected": <boolean>, "severity": "low"|"medium"|"high"},
    {"label": "Clickbait Headline Patterns", "detected": <boolean>, "severity": "low"|"medium"|"high"}
  ]
}`;
}

// ── Main Handler ─────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, url } = await req.json();

    let articleText = text;
    let extractedHeadline = "";
    let sourceUrl = url || "";

    if (url && !text) {
      try {
        const extracted = await extractArticleFromUrl(url);
        articleText = extracted.text;
        extractedHeadline = extracted.headline;
      } catch (e) {
        console.error("URL fetch error:", e);
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

    // ── Claim Similarity Matching ──
    const claimMatch = findMatchingClaim(articleText);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: buildSystemPrompt(claimMatch) },
          { role: "user", content: `Analyze this news text for authenticity:\n\n${articleText.slice(0, 5000)}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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

    // Inject claim database match info if AI didn't include it
    if (claimMatch && !result.claimDatabaseMatch?.matched) {
      result.claimDatabaseMatch = {
        matched: true,
        matchedClaim: claimMatch.claim.claim,
        matchedStatus: claimMatch.claim.status,
        similarityScore: Math.round(claimMatch.similarity * 100),
      };
    }

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

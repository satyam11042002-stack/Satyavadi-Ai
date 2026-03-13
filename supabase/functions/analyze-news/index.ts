import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, url } = await req.json();

    let articleText = text;
    let extractedHeadline = "";
    let sourceUrl = url || "";

    // If URL provided, fetch and extract content
    if (url && !text) {
      try {
        const fetchRes = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; TruthLens/1.0)" },
        });
        if (!fetchRes.ok) {
          return new Response(
            JSON.stringify({ error: "Could not fetch the article. The website may be blocking automated access. Try pasting the article text directly." }),
            { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const html = await fetchRes.text();

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        extractedHeadline = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";

        // Try og:title
        const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
        if (ogTitle) extractedHeadline = ogTitle[1].trim();

        // Strip HTML tags and extract text content
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const bodyHtml = bodyMatch ? bodyMatch[1] : html;
        // Remove scripts, styles, nav, header, footer, aside
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
          return new Response(
            JSON.stringify({ error: "Could not extract enough text from this URL. Try pasting the article text directly." }),
            { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        articleText = cleaned;
      } catch (e) {
        console.error("URL fetch error:", e);
        return new Response(
          JSON.stringify({ error: "Could not access this URL. Please check the link or paste the article text instead." }),
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an advanced fake news detection AI with a multi-layer verification system. Your goal is to minimize false positives — real news must NOT be incorrectly labeled as fake.

## MULTI-LAYER VERIFICATION

### Layer 1: Event Verification
- Identify if the text references real-world events (sports results, elections, disasters, official announcements, policy changes, scientific discoveries).
- Use your knowledge to determine if the event is real and widely reported. If the event matches known facts, INCREASE the trust score significantly.
- Only flag as suspicious if the event contradicts well-established facts or describes something physically/logically impossible.

### Layer 2: Named Entity Recognition
- Extract key entities: people, countries, organizations, sports teams, political leaders, institutions, events, dates.
- Cross-reference these entities against your knowledge. If the people/organizations/events are real and the claims about them are plausible or confirmed, this supports authenticity.
- Report extracted entities in your response.

### Layer 3: Credible Source Matching
- Assess whether the type of claim would typically appear in credible news sources (Reuters, AP, BBC, CNN, NYT, etc.).
- If the topic, entities, and events align with what credible sources would report, mark source credibility as positive.
- Only flag source credibility issues if the claim is extraordinary with no plausible basis, or if the writing style mimics known misinformation patterns.

## CRITICAL RULES TO REDUCE FALSE POSITIVES
- Sports results, election outcomes, natural disasters, and official government announcements are almost always REAL news. Do not penalize factual reporting of real events.
- Emotional language alone does NOT make news fake. Many real news stories about tragedies, conflicts, or achievements use emotional language.
- A bold or surprising headline does NOT automatically mean clickbait. Verify the claim first.
- When in doubt, lean toward "real" or "misleading" rather than "fake". Only use "fake" when there is strong evidence of fabrication.

You MUST respond with valid JSON only, no markdown, no explanation outside the JSON. Use this exact structure:
{
  "verdict": "real" | "misleading" | "fake",
  "probability": <number 0-100 representing fake news probability>,
  "trustScore": <number 0-100 representing trust/credibility score. 0-30=likely fake, 31-60=possibly misleading, 61-100=likely real>,
  "reasons": [<3-5 short strings explaining key findings>],
  "suspiciousKeywords": [<0-5 words/phrases from the text that are suspicious, empty array if none>],
  "factCheckSuggestions": [<2-4 actionable suggestions for verifying the claims>],
  "explanation": "<2-3 sentence explanation of the analysis>",
  "entities": {
    "people": [<extracted person names>],
    "organizations": [<extracted org names>],
    "locations": [<extracted places/countries>],
    "events": [<extracted events or dates>]
  },
  "verificationLayers": {
    "eventVerification": {"status": "confirmed"|"unverified"|"contradicted", "detail": "<short explanation>"},
    "entityRecognition": {"status": "matched"|"partial"|"unmatched", "detail": "<short explanation>"},
    "sourceCredibility": {"status": "high"|"medium"|"low", "detail": "<short explanation>"}
  },
  "signals": [
    {"label": "Emotional/Sensational Language", "detected": <boolean>, "severity": "low"|"medium"|"high"},
    {"label": "Suspicious/Exaggerated Claims", "detected": <boolean>, "severity": "low"|"medium"|"high"},
    {"label": "Lack of Credible Sources", "detected": <boolean>, "severity": "low"|"medium"|"high"},
    {"label": "Logical Inconsistencies", "detected": <boolean>, "severity": "low"|"medium"|"high"},
    {"label": "Clickbait Headline Patterns", "detected": <boolean>, "severity": "low"|"medium"|"high"}
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
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

    if (!content) {
      throw new Error("No response from AI");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    const result = JSON.parse(jsonMatch[0]);

    // Attach URL metadata
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

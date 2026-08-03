import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_QUERY_LEN = 300;

function monthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function checkAndIncrementUsage(): Promise<{ ok: boolean }> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return { ok: true };
    const sb = createClient(url, key);
    const mk = monthKey();
    const { data } = await sb.from("api_usage").select("*").eq("month_key", mk).single();
    if (data) {
      if (data.usage_count >= data.max_limit) return { ok: false };
      await sb.from("api_usage").update({ usage_count: data.usage_count + 1, updated_at: new Date().toISOString() }).eq("id", data.id);
      return { ok: true };
    }
    await sb.from("api_usage").insert({ month_key: mk, usage_count: 1, max_limit: 200 });
    return { ok: true };
  } catch (e) {
    console.error("usage tracking error:", e);
    return { ok: true };
  }
}

const systemPrompt = `You are JANSATYA — a strictly neutral civic-intelligence analyst for Indian public policy.

You explain government policies, bills, schemes, acts, judgments and public issues in plain, simple English.

ABSOLUTE RULES:
- ZERO political bias. Never endorse or attack any party, government, leader or ideology.
- Present every side fairly and with equal seriousness.
- Never invent statistics, dates or document numbers. If unsure, say "Not officially confirmed".
- Official sources must be real, well-known government portals (pib.gov.in, india.gov.in, egazette.gov.in, sansad.in, sci.gov.in, relevant ministry sites). Never fabricate deep-link URLs you are unsure about — prefer the portal homepage or a search page.
- Executive summary must be under 150 words and understandable by a 15-year-old.
- If the query is not a real policy, bill, scheme, act or public issue, set "isValidTopic" to false and leave other fields minimal.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Please enter a policy, bill, scheme or public issue to analyze." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (query.length > MAX_QUERY_LEN) {
      return new Response(JSON.stringify({ error: `Query must be under ${MAX_QUERY_LEN} characters` }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const usage = await checkAndIncrementUsage();
    if (!usage.ok) {
      return new Response(JSON.stringify({ error: "Monthly usage limit reached. Try again next month." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Produce a complete neutral civic report on: ${query.trim()}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "jansatya_report",
            description: "Structured neutral civic report",
            parameters: {
              type: "object",
              properties: {
                isValidTopic: { type: "boolean" },
                title: { type: "string" },
                category: { type: "string", description: "e.g. Education Policy, Data Law, Housing Scheme" },
                status: { type: "string", description: "Current status, e.g. In force since 2023" },
                executiveSummary: { type: "string", description: "Under 150 words, plain English" },
                whyItMatters: {
                  type: "object",
                  properties: {
                    whoBenefits: { type: "array", items: { type: "string" } },
                    whoMayBeAffected: { type: "array", items: { type: "string" } },
                    shortTermImpact: { type: "array", items: { type: "string" } },
                    longTermImpact: { type: "array", items: { type: "string" } },
                  },
                  required: ["whoBenefits", "whoMayBeAffected", "shortTermImpact", "longTermImpact"],
                  additionalProperties: false,
                },
                perspectives: {
                  type: "object",
                  properties: {
                    government: { type: "array", items: { type: "string" } },
                    citizens: { type: "array", items: { type: "string" } },
                    experts: { type: "array", items: { type: "string" } },
                    media: { type: "array", items: { type: "string" } },
                  },
                  required: ["government", "citizens", "experts", "media"],
                  additionalProperties: false,
                },
                officialSources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string", description: "Ministry, PIB, Parliament, Gazette, Supreme Court, PDF" },
                      url: { type: "string" },
                    },
                    required: ["name", "type", "url"],
                    additionalProperties: false,
                  },
                },
                timeline: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      date: { type: "string" },
                      title: { type: "string" },
                      detail: { type: "string" },
                      phase: { type: "string", enum: ["announcement", "update", "current"] },
                    },
                    required: ["date", "title", "detail", "phase"],
                    additionalProperties: false,
                  },
                },
                keyFacts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { label: { type: "string" }, value: { type: "string" } },
                    required: ["label", "value"],
                    additionalProperties: false,
                  },
                },
                faqs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { question: { type: "string" }, answer: { type: "string" } },
                    required: ["question", "answer"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["isValidTopic", "title", "category", "status", "executiveSummary", "whyItMatters", "perspectives", "officialSources", "timeline", "keyFacts", "faqs"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "jansatya_report" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", response.status, await response.text());
      throw new Error("JanSatya analysis failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured report returned");
    const result = JSON.parse(toolCall.function.arguments);

    if (result.isValidTopic === false) {
      return new Response(JSON.stringify({ error: "This doesn't appear to be a government policy, bill, scheme or public issue. Try something like \"NEP 2020\" or \"PM Awas Yojana\"." }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("jansatya-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

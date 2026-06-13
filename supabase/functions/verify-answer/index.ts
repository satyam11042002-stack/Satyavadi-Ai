import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_FIELD_LEN = 8000;

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, aiAnswer } = await req.json();
    if (!question || !aiAnswer || typeof question !== "string" || typeof aiAnswer !== "string") {
      return new Response(JSON.stringify({ error: "Both question and aiAnswer are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (question.length > MAX_FIELD_LEN || aiAnswer.length > MAX_FIELD_LEN) {
      return new Response(JSON.stringify({ error: `Each field must be under ${MAX_FIELD_LEN} characters` }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const usage = await checkAndIncrementUsage();
    if (!usage.ok) {
      return new Response(JSON.stringify({ error: "Monthly usage limit reached. Try again next month." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are SATYAVADI CORE — an advanced multi-model Truth Verification Engine.

Your job is to:
1. Analyze and verify the given AI answer
2. Detect factual, logical, or incomplete errors
3. Cross-check using general knowledge and reasoning
4. Improve and correct the answer
5. Provide a confidence score (0–100)
6. Be strict about truth (do not assume or guess)

RULES:
- Never guess — say "Not enough reliable information" if unsure
- Prefer widely accepted facts
- Keep output clean and structured
- Avoid long paragraphs
- Always prioritize accuracy over politeness
- If the answer is already correct, still provide an improved cleaner version
- Cross-check answers using general world knowledge and ensure the final output is reliable`;
    const userPrompt = `Question: ${question}\n\nAI Answer: ${aiAnswer}`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "verify_answer",
              description: "Return the verification result for the AI answer",
              parameters: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["correct", "incorrect", "partially_correct"] },
                  confidenceScore: { type: "number" },
                  analysis: {
                    type: "object",
                    properties: {
                      factuallyCorrect: { type: "boolean" },
                      missingInfo: { type: "string" },
                      misleadingInfo: { type: "string" },
                    },
                    required: ["factuallyCorrect"],
                    additionalProperties: false,
                  },
                  correctedAnswer: { type: "string" },
                  improvedVersion: { type: "string" },
                  keyPoints: { type: "array", items: { type: "string" } },
                  finalVerdict: { type: "string" },
                },
                required: ["status", "confidenceScore", "analysis", "correctedAnswer", "improvedVersion", "keyPoints", "finalVerdict"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "verify_answer" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI verification failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-answer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

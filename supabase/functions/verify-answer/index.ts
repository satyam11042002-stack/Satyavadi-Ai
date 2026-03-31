import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, aiAnswer } = await req.json();
    if (!question || !aiAnswer) {
      return new Response(JSON.stringify({ error: "Both question and aiAnswer are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are SATYAVADI AI — a Truth Verification and Correction Engine.

Your job is NOT to just answer, but to:
1. Verify the correctness of the given AI answer
2. Detect factual, logical, or incomplete errors
3. Provide a corrected and improved answer
4. Assign a confidence score (0–100)
5. Clearly explain if the answer is wrong (short explanation only)

RULES:
- Always prioritize factual accuracy over politeness
- Do NOT guess — if unsure, say "Not enough reliable information"
- Keep explanation short and clear
- Correct answer must be simple and precise
- No unnecessary long paragraphs

You MUST respond with a valid JSON object matching this exact schema:
{
  "status": "correct" | "incorrect" | "partially_correct",
  "confidenceScore": <number 0-100>,
  "analysis": {
    "factuallyCorrect": <boolean>,
    "missingInfo": <string or null>,
    "misleadingInfo": <string or null>
  },
  "correctedAnswer": <string>,
  "finalVerdict": <string - one line summary>
}`;

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
                  finalVerdict: { type: "string" },
                },
                required: ["status", "confidenceScore", "analysis", "correctedAnswer", "finalVerdict"],
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_B64_LEN = 14_000_000; // ~10 MB image after base64 expansion
const BASE64_RE = /^[A-Za-z0-9+/=\r\n]+$/;

function monthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function checkAndIncrementUsage(): Promise<{ ok: boolean; remaining: number }> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return { ok: true, remaining: -1 };
    const sb = createClient(url, key);
    const mk = monthKey();
    const { data } = await sb.from("api_usage").select("*").eq("month_key", mk).single();
    if (data) {
      if (data.usage_count >= data.max_limit) return { ok: false, remaining: 0 };
      await sb.from("api_usage").update({ usage_count: data.usage_count + 1, updated_at: new Date().toISOString() }).eq("id", data.id);
      return { ok: true, remaining: data.max_limit - data.usage_count - 1 };
    }
    await sb.from("api_usage").insert({ month_key: mk, usage_count: 1, max_limit: 200 });
    return { ok: true, remaining: 199 };
  } catch (e) {
    console.error("usage tracking error:", e);
    return { ok: true, remaining: -1 };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof imageBase64 !== "string" || imageBase64.length > MAX_B64_LEN) {
      return new Response(
        JSON.stringify({ error: "Image too large (max ~10MB)" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const stripped = imageBase64.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "");
    if (!BASE64_RE.test(stripped)) {
      return new Response(
        JSON.stringify({ error: "Invalid base64 image data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const usage = await checkAndIncrementUsage();
    if (!usage.ok) {
      return new Response(
        JSON.stringify({ error: "Monthly usage limit reached. Try again next month." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Use Gemini vision to extract text from image
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an OCR text extraction tool. Extract ALL text visible in the image exactly as written. Return ONLY the extracted text, nothing else. If no text is found, return 'NO_TEXT_FOUND'.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all text from this image:" },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("OCR extraction failed");
    }

    const aiData = await response.json();
    const extractedText = aiData.choices?.[0]?.message?.content?.trim() || "";

    if (!extractedText || extractedText === "NO_TEXT_FOUND") {
      return new Response(
        JSON.stringify({ error: "No text could be extracted from this image" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ extractedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ocr-extract error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "OCR failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

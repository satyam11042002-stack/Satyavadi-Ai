import { toast } from "sonner";

const FUNCTION_TIMEOUT_MS = 90_000; // 90 seconds
const MAX_RETRIES = 2; // 3 total attempts
const RETRY_DELAYS_MS = [1500, 3000]; // backoff between attempts

function getEnv() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Backend is not configured. Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY environment variables."
    );
  }
  return { supabaseUrl, supabaseKey };
}

/**
 * Calls a backend edge function with:
 * - 90s timeout per attempt
 * - 2 automatic retries (3 attempts) on network failures & 5xx (cold-start protection)
 * - Detailed console logging for every failure path
 * - User-friendly error messages (never raw "Failed to fetch")
 */
export async function callEdgeFunction(
  name: string,
  body: Record<string, unknown>
): Promise<any> {
  const { supabaseUrl, supabaseKey } = getEnv();
  const endpoint = `${supabaseUrl}/functions/v1/${name}`;

  const attemptFetch = async (): Promise<Response> => {
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

  let response: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[${name}] attempt ${attempt + 1}/${MAX_RETRIES + 1} → ${endpoint}`);
      const res = await attemptFetch();

      // Retry on gateway/cold-start style server errors
      if (res.status >= 502 && res.status <= 504 && attempt < MAX_RETRIES) {
        console.warn(`[${name}] HTTP ${res.status} (attempt ${attempt + 1}) — retrying...`);
        toast.info("Backend is waking up — retrying...", { id: `warmup-${name}` });
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt] ?? 3000));
        continue;
      }

      response = res;
      break;
    } catch (err) {
      lastError = err;
      console.error(`[${name}] network error (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, err);
      if (attempt < MAX_RETRIES) {
        toast.info("Backend is waking up — retrying...", { id: `warmup-${name}` });
        // Fire a warm-up ping in parallel so the runtime boots while we wait
        void warmUpBackend();
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt] ?? 3000));
      }
    }
  }

  if (!response) {
    const message =
      lastError instanceof DOMException && lastError.name === "AbortError"
        ? "The analysis took too long to respond (90s). Please try again."
        : !navigator.onLine
        ? "You appear to be offline. Check your internet connection and try again."
        : "Could not reach the verification service after multiple attempts. Please try again in a few seconds.";
    throw new Error(message);
  }

  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    let errBody: any = null;
    try { errBody = raw ? JSON.parse(raw) : null; } catch { /* not json */ }
    console.error(`[${name}] HTTP ${response.status}:`, errBody || raw);
    const message =
      errBody?.error ||
      (response.status === 429 && "Too many requests right now. Please wait a moment and try again.") ||
      (response.status === 402 && "AI usage limit reached. Please add credits and try again.") ||
      (response.status >= 500 && "The verification service hit a temporary error. Please try again.") ||
      `Request failed (${response.status}). Please try again.`;
    throw new Error(message);
  }

  try {
    return await response.json();
  } catch (err) {
    console.error(`[${name}] invalid JSON response:`, err);
    throw new Error("Received an invalid response from the server. Please try again.");
  }
}

let warmedUp = false;

/**
 * Fire-and-forget ping to the health-check function. Boots the edge runtime
 * so the user's first real request doesn't hit a cold start.
 */
export async function warmUpBackend(): Promise<void> {
  try {
    const { supabaseUrl, supabaseKey } = getEnv();
    const res = await fetch(`${supabaseUrl}/functions/v1/health-check`, {
      method: "GET",
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    warmedUp = res.ok;
    console.log(`[health-check] warm-up ping → ${res.status}`);
  } catch (err) {
    console.warn("[health-check] warm-up ping failed (non-fatal):", err);
  }
}

/** Warm up once on app load (and re-ping every 4 minutes while the tab is open). */
export function startBackendWarmUp(): void {
  void warmUpBackend();
  setInterval(() => {
    if (document.visibilityState === "visible") void warmUpBackend();
  }, 4 * 60 * 1000);
}

export function isBackendWarm(): boolean {
  return warmedUp;
}
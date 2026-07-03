/**
 * Client-side gibberish / non-claim detector.
 * Mirrors the server-side gate in analyze-news/index.ts so we can reject
 * nonsense (emoji spam, "meow meow meow", "asdfghjkl", etc.) BEFORE
 * spending a network round-trip, an AI call, or a SerpAPI search.
 *
 * Returns null when the text looks like a real factual claim,
 * or a short user-facing error message when it does not.
 */
export function validateClaim(raw: string): string | null {
  const text = (raw ?? "").trim();
  if (!text) return "Please enter a claim to verify.";
  if (text.length < 15) return "That's too short to verify. Please enter a fuller statement.";

  const letters = text.replace(/[^\p{L}\p{N}\s]/gu, "").trim();
  if (letters.length < 10) {
    return "This doesn't appear to be a factual claim. Please enter a real statement or news claim to verify.";
  }

  const words = letters.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length < 4) {
    return "This doesn't appear to be a factual claim. Please enter a real statement or news claim to verify.";
  }

  const unique = new Set(words);
  if (unique.size <= 2 && words.length >= 4) {
    return "This doesn't appear to be a factual claim. Please enter a real statement or news claim to verify.";
  }
  // Only enforce diversity on short inputs; long real prose naturally
  // repeats common words ("the", "and", etc.) and shouldn't be flagged.
  if (words.length >= 6 && words.length < 30 && unique.size / words.length < 0.35) {
    return "This doesn't appear to be a factual claim. Please enter a real statement or news claim to verify.";
  }

  const noVowelLong = words.filter((w) => w.length >= 6 && !/[aeiouAEIOU]/.test(w));
  if (noVowelLong.length / words.length > 0.4) {
    return "This doesn't appear to be a factual claim. Please enter a real statement or news claim to verify.";
  }

  const wordy = words.filter((w) => /[aeiou]/i.test(w) && w.length <= 15);
  if (wordy.length / words.length < 0.55) {
    return "This doesn't appear to be a factual claim. Please enter a real statement or news claim to verify.";
  }

  const avgLen = letters.replace(/\s/g, "").length / words.length;
  if (avgLen > 12) {
    return "This doesn't appear to be a factual claim. Please enter a real statement or news claim to verify.";
  }

  return null;
}

import { describe, it, expect } from "vitest";
import { validateClaim } from "../claimValidator";

describe("validateClaim — real factual claims (should PASS)", () => {
  const valid = [
    "The Prime Minister of India inaugurated the new expressway in Mumbai yesterday.",
    "Doctors at AIIMS have reported a new treatment for early-stage diabetes.",
    "The Election Commission announced the general election dates for 2024.",
    "NASA confirmed water molecules on the sunlit surface of the Moon.",
  ];
  it.each(valid)("accepts: %s", (text) => {
    expect(validateClaim(text)).toBeNull();
  });
});

describe("validateClaim — gibberish / nonsense (should FAIL)", () => {
  const invalid: [string, string][] = [
    ["repeated word spam", "meow meow meow meow meow meow"],
    ["keyboard mash", "asdfghjkl qwertyuiop zxcvbnm"],
    ["empty", ""],
    ["whitespace", "     "],
    ["too short", "hi"],
    ["emoji only", "😀😀😀😀😀😀😀😀"],
    ["symbol spam", "!!!!!!!!!!!!!!!!!!"],
    ["single word repeated", "spam spam spam spam spam spam spam"],
    ["random consonant chunks", "bcdfg hjklm npqrs tvwxz bcdfg"],
  ];
  it.each(invalid)("rejects (%s)", (_label, text) => {
    expect(validateClaim(text)).not.toBeNull();
  });
});

describe("validateClaim — very long real text", () => {
  it("accepts a long, well-formed article body", () => {
    const text = (
      "The government today announced a comprehensive climate policy that " +
      "includes new emission targets for the manufacturing sector, financial " +
      "incentives for electric vehicles, and a plan to expand solar capacity."
    ).repeat(3);
    expect(validateClaim(text)).toBeNull();
  });
});

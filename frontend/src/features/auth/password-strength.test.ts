import { describe, expect, it } from "vitest";

import { evaluatePasswordStrength } from "./password-strength";

describe("evaluatePasswordStrength", () => {
  it("shows nothing for an empty password", () => {
    expect(evaluatePasswordStrength("")).toEqual({ score: 0, label: "" });
  });

  it("flags passwords under the minimum length", () => {
    expect(evaluatePasswordStrength("Ab1!")).toEqual({
      score: 1,
      label: "Trop court",
    });
  });

  it.each(["azertyuiop", "motdepasse2026", "aaaaaaaaaaaa"])(
    "rates %s as weak",
    (password) => {
      expect(evaluatePasswordStrength(password).label).toBe("Faible");
    },
  );

  it("rewards a long passphrase without symbols or capitals", () => {
    expect(
      evaluatePasswordStrength("les-chats-dorment-au-soleil").score,
    ).toBeGreaterThanOrEqual(3);
  });

  it("rates a long and varied password as excellent", () => {
    expect(evaluatePasswordStrength("Correct-horse-42").label).toBe(
      "Excellent",
    );
  });
});

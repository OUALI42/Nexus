export const PASSWORD_MIN_LENGTH = 10; // must match the backend validators (S1)

export type PasswordScore = 0 | 1 | 2 | 3 | 4;

export type PasswordStrength = {
  score: PasswordScore;
  label: string;
};

const LABELS: Record<Exclude<PasswordScore, 0>, string> = {
  1: "Faible",
  2: "Moyen",
  3: "Bon",
  4: "Excellent",
};

const COMMON_PATTERNS = [
  "password",
  "motdepasse",
  "azerty",
  "qwerty",
  "123456",
  "abcdef",
  "nexus",
  "admin",
];

const CHARACTER_CLASSES = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d]/];

/**
 * Rough, instant estimate shown while typing. The server remains the
 * authority: it rejects common or too-similar passwords on its own.
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: "" };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { score: 1, label: "Trop court" };
  }

  const lower = password.toLowerCase();
  const hasCommonPattern = COMMON_PATTERNS.some((pattern) =>
    lower.includes(pattern),
  );
  const hasRepetition = /(.)\1{3,}/.test(password); // e.g. "aaaa"
  if (hasCommonPattern || hasRepetition) {
    return { score: 1, label: LABELS[1] };
  }

  const classes = CHARACTER_CLASSES.filter((regex) =>
    regex.test(password),
  ).length;

  let points = 0;
  if (password.length >= 12) points += 1;
  if (password.length >= 16) points += 1;
  if (password.length >= 20) points += 1;
  if (classes >= 3) points += 1;
  if (classes === 4) points += 1;

  const score = Math.min(4, Math.max(1, points)) as Exclude<PasswordScore, 0>;
  return { score, label: LABELS[score] };
}

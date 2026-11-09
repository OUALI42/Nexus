import { cx } from "@/shared/lib/cx";

import {
  evaluatePasswordStrength,
  type PasswordScore,
} from "../password-strength";

const LEVELS = [1, 2, 3, 4] as const;

const BAR_COLORS: Record<Exclude<PasswordScore, 0>, string> = {
  1: "bg-danger",
  2: "bg-warning",
  3: "bg-success",
  4: "bg-success",
};

const TEXT_COLORS: Record<Exclude<PasswordScore, 0>, string> = {
  1: "text-danger",
  2: "text-warning",
  3: "text-success",
  4: "text-success",
};

type PasswordStrengthMeterProps = {
  password: string;
  id: string;
};

export function PasswordStrengthMeter({
  password,
  id,
}: PasswordStrengthMeterProps) {
  const { score, label } = evaluatePasswordStrength(password);

  return (
    <div className="flex items-center gap-3">
      <div aria-hidden="true" className="flex flex-1 gap-1.5">
        {LEVELS.map((level) => (
          <span
            key={level}
            className={cx(
              "h-2 flex-1 rounded-full",
              score >= level && score > 0 ? BAR_COLORS[score as 1] : "bg-line",
            )}
          />
        ))}
      </div>
      <p
        id={id}
        aria-live="polite"
        className={cx(
          "min-w-28 text-sm font-bold",
          score > 0 ? TEXT_COLORS[score as 1] : "text-fg-muted",
        )}
      >
        {label && `Force : ${label}`}
      </p>
    </div>
  );
}

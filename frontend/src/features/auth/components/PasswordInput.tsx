import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";

import { Input } from "@/shared/ui/Input";

import { PasswordStrengthMeter } from "./PasswordStrengthMeter";

type PasswordInputProps = Omit<
  ComponentProps<typeof Input>,
  "type" | "trailing" | "children"
> & {
  showStrength?: boolean;
};

export function PasswordInput({
  showStrength = false,
  id,
  value,
  ...props
}: PasswordInputProps) {
  const [isVisible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const strengthId = `${inputId}-strength`;

  return (
    <Input
      {...props}
      id={inputId}
      value={value}
      type={isVisible ? "text" : "password"}
      // A visible password must never reach a cloud spell checker.
      spellCheck={false}
      autoCapitalize="none"
      autoCorrect="off"
      aria-describedby={showStrength ? strengthId : undefined}
      trailing={
        <button
          type="button"
          aria-label="Afficher le mot de passe"
          aria-pressed={isVisible}
          aria-controls={inputId}
          onClick={() => {
            setVisible((visible) => !visible);
          }}
          className="flex size-tap items-center justify-center rounded-control text-fg-muted hover:bg-surface-muted hover:text-fg"
        >
          {isVisible ? (
            <EyeOff aria-hidden="true" className="size-5" />
          ) : (
            <Eye aria-hidden="true" className="size-5" />
          )}
        </button>
      }
    >
      {showStrength && (
        <PasswordStrengthMeter
          id={strengthId}
          password={typeof value === "string" ? value : ""}
        />
      )}
    </Input>
  );
}

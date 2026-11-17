import { useId, type ReactNode } from "react";

import { FieldError } from "@/shared/ui/FieldError";

import type { LockerChoice } from "../api";

type ChoiceRadioGroupProps = {
  legend: string;
  name: string;
  options: LockerChoice[];
  value: string;
  onChange: (value: string) => void;
  renderOption: (option: LockerChoice, checked: boolean) => ReactNode;
  error?: string;
};

export function ChoiceRadioGroup({
  legend,
  name,
  options,
  value,
  onChange,
  renderOption,
  error,
}: ChoiceRadioGroupProps) {
  const errorId = useId();
  return (
    <fieldset
      aria-describedby={error ? errorId : undefined}
      className="flex flex-col gap-2"
    >
      <legend className="mb-2 font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className="group cursor-pointer rounded-control has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-current"
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => {
                  onChange(option.value);
                }}
                className="sr-only"
              />
              {renderOption(option, checked)}
              <span className="sr-only">{option.label}</span>
            </label>
          );
        })}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </fieldset>
  );
}

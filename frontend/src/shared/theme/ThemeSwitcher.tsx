import type { ThemePreference } from "./theme";
import { useTheme } from "./useTheme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Système" },
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
];

export function ThemeSwitcher() {
  const { preference, setPreference } = useTheme();

  return (
    <fieldset className="flex gap-1 rounded-control border border-line bg-surface p-1">
      <legend className="sr-only">Thème de l'interface</legend>
      {OPTIONS.map((option) => {
        const isSelected = preference === option.value;
        return (
          <label
            key={option.value}
            className="flex min-h-tap flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[0.625rem] px-3 text-sm font-semibold text-fg-muted has-checked:bg-surface-muted has-checked:text-fg has-focus-visible:outline-3 has-focus-visible:outline-focus"
          >
            <input
              type="radio"
              name="theme"
              value={option.value}
              checked={isSelected}
              onChange={() => {
                setPreference(option.value);
              }}
              className="sr-only"
            />
            {isSelected && (
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path d="m3 8.5 3 3 7-7" />
              </svg>
            )}
            {option.label}
          </label>
        );
      })}
    </fieldset>
  );
}

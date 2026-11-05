import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  applyThemePreference,
  readThemePreference,
  saveThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "./theme";
import { ThemeContext } from "./theme-context";

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(readThemePreference);

  // The DOM always reflects the current preference.
  useEffect(() => {
    applyThemePreference(preference);
  }, [preference]);

  // Keeps several open tabs in sync.
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === THEME_STORAGE_KEY) {
        setPreferenceState(readThemePreference());
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    saveThemePreference(next);
    setPreferenceState(next);
  }, []);

  const value = useMemo(
    () => ({ preference, setPreference }),
    [preference, setPreference],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

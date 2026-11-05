import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { THEME_STORAGE_KEY } from "./theme";
import { ThemeProvider } from "./ThemeProvider";
import { ThemeSwitcher } from "./ThemeSwitcher";

function renderSwitcher() {
  return render(
    <ThemeProvider>
      <ThemeSwitcher />
    </ThemeProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("ThemeSwitcher", () => {
  it("follows the system theme by default", () => {
    renderSwitcher();

    expect(screen.getByRole("radio", { name: "Système" })).toBeChecked();
    expect(document.documentElement).not.toHaveAttribute("data-theme");
  });

  it("applies and remembers an explicit choice", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(screen.getByRole("radio", { name: "Sombre" }));

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("restores the saved choice on load", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");

    renderSwitcher();

    expect(screen.getByRole("radio", { name: "Clair" })).toBeChecked();
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("ignores an invalid stored value", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "purple");

    renderSwitcher();

    expect(screen.getByRole("radio", { name: "Système" })).toBeChecked();
  });

  it("goes back to the system theme and forgets the choice", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(screen.getByRole("radio", { name: "Système" }));

    expect(document.documentElement).not.toHaveAttribute("data-theme");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("can be operated with the keyboard", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.tab();
    expect(screen.getByRole("radio", { name: "Système" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Clair" })).toBeChecked();
  });
});

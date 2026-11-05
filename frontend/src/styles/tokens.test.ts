// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { contrastRatio } from "@/shared/a11y/contrast";

const tokensCss = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

type Theme = "light" | "dark";

const LIGHT_DARK_TOKEN =
  /--([\w-]+):\s*light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)/gi;

function parseTokens(css: string): Record<Theme, Map<string, string>> {
  const themes = {
    light: new Map<string, string>(),
    dark: new Map<string, string>(),
  };
  for (const [, name, light, dark] of css.matchAll(LIGHT_DARK_TOKEN)) {
    if (name && light && dark) {
      themes.light.set(name, light);
      themes.dark.set(name, dark);
    }
  }
  return themes;
}

const TEXT = 4.5; // WCAG AA, normal text
const UI = 3; // WCAG AA, UI components and focus indicators

// [foreground token, background token, minimum ratio]
const PAIRS: [string, string, number][] = [
  ["color-text", "color-bg", TEXT],
  ["color-text", "color-surface", TEXT],
  ["color-text", "color-surface-muted", TEXT],
  ["color-text-muted", "color-bg", TEXT],
  ["color-text-muted", "color-surface", TEXT],
  ["color-text-muted", "color-surface-muted", TEXT],
  ["color-primary", "color-bg", TEXT],
  ["color-primary", "color-surface", TEXT],
  ["color-ai", "color-bg", TEXT],
  ["color-ai", "color-surface", TEXT],
  ["color-danger", "color-surface", TEXT],
  ["color-success", "color-surface", TEXT],
  ["color-success", "color-surface-muted", TEXT],
  ["color-on-primary", "color-primary", TEXT],
  ["color-on-primary", "color-primary-hover", TEXT],
  ["color-on-ai", "color-ai", TEXT],
  ["color-on-danger", "color-danger", TEXT],
  ["color-control-border", "color-bg", UI],
  ["color-control-border", "color-surface", UI],
  ["color-focus-ring", "color-bg", UI],
  ["color-focus-ring", "color-surface", UI],
];

const themes = parseTokens(tokensCss);

it("parses the light-dark color tokens", () => {
  expect(themes.light.size).toBeGreaterThan(10);
});

describe.each(["light", "dark"] as const)("%s theme", (theme) => {
  it.each(PAIRS)("%s on %s reaches %d:1", (foreground, background, min) => {
    const fg = themes[theme].get(foreground);
    const bg = themes[theme].get(background);

    expect(fg, `missing token --${foreground}`).toBeDefined();
    expect(bg, `missing token --${background}`).toBeDefined();
    expect(contrastRatio(fg ?? "", bg ?? "")).toBeGreaterThanOrEqual(min);
  });
});

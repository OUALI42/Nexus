// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { contrastRatio } from "@/shared/a11y/contrast";

const tokensCss = readFileSync(
  new URL("./tokens.css", import.meta.url),
  "utf8",
);

type Theme = "light" | "dark";

// --nx-name: light-dark(#light, #dark);  or  --nx-name: #fixed;
const TOKEN =
  /--nx-([\w-]+):\s*(?:light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)|(#[0-9a-f]{6}))\s*;/gi;

function parseTokens(css: string): Record<Theme, Map<string, string>> {
  const themes = {
    light: new Map<string, string>(),
    dark: new Map<string, string>(),
  };
  for (const [, name, light, dark, fixed] of css.matchAll(TOKEN)) {
    const lightValue = light ?? fixed;
    const darkValue = dark ?? fixed;
    if (name && lightValue && darkValue) {
      themes.light.set(name, lightValue);
      themes.dark.set(name, darkValue);
    }
  }
  return themes;
}

const TEXT = 4.5; // WCAG AA, normal text
const UI = 3; // WCAG AA, UI components and focus indicators

// [foreground token, background token, minimum ratio]
const PAIRS: [string, string, number][] = [
  ["fg", "canvas", TEXT],
  ["fg", "surface", TEXT],
  ["fg", "surface-muted", TEXT],
  ["fg-muted", "canvas", TEXT],
  ["fg-muted", "surface", TEXT],
  ["fg-muted", "surface-muted", TEXT],
  ["primary", "canvas", TEXT],
  ["primary", "surface", TEXT],
  ["primary", "surface-muted", TEXT],
  ["ai", "canvas", TEXT],
  ["ai", "surface", TEXT],
  ["danger", "canvas", TEXT],
  ["danger", "surface", TEXT],
  ["success", "canvas", TEXT],
  ["success", "surface", TEXT],
  ["on-brand", "brand-from", TEXT],
  ["on-brand", "brand-to", TEXT],
  ["on-brand", "ai-strong", TEXT],
  ["nav-text", "nav-from", TEXT],
  ["nav-text", "nav-via", TEXT],
  ["nav-text", "nav-to", TEXT],
  ["control", "canvas", UI],
  ["control", "surface", UI],
  ["focus", "canvas", UI],
  ["focus", "surface", UI],
  ["nav-focus", "nav-from", UI],
  ["nav-focus", "nav-via", UI],
  ["nav-focus", "nav-to", UI],
  ["surface", "danger", TEXT],
  ["warning", "canvas", TEXT],
  ["warning", "surface", TEXT],
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

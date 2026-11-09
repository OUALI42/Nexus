import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { expectNoAxeViolations } from "@/test/axe";
import { renderApp } from "@/test/renderApp";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ version: "2026-11" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Privacy policy page", () => {
  it("is public and shows the current version from the API", async () => {
    renderApp("/confidentialite");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Politique de confidentialité",
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Version 2026-11")).toBeInTheDocument();
  });

  it("has no WCAG A/AA violations", async () => {
    renderApp("/confidentialite");
    await screen.findByText("Version 2026-11");

    await expectNoAxeViolations(document.body);
  });
});

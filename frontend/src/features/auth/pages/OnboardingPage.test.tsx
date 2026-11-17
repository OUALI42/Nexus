import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { expectNoAxeViolations } from "@/test/axe";
import {
  clearCsrfCookie,
  jsonResponse,
  mockFetch,
  urlOf,
} from "@/test/mockFetch";
import { renderApp } from "@/test/renderApp";
import { authenticatedSession } from "@/test/sessions";

// The onboarding is switched off in the app: switch it on for these tests,
// so that it still works the day it is wired again.
vi.mock("@/features/auth/config", () => ({
  HOME_AFTER_LOGIN: "/casiers",
  ONBOARDING_ENABLED: true,
}));

afterEach(() => {
  vi.unstubAllGlobals();
  clearCsrfCookie();
});

describe("Onboarding (when enabled)", () => {
  it("sends a new user to the onboarding, whatever the page", async () => {
    mockFetch({
      "/auth/session/": () =>
        jsonResponse(authenticatedSession({ needs_onboarding: true })),
    });
    renderApp("/casiers");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Bienvenue sur Nexus",
      }),
    ).toBeInTheDocument();
  });

  it("finishes the onboarding and opens Mes casiers", async () => {
    const user = userEvent.setup();
    let onboardingDone = false;
    const fetchMock = mockFetch({
      "/auth/session/": () =>
        jsonResponse(
          authenticatedSession({ needs_onboarding: !onboardingDone }),
        ),
      "/auth/onboarding/complete/": () => {
        onboardingDone = true;
        return new Response(null, { status: 204 });
      },
    });
    renderApp("/bienvenue");

    await user.click(
      await screen.findByRole("button", { name: "Accéder à mes casiers" }),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Mes casiers" }),
    ).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(([input]) =>
        urlOf(input).endsWith("/auth/onboarding/complete/"),
      ),
    ).toBe(true);
  });

  it("has no WCAG A/AA violations", async () => {
    mockFetch({
      "/auth/session/": () =>
        jsonResponse(authenticatedSession({ needs_onboarding: true })),
    });
    renderApp("/bienvenue");
    await screen.findByRole("heading", {
      level: 1,
      name: "Bienvenue sur Nexus",
    });

    await expectNoAxeViolations(document.body);
  });
});

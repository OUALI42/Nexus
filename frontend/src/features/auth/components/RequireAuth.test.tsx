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
import { ANONYMOUS_SESSION, authenticatedSession } from "@/test/sessions";

const HEALTH = { "/health/": () => jsonResponse({ status: "ok" }) };

afterEach(() => {
  vi.unstubAllGlobals();
  clearCsrfCookie();
});

describe("Route guards", () => {
  it("sends visitors to the login page", async () => {
    mockFetch({ "/auth/session/": () => jsonResponse(ANONYMOUS_SESSION) });
    renderApp("/casiers");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Connexion" }),
    ).toBeInTheDocument();
  });

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

  it("keeps logged-in users away from the login page", async () => {
    mockFetch({
      "/auth/session/": () => jsonResponse(authenticatedSession()),
      ...HEALTH,
    });
    renderApp("/connexion");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Tableau de bord" }),
    ).toBeInTheDocument();
  });

  it("offers to retry instead of logging out when the server is down", async () => {
    mockFetch({});
    renderApp("/casiers");

    expect(
      await screen.findByText(/Impossible de joindre le serveur/),
    ).toHaveAttribute("role", "alert");
    expect(
      screen.getByRole("button", { name: "Réessayer" }),
    ).toBeInTheDocument();
  });

  it("finishes the onboarding and opens the dashboard", async () => {
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
      ...HEALTH,
    });
    renderApp("/bienvenue");

    await user.click(
      await screen.findByRole("button", {
        name: "Accéder à mon tableau de bord",
      }),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Tableau de bord" }),
    ).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(([input]) =>
        urlOf(input).endsWith("/auth/onboarding/complete/"),
      ),
    ).toBe(true);
  });

  it("has no WCAG A/AA violations on the onboarding page", async () => {
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

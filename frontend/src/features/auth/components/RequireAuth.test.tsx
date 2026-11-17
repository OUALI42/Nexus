import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearCsrfCookie,
  jsonResponse,
  mockFetch,
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

  it("does not send new users to the onboarding while it is not wired", async () => {
    mockFetch({
      "/auth/session/": () =>
        jsonResponse(authenticatedSession({ needs_onboarding: true })),
    });
    renderApp("/bienvenue");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Mes casiers" }),
    ).toBeInTheDocument();
  });

  it("keeps logged-in users away from the login page", async () => {
    mockFetch({
      "/auth/session/": () => jsonResponse(authenticatedSession()),
      ...HEALTH,
    });
    renderApp("/connexion");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Mes casiers" }),
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

});

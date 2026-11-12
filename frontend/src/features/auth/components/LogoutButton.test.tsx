import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearCsrfCookie,
  jsonResponse,
  mockFetch,
  urlOf,
} from "@/test/mockFetch";
import { renderApp } from "@/test/renderApp";
import { ANONYMOUS_SESSION, authenticatedSession } from "@/test/sessions";

afterEach(() => {
  vi.unstubAllGlobals();
  clearCsrfCookie();
});

describe("Logout", () => {
  it("shows who is logged in", async () => {
    mockFetch({
      "/auth/session/": () => jsonResponse(authenticatedSession()),
      "/health/": () => jsonResponse({ status: "ok" }),
    });
    renderApp("/");

    expect(await screen.findByText("ada")).toBeInTheDocument();
  });

  it("logs out on the server and goes back to the login page", async () => {
    const user = userEvent.setup();
    let loggedIn = true;
    const fetchMock = mockFetch({
      "/auth/session/": () =>
        jsonResponse(loggedIn ? authenticatedSession() : ANONYMOUS_SESSION),
      "/auth/logout/": () => {
        loggedIn = false;
        return new Response(null, { status: 204 });
      },
      "/health/": () => jsonResponse({ status: "ok" }),
    });
    renderApp("/");

    await user.click(
      await screen.findByRole("button", { name: "Se déconnecter" }),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Connexion" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tu as été déconnecté.")).toHaveAttribute(
      "role",
      "status",
    );
    expect(
      fetchMock.mock.calls.some(([input]) =>
        urlOf(input).endsWith("/auth/logout/"),
      ),
    ).toBe(true);
  });

  it("forgets the cached session after logging out", async () => {
    const user = userEvent.setup();
    let loggedIn = true;
    const fetchMock = mockFetch({
      "/auth/session/": () =>
        jsonResponse(loggedIn ? authenticatedSession() : ANONYMOUS_SESSION),
      "/auth/logout/": () => {
        loggedIn = false;
        return new Response(null, { status: 204 });
      },
      "/health/": () => jsonResponse({ status: "ok" }),
    });
    renderApp("/");
    await user.click(
      await screen.findByRole("button", { name: "Se déconnecter" }),
    );
    await screen.findByRole("heading", { level: 1, name: "Connexion" });

    const sessionCalls = fetchMock.mock.calls.filter(([input]) =>
      urlOf(input).endsWith("/auth/session/"),
    );
    // Asked again after logout: nothing was kept from the previous user.
    expect(sessionCalls.length).toBeGreaterThanOrEqual(2);
  });

  it("stays logged in and warns when the logout fails", async () => {
    const user = userEvent.setup();
    mockFetch({
      "/auth/session/": () => jsonResponse(authenticatedSession()),
      "/auth/logout/": () => new Response("Server error", { status: 500 }),
      "/health/": () => jsonResponse({ status: "ok" }),
    });
    renderApp("/");

    await user.click(
      await screen.findByRole("button", { name: "Se déconnecter" }),
    );

    expect(
      await screen.findByText(/La déconnexion a échoué/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Tableau de bord" }),
    ).toBeInTheDocument();
  });
});

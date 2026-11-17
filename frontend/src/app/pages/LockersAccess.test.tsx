import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { expectNoAxeViolations } from "@/test/axe";
import { clearCsrfCookie, jsonResponse, mockFetch } from "@/test/mockFetch";
import { renderApp } from "@/test/renderApp";
import { ANONYMOUS_SESSION, authenticatedSession } from "@/test/sessions";

afterEach(() => {
  vi.unstubAllGlobals();
  clearCsrfCookie();
});

describe("Access to Mes casiers", () => {
  it("is not shown to visitors, who are sent to the login page", async () => {
    mockFetch({ "/auth/session/": () => jsonResponse(ANONYMOUS_SESSION) });
    renderApp("/casiers");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Connexion" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 1, name: "Mes casiers" }),
    ).not.toBeInTheDocument();
  });

  it("opens after logging in from a direct link", async () => {
    const user = userEvent.setup();
    mockFetch({
      "/auth/session/": () => jsonResponse(ANONYMOUS_SESSION),
      "/auth/login/": () => jsonResponse(authenticatedSession()),
    });
    renderApp("/casiers");

    await user.type(
      await screen.findByRole("textbox", {
        name: "Adresse e-mail (obligatoire)",
      }),
      "demo.ines@nexus.test",
    );
    await user.type(
      screen.getByLabelText("Mot de passe (obligatoire)"),
      "Revision-demo-2026",
    );
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Mes casiers" }),
    ).toBeInTheDocument();
  });

  it("is shown to logged-in users, marked as the current page", async () => {
    mockFetch({ "/auth/session/": () => jsonResponse(authenticatedSession()) });
    renderApp("/casiers");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Mes casiers" }),
    ).toBeInTheDocument();
    const [sidebar] = screen.getAllByRole("navigation", {
      name: "Navigation principale",
    });
    if (!sidebar) {
      throw new Error("Sidebar navigation not found");
    }
    expect(
      screen.getAllByRole("link", { name: "Mes casiers" })[0],
    ).toHaveAttribute("aria-current", "page");
  });

  it("sends back to the login page when the session expires server-side", async () => {
    let sessionCalls = 0;
    mockFetch({
      // Logged in at first, then the server-side session has expired.
      "/auth/session/": () => {
        sessionCalls += 1;
        return jsonResponse(
          sessionCalls === 1 ? authenticatedSession() : ANONYMOUS_SESSION,
        );
      },
      // A protected request now fails: the session is gone.
      "/health/": () =>
        jsonResponse(
          {
            error: {
              code: "not_authenticated",
              message: "Informations d'authentification non fournies.",
            },
          },
          403,
        ),
    });
    renderApp("/");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Connexion" }),
    ).toBeInTheDocument();
  });

  it("has no WCAG A/AA violations", async () => {
    mockFetch({ "/auth/session/": () => jsonResponse(authenticatedSession()) });
    renderApp("/casiers");
    await screen.findByRole("heading", { level: 1, name: "Mes casiers" });

    await expectNoAxeViolations(document.body);
  });
});

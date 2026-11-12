import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { expectNoAxeViolations } from "@/test/axe";
import {
  clearCsrfCookie,
  jsonResponse,
  mockFetch,
  requestBody,
  urlOf,
} from "@/test/mockFetch";
import { renderApp } from "@/test/renderApp";
import { ANONYMOUS_SESSION, authenticatedSession } from "@/test/sessions";

function apiError(code: string, message: string, status: number) {
  return () => jsonResponse({ error: { code, message } }, status);
}

function mockLogin(loginResponse: () => Response) {
  return mockFetch({
    "/auth/session/": () => jsonResponse(ANONYMOUS_SESSION),
    "/auth/login/": loginResponse,
    "/health/": () => jsonResponse({ status: "ok" }),
  });
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    await screen.findByRole("textbox", {
      name: "Adresse e-mail (obligatoire)",
    }),
    "ada@example.com",
  );
  await user.type(
    screen.getByLabelText("Mot de passe (obligatoire)"),
    "Str0ng-password!",
  );
  await user.click(screen.getByRole("button", { name: "Se connecter" }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  clearCsrfCookie();
});

describe("Login form", () => {
  it("masks the password and links to sign-up and password recovery", async () => {
    mockLogin(() => jsonResponse(authenticatedSession()));
    renderApp("/connexion");

    expect(
      await screen.findByLabelText("Mot de passe (obligatoire)"),
    ).toHaveAttribute("type", "password");
    expect(
      screen.getByRole("link", { name: "Créer un compte" }),
    ).toHaveAttribute("href", "/inscription");
    expect(
      screen.getByRole("link", { name: "Mot de passe oublié ?" }),
    ).toHaveAttribute("href", "/mot-de-passe-oublie");
  });

  it("checks the fields before sending", async () => {
    const user = userEvent.setup();
    const fetchMock = mockLogin(() => jsonResponse(authenticatedSession()));
    renderApp("/connexion");

    await user.click(
      await screen.findByRole("button", { name: "Se connecter" }),
    );

    expect(
      screen.getByRole("textbox", { name: "Adresse e-mail (obligatoire)" }),
    ).toHaveFocus();
    expect(
      fetchMock.mock.calls.some(([input]) =>
        urlOf(input).endsWith("/auth/login/"),
      ),
    ).toBe(false);
  });

  it("opens the dashboard after logging in", async () => {
    const user = userEvent.setup();
    const fetchMock = mockLogin(() => jsonResponse(authenticatedSession()));
    renderApp("/connexion");

    await fillAndSubmit(user);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Tableau de bord" }),
    ).toBeInTheDocument();
    expect(requestBody(fetchMock, "/auth/login/")).toEqual({
      email: "ada@example.com",
      password: "Str0ng-password!",
    });
  });

  it("opens the onboarding on the first login", async () => {
    const user = userEvent.setup();
    mockLogin(() =>
      jsonResponse(authenticatedSession({ needs_onboarding: true })),
    );
    renderApp("/connexion");

    await fillAndSubmit(user);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Bienvenue sur Nexus",
      }),
    ).toBeInTheDocument();
  });

  it("comes back to the page that required logging in", async () => {
    const user = userEvent.setup();
    mockLogin(() => jsonResponse(authenticatedSession()));
    renderApp("/casiers");

    await fillAndSubmit(user);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Mes casiers" }),
    ).toBeInTheDocument();
  });

  it("shows a generic message and clears the password on failure", async () => {
    const user = userEvent.setup();
    mockLogin(apiError("invalid_credentials", "Identifiants invalides.", 401));
    renderApp("/connexion");

    await fillAndSubmit(user);

    expect(await screen.findByText("Identifiants invalides.")).toHaveAttribute(
      "role",
      "alert",
    );
    const password = screen.getByLabelText("Mot de passe (obligatoire)");
    expect(password).toHaveValue("");
    expect(password).toHaveFocus();
    expect(
      screen.getByRole("textbox", { name: "Adresse e-mail (obligatoire)" }),
    ).toHaveValue("ada@example.com");
    expect(password).not.toHaveAttribute("aria-invalid");
  });

  it("shows the neutral lockout message", async () => {
    const user = userEvent.setup();
    mockLogin(
      apiError(
        "too_many_attempts",
        "Trop de tentatives de connexion. Réessaie dans 15 minutes.",
        429,
      ),
    );
    renderApp("/connexion");

    await fillAndSubmit(user);

    expect(
      await screen.findByText(/Trop de tentatives de connexion/),
    ).toHaveAttribute("role", "alert");
  });

  it("offers to resend the link when the email is not verified", async () => {
    const user = userEvent.setup();
    mockLogin(
      apiError(
        "email_not_verified",
        "Confirme d'abord ton adresse e-mail.",
        403,
      ),
    );
    renderApp("/connexion");

    await fillAndSubmit(user);

    const section = (
      await screen.findByRole("heading", {
        name: "Renvoyer le lien de confirmation",
      })
    ).closest("section");
    if (!section) {
      throw new Error("Resend section not found");
    }
    expect(within(section).getByRole("textbox")).toHaveValue("ada@example.com");
  });

  it("has no WCAG A/AA violations with an error displayed", async () => {
    const user = userEvent.setup();
    mockLogin(apiError("invalid_credentials", "Identifiants invalides.", 401));
    renderApp("/connexion");

    await fillAndSubmit(user);
    await screen.findByText("Identifiants invalides.");

    await expectNoAxeViolations(document.body);
  });
});

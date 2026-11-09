import { screen } from "@testing-library/react";
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

function apiError(code: string, message: string) {
  return () => jsonResponse({ error: { code, message } }, 400);
}

afterEach(() => {
  vi.unstubAllGlobals();
  clearCsrfCookie();
});

describe("Email verification page", () => {
  it("does not verify anything until the user clicks", async () => {
    const fetchMock = mockFetch({
      "/auth/verify-email/": () => new Response(null, { status: 204 }),
    });
    renderApp("/verifier-email?token=abc");

    expect(
      await screen.findByRole("button", { name: "Confirmer mon adresse" }),
    ).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(([input]) =>
        urlOf(input).endsWith("/auth/verify-email/"),
      ),
    ).toBe(false);
  });

  it("confirms the address and focuses the result", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch({
      "/auth/verify-email/": () => new Response(null, { status: 204 }),
    });
    renderApp("/verifier-email?token=abc");

    await user.click(
      await screen.findByRole("button", { name: "Confirmer mon adresse" }),
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Adresse confirmée",
      }),
    ).toHaveFocus();
    expect(
      screen.getByRole("link", { name: "Aller à la connexion" }),
    ).toBeInTheDocument();
    expect(requestBody(fetchMock, "/auth/verify-email/")).toEqual({
      token: "abc",
    });
  });

  it("sends to the login page when the link was already used", async () => {
    const user = userEvent.setup();
    mockFetch({
      "/auth/verify-email/": apiError(
        "token_used",
        "Ce lien a déjà été utilisé.",
      ),
    });
    renderApp("/verifier-email?token=abc");

    await user.click(
      await screen.findByRole("button", { name: "Confirmer mon adresse" }),
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Lien déjà utilisé",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Aller à la connexion" }),
    ).toBeInTheDocument();
  });

  it("offers a new link when the link expired", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch({
      "/auth/verify-email/": apiError("token_expired", "Ce lien a expiré."),
      "/auth/resend-verification/": () => new Response(null, { status: 202 }),
    });
    renderApp("/verifier-email?token=abc");

    await user.click(
      await screen.findByRole("button", { name: "Confirmer mon adresse" }),
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: "Lien expiré" }),
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: "Adresse e-mail (obligatoire)" }),
      "ada@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Renvoyer le lien" }));

    expect(await screen.findByText(/un nouveau lien/)).toHaveFocus();
    expect(requestBody(fetchMock, "/auth/resend-verification/")).toEqual({
      email: "ada@example.com",
    });
  });

  it("explains an incomplete link", async () => {
    mockFetch({});
    renderApp("/verifier-email");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Lien incomplet" }),
    ).toBeInTheDocument();
  });

  it("has no WCAG A/AA violations", async () => {
    mockFetch({});
    renderApp("/verifier-email?token=abc");
    await screen.findByRole("button", { name: "Confirmer mon adresse" });

    await expectNoAxeViolations(document.body);
  });
});

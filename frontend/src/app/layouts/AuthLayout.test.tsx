import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { expectNoAxeViolations } from "@/test/axe";
import { renderApp } from "@/test/renderApp";

describe("Auth layout", () => {
  it("offers a skip link and a link to log in from the sign-up page", async () => {
    const user = userEvent.setup();
    renderApp("/inscription");
    await screen.findByRole("heading", { level: 1, name: "Créer mon compte" });

    await user.tab();
    expect(
      screen.getByRole("link", { name: "Aller au contenu principal" }),
    ).toHaveFocus();
    expect(
      screen.getByRole("link", { name: "J'ai déjà un compte" }),
    ).toHaveAttribute("href", "/connexion");
  });

  it("moves the focus to the title when switching pages", async () => {
    const user = userEvent.setup();
    renderApp("/inscription");

    await user.click(
      await screen.findByRole("link", { name: "J'ai déjà un compte" }),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Connexion" }),
    ).toHaveFocus();
  });

  it("has no WCAG A/AA violations", async () => {
    renderApp("/inscription");

    await expectNoAxeViolations(document.body);
  });
});

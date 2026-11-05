import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it } from "vitest";

import { expectNoAxeViolations } from "@/test/axe";
import { renderWithAppProviders } from "@/test/renderApp";

import { DesignSystemPage } from "./DesignSystemPage";

describe("Design system page", () => {
  it("has no WCAG A/AA violations", async () => {
    renderWithAppProviders(<DesignSystemPage />);

    await expectNoAxeViolations(document.body);
  });

  it("has no WCAG A/AA violations with the modal open and a toast shown", async () => {
    const user = userEvent.setup();
    renderWithAppProviders(<DesignSystemPage />);

    await user.click(screen.getByRole("button", { name: "Erreur" }));
    await user.click(
      screen.getByRole("button", { name: "Supprimer le casier" }),
    );
    screen.getByRole("dialog", { name: "Supprimer le casier ?" });

    await expectNoAxeViolations(document.body);
  });
});

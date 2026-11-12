import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/axe";
import { renderApp } from "@/test/renderApp";
import { jsonResponse, mockFetch } from "@/test/mockFetch";
import { authenticatedSession } from "@/test/sessions";

beforeEach(() => {
  mockFetch({ "/auth/session/": () => jsonResponse(authenticatedSession()) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});
// Without CSS, jsdom shows both navigations: the sidebar one comes first.
async function findSidebarNav() {
  const [sidebar] = await screen.findAllByRole("navigation", {
    name: "Navigation principale",
  });
  if (!sidebar) {
    throw new Error("Sidebar navigation not found");
  }
  return sidebar;
}

describe("Layout and navigation", () => {
  it("starts with a skip link to the main content", async () => {
    const user = userEvent.setup();
    renderApp("/casiers");
    await screen.findByRole("heading", { level: 1, name: "Mes casiers" });

    await user.tab();

    const skipLink = screen.getByRole("link", {
      name: "Aller au contenu principal",
    });
    expect(skipLink).toHaveFocus();
    expect(skipLink).toHaveAttribute("href", "#contenu");

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "contenu");
    expect(main).toHaveAttribute("tabindex", "-1");
  });

  it("marks the current page for assistive technologies", async () => {
    renderApp("/casiers");
    const nav = await findSidebarNav();

    expect(
      await within(nav).findByRole("link", { name: "Mes casiers" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(nav).getByRole("link", { name: "Tableau de bord" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("moves the focus to the new page title after navigating", async () => {
    const user = userEvent.setup();
    renderApp("/casiers");
    const nav = await findSidebarNav();

    await user.click(within(nav).getByRole("link", { name: "QCM" }));

    const heading = await screen.findByRole("heading", {
      level: 1,
      name: "QCM",
    });
    expect(heading).toHaveFocus();
    expect(within(nav).getByRole("link", { name: "QCM" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("reaches the secondary pages through the Plus menu", async () => {
    const user = userEvent.setup();
    renderApp("/casiers");

    await user.click(await screen.findByRole("button", { name: "Plus" }));
    const dialog = screen.getByRole("dialog", { name: "Plus" });
    await user.click(
      within(dialog).getByRole("link", { name: "Fiches de révision" }),
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Fiches de révision",
      }),
    ).toHaveFocus();
    expect(dialog).not.toHaveAttribute("open");
    expect(
      screen.getByRole("button", { name: "Plus (contient la page actuelle)" }),
    ).toBeInTheDocument();
  });

  it("has no WCAG A/AA violations", async () => {
    renderApp("/casiers");
    await screen.findByRole("heading", { level: 1, name: "Mes casiers" });

    await expectNoAxeViolations(document.body);
  });

  it("has no WCAG A/AA violations with the Plus menu open", async () => {
    const user = userEvent.setup();
    renderApp("/casiers");

    await user.click(await screen.findByRole("button", { name: "Plus" }));
    screen.getByRole("dialog", { name: "Plus" });

    await expectNoAxeViolations(document.body);
  });
});

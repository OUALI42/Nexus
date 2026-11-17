import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { expectNoAxeViolations } from "@/test/axe";
import { HISTORY_LOCKER, LOCKER_CHOICES, MATHS_LOCKER } from "@/test/lockers";
import { clearCsrfCookie, jsonResponse, mockFetch } from "@/test/mockFetch";
import { renderApp } from "@/test/renderApp";
import { authenticatedSession } from "@/test/sessions";

afterEach(() => {
  vi.unstubAllGlobals();
  clearCsrfCookie();
});

function mockLockers(lockers: () => Response) {
  return mockFetch({
    "/auth/session/": () => jsonResponse(authenticatedSession()),
    "/lockers/": lockers,
    "/lockers/choices/": () => jsonResponse(LOCKER_CHOICES),
  });
}

describe("Mes casiers", () => {
  it("lists the lockers with their name and number of courses", async () => {
    mockLockers(() => jsonResponse([MATHS_LOCKER, HISTORY_LOCKER]));
    renderApp("/casiers");

    expect(
      await screen.findByRole("link", { name: "Mathématiques 3 cours" }),
    ).toHaveAttribute("href", "/casiers/1");
    expect(
      screen.getByRole("link", { name: "Histoire-géographie Aucun cours" }),
    ).toHaveAttribute("href", "/casiers/2");
  });

  it("invites to create a first locker when there is none", async () => {
    mockLockers(() => jsonResponse([]));
    renderApp("/casiers");

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Tu n'as pas encore de casier",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Créer mon premier casier" }),
    ).toHaveAttribute("href", "/casiers/nouveau");
    expect(
      screen.queryByRole("link", { name: "Nouveau casier" }),
    ).not.toBeInTheDocument();
  });

  it("can retry when the lockers fail to load", async () => {
    const user = userEvent.setup();
    let calls = 0;
    mockLockers(() => {
      calls += 1;
      return calls === 1
        ? jsonResponse(
            { error: { code: "server_error", message: "Erreur interne." } },
            500,
          )
        : jsonResponse([MATHS_LOCKER]);
    });
    renderApp("/casiers");

    await user.click(await screen.findByRole("button", { name: "Réessayer" }));

    expect(
      await screen.findByRole("link", { name: "Mathématiques 3 cours" }),
    ).toBeInTheDocument();
  });

  it("opens the creation form", async () => {
    const user = userEvent.setup();
    mockLockers(() => jsonResponse([MATHS_LOCKER]));
    renderApp("/casiers");

    await user.click(
      await screen.findByRole("link", { name: "Nouveau casier" }),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Nouveau casier" }),
    ).toBeInTheDocument();
  });

  it("has no WCAG A/AA violations", async () => {
    mockLockers(() => jsonResponse([MATHS_LOCKER, HISTORY_LOCKER]));
    renderApp("/casiers");
    await screen.findByRole("link", { name: "Mathématiques 3 cours" });

    await expectNoAxeViolations(document.body);
  });
});

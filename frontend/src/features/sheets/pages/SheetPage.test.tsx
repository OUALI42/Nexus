import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { expectNoAxeViolations } from "@/test/axe";
import { MATHS_LOCKER } from "@/test/lockers";
import { clearCsrfCookie, jsonResponse, mockFetch } from "@/test/mockFetch";
import { renderApp } from "@/test/renderApp";
import { authenticatedSession } from "@/test/sessions";
import { SUITES_SHEET_DETAIL } from "@/test/sheets";

afterEach(() => {
  vi.unstubAllGlobals();
  clearCsrfCookie();
});

function mockSheetPages(sheet: unknown = SUITES_SHEET_DETAIL) {
  return mockFetch({
    "/auth/session/": () => jsonResponse(authenticatedSession()),
    "/sheets/12/": (init) =>
      init?.method === "DELETE"
        ? new Response(null, { status: 204 })
        : init?.method === "PATCH"
          ? jsonResponse(sheet)
          : jsonResponse(sheet),
    // The locker page, where we land after deleting or leaving.
    "/lockers/1/": () => jsonResponse(MATHS_LOCKER),
    "/lockers/1/courses/": () => jsonResponse([]),
    "/lockers/1/sheets/": () => jsonResponse([]),
  });
}

function deleteCalls(fetchMock: ReturnType<typeof mockFetch>) {
  return fetchMock.mock.calls.filter(([, init]) => init?.method === "DELETE");
}

describe("Sheet page", () => {
  it("shows the sheet with its formatting", async () => {
    mockSheetPages();
    renderApp("/fiches/12");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Suites numériques : l'essentiel",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Convergence" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Modifiée le 20 novembre 2026"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Modifier" })).toHaveAttribute(
      "href",
      "/fiches/12/modifier",
    );
  });

  it("sanitizes the content again before displaying it", async () => {
    mockSheetPages({
      ...SUITES_SHEET_DETAIL,
      content: '<p>Cours</p><img src="x" onerror="alert(1)">',
    });
    renderApp("/fiches/12");

    expect(await screen.findByText("Cours")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("deletes the sheet only after confirmation", async () => {
    const user = userEvent.setup();
    const fetchMock = mockSheetPages();
    renderApp("/fiches/12");

    await user.click(await screen.findByRole("button", { name: "Supprimer" }));
    const dialog = screen.getByRole("dialog", {
      name: "Supprimer cette fiche ?",
    });
    expect(dialog).toHaveAccessibleDescription(
      "« Suites numériques : l'essentiel » sera définitivement supprimée.",
    );
    expect(deleteCalls(fetchMock)).toHaveLength(0);

    await user.click(
      screen.getByRole("button", { name: "Supprimer définitivement" }),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Mathématiques" }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Fiche supprimée/)).toBeInTheDocument();
    expect(deleteCalls(fetchMock)).toHaveLength(1);
  });

  it("keeps the sheet when the deletion is cancelled", async () => {
    const user = userEvent.setup();
    const fetchMock = mockSheetPages();
    renderApp("/fiches/12");

    await user.click(await screen.findByRole("button", { name: "Supprimer" }));
    await user.click(screen.getByRole("button", { name: "Annuler" }));

    expect(
      screen.queryByRole("dialog", { name: "Supprimer cette fiche ?" }),
    ).not.toBeInTheDocument();
    expect(deleteCalls(fetchMock)).toHaveLength(0);
  });

  it("says the sheet cannot be found, whatever the reason", async () => {
    mockFetch({
      "/auth/session/": () => jsonResponse(authenticatedSession()),
      "/sheets/99/": () =>
        jsonResponse(
          { error: { code: "not_found", message: "Introuvable." } },
          404,
        ),
    });
    renderApp("/fiches/99");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Fiche introuvable",
      }),
    ).toBeInTheDocument();
  });

  it("asks before leaving the editor with unsaved changes", async () => {
    const user = userEvent.setup();
    mockSheetPages();
    renderApp("/fiches/12/modifier");
    const title = await screen.findByRole("textbox", {
      name: "Titre de la fiche (obligatoire)",
    });

    await user.type(title, " (brouillon)");
    await user.click(screen.getByRole("link", { name: "Retour au casier" }));

    expect(
      screen.getByRole("dialog", { name: "Quitter sans enregistrer ?" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Rester sur la page" }),
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Modifier la fiche" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Retour au casier" }));
    await user.click(
      screen.getByRole("button", { name: "Quitter sans enregistrer" }),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Mathématiques" }),
    ).toBeInTheDocument();
  });

  it("has no WCAG A/AA violations", async () => {
    mockSheetPages();
    renderApp("/fiches/12");
    await screen.findByRole("heading", { level: 2, name: "Convergence" });

    await expectNoAxeViolations(document.body);
  });
});

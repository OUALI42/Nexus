import { act, screen, within } from "@testing-library/react";
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

function sentBody(
  fetchMock: ReturnType<typeof mockFetch>,
  method: string,
): unknown {
  const call = fetchMock.mock.calls.find(([, init]) => init?.method === method);
  const body = call?.[1]?.body;
  if (typeof body !== "string") {
    throw new Error(`No JSON body sent with ${method}`);
  }
  return JSON.parse(body);
}

function titleField() {
  return screen.findByRole("textbox", {
    name: "Titre de la fiche (obligatoire)",
  });
}

function mockEditPage(
  patch: () => Response = () => jsonResponse(SUITES_SHEET_DETAIL),
) {
  return mockFetch({
    "/auth/session/": () => jsonResponse(authenticatedSession()),
    "/sheets/12/": (init) =>
      init?.method === "PATCH" ? patch() : jsonResponse(SUITES_SHEET_DETAIL),
  });
}

describe("Sheet editor", () => {
  it("creates a sheet, then keeps editing it", async () => {
    const user = userEvent.setup();
    const created = { ...SUITES_SHEET_DETAIL, title: "Suites", content: "" };
    const fetchMock = mockFetch({
      "/auth/session/": () => jsonResponse(authenticatedSession()),
      "/lockers/1/": () => jsonResponse(MATHS_LOCKER),
      "/lockers/1/sheets/": () => jsonResponse(created, 201),
      "/sheets/12/": () => jsonResponse(created),
    });
    renderApp("/casiers/1/fiches/nouvelle");

    await user.type(await titleField(), "Suites");
    await user.click(
      screen.getByRole("button", { name: "Enregistrer la fiche" }),
    );

    expect(
      await screen.findByRole(
        "heading",
        { level: 1, name: "Modifier la fiche" },
        // Heaviest test of the suite: two pages with a TipTap editor each.
        { timeout: 8000 },
      ),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole(
        "heading",
        { level: 1, name: "Modifier la fiche" },
        // Heaviest test of the suite: two pages with a TipTap editor each.
        { timeout: 8000 },
      ),
    ).toBeInTheDocument();
    expect(sentBody(fetchMock, "POST")).toEqual({
      title: "Suites",
      content: "",
    });
  });

  it("requires a title before sending anything", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch({
      "/auth/session/": () => jsonResponse(authenticatedSession()),
      "/lockers/1/": () => jsonResponse(MATHS_LOCKER),
    });
    renderApp("/casiers/1/fiches/nouvelle");
    const title = await titleField();

    await user.click(
      screen.getByRole("button", { name: "Enregistrer la fiche" }),
    );

    expect(screen.getByText("Donne un titre à ta fiche.")).toBeInTheDocument();
    expect(title).toHaveFocus();
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === "POST"),
    ).toBe(false);
  });

  it("loads a sheet, shows unsaved changes and confirms the save", async () => {
    const user = userEvent.setup();
    const fetchMock = mockEditPage(() =>
      jsonResponse({ ...SUITES_SHEET_DETAIL, title: "Suites (v2)" }),
    );
    renderApp("/fiches/12/modifier");

    const title = await titleField();
    expect(title).toHaveValue("Suites numériques : l'essentiel");
    expect(
      screen.getByRole("textbox", { name: "Contenu de la fiche" }),
    ).toHaveTextContent("Convergence");

    await user.clear(title);
    await user.type(title, "Suites (v2)");
    expect(
      screen.getByText("Modifications non enregistrées"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(await screen.findByText(/Enregistrée à/)).toBeInTheDocument();
    expect(sentBody(fetchMock, "PATCH")).toEqual({
      title: "Suites (v2)",
      content: SUITES_SHEET_DETAIL.content,
    });
  });

  it("shows a content error from the API under the editor", async () => {
    const user = userEvent.setup();
    mockEditPage(() =>
      jsonResponse(
        {
          error: {
            code: "validation_error",
            message: "Certaines données sont invalides.",
            details: { content: ["Le contenu est trop long."] },
          },
        },
        400,
      ),
    );
    renderApp("/fiches/12/modifier");
    await titleField();

    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(
      await screen.findByText("Le contenu est trop long."),
    ).toBeInTheDocument();
  });

  it("moves through the toolbar with the arrow keys", async () => {
    const user = userEvent.setup();
    mockEditPage();
    renderApp("/fiches/12/modifier");

    const toolbar = await screen.findByRole("toolbar", {
      name: "Mise en forme",
    });
    const bold = within(toolbar).getByRole("button", { name: "Gras" });
    expect(bold).toHaveAttribute("aria-pressed", "false");
    expect(bold).toHaveAttribute("tabindex", "0");

    act(() => {
      bold.focus();
    });
    await user.keyboard("{ArrowRight}");
    expect(
      within(toolbar).getByRole("button", { name: "Italique" }),
    ).toHaveFocus();

    await user.keyboard("{End}");
    expect(
      within(toolbar).getByRole("button", { name: "Rétablir" }),
    ).toHaveFocus();
  });

  it("has no WCAG A/AA violations", async () => {
    mockEditPage();
    renderApp("/fiches/12/modifier");
    await screen.findByRole("toolbar", { name: "Mise en forme" });

    await expectNoAxeViolations(document.body);
  });
});

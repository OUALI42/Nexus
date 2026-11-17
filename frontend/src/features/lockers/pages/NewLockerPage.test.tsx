import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { expectNoAxeViolations } from "@/test/axe";
import { LOCKER_CHOICES, MATHS_LOCKER } from "@/test/lockers";
import {
  clearCsrfCookie,
  jsonResponse,
  mockFetch,
  requestBody,
} from "@/test/mockFetch";
import { renderApp } from "@/test/renderApp";
import { authenticatedSession } from "@/test/sessions";

const CREATED_LOCKER = {
  id: 3,
  name: "Philosophie",
  color: "#0e7490",
  icon: "atom",
  position: 1,
  course_count: 0,
};

afterEach(() => {
  vi.unstubAllGlobals();
  clearCsrfCookie();
});

function mockNewLocker(createResponse: () => Response) {
  return mockFetch({
    "/auth/session/": () => jsonResponse(authenticatedSession()),
    "/lockers/": (init) =>
      init?.method === "POST"
        ? createResponse()
        : jsonResponse([MATHS_LOCKER, CREATED_LOCKER]),
    "/lockers/choices/": () => jsonResponse(LOCKER_CHOICES),
  });
}

function postCalls(fetchMock: ReturnType<typeof mockFetch>) {
  return fetchMock.mock.calls.filter(([, init]) => init?.method === "POST");
}

function nameField() {
  return screen.findByRole("textbox", { name: "Nom du casier (obligatoire)" });
}

describe("New locker", () => {
  it("requires a name before sending anything", async () => {
    const user = userEvent.setup();
    const fetchMock = mockNewLocker(() => jsonResponse(CREATED_LOCKER, 201));
    renderApp("/casiers/nouveau");
    const name = await nameField();

    await user.type(name, "   ");
    await user.click(screen.getByRole("button", { name: "Créer le casier" }));

    expect(screen.getByText("Donne un nom à ton casier.")).toBeInTheDocument();
    expect(name).toHaveFocus();
    expect(postCalls(fetchMock)).toHaveLength(0);
  });

  it("chooses the color and icon with the arrow keys, then creates the locker", async () => {
    const user = userEvent.setup();
    const fetchMock = mockNewLocker(() => jsonResponse(CREATED_LOCKER, 201));
    renderApp("/casiers/nouveau");
    await user.type(await nameField(), "Philosophie");

    const indigo = screen.getByRole("radio", { name: "Indigo" });
    expect(indigo).toBeChecked();
    act(() => {
      indigo.focus();
    });
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Cyan" })).toBeChecked();

    const folder = screen.getByRole("radio", { name: "Dossier" });
    expect(folder).toBeChecked();
    act(() => {
      folder.focus();
    });
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Atome" })).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Créer le casier" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Mes casiers" }),
    ).toBeInTheDocument();
    expect(requestBody(fetchMock, "/lockers/")).toEqual({
      name: "Philosophie",
      color: "#0e7490",
      icon: "atom",
    });
  });

  it("shows the API error under the name field", async () => {
    const user = userEvent.setup();
    mockNewLocker(() =>
      jsonResponse(
        {
          error: {
            code: "validation_error",
            message: "Certaines données sont invalides.",
            details: { name: ["Tu as déjà un casier avec ce nom."] },
          },
        },
        400,
      ),
    );
    renderApp("/casiers/nouveau");
    const name = await nameField();

    await user.type(name, "maths");
    await user.click(screen.getByRole("button", { name: "Créer le casier" }));

    expect(
      await screen.findByText("Tu as déjà un casier avec ce nom."),
    ).toBeInTheDocument();
    expect(name).toHaveFocus();
    expect(
      screen.getByRole("heading", { level: 1, name: "Nouveau casier" }),
    ).toBeInTheDocument();
  });

  it("has no WCAG A/AA violations, even with an error displayed", async () => {
    const user = userEvent.setup();
    mockNewLocker(() => jsonResponse(CREATED_LOCKER, 201));
    renderApp("/casiers/nouveau");
    await nameField();

    await user.click(screen.getByRole("button", { name: "Créer le casier" }));
    await screen.findByText("Donne un nom à ton casier.");

    await expectNoAxeViolations(document.body);
  });
});

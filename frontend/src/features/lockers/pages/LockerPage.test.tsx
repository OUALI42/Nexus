import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { expectNoAxeViolations } from "@/test/axe";
import { MATHS_LOCKER, SUITES_COURSE } from "@/test/lockers";
import {
  clearCsrfCookie,
  jsonResponse,
  mockFetch,
  urlOf,
} from "@/test/mockFetch";
import { renderApp } from "@/test/renderApp";
import { authenticatedSession } from "@/test/sessions";

afterEach(() => {
  vi.unstubAllGlobals();
  clearCsrfCookie();
});

type Options = {
  session?: unknown;
  courses?: unknown[];
  upload?: () => Response;
};

function mockLocker({
  session = authenticatedSession(),
  courses = [SUITES_COURSE],
  upload = () => jsonResponse(SUITES_COURSE, 201),
}: Options = {}) {
  return mockFetch({
    "/auth/session/": () => jsonResponse(session),
    "/lockers/1/": () => jsonResponse(MATHS_LOCKER),
    "/lockers/1/courses/": (init) =>
      init?.method === "POST" ? upload() : jsonResponse(courses),
  });
}

function postCalls(fetchMock: ReturnType<typeof mockFetch>) {
  return fetchMock.mock.calls.filter(([, init]) => init?.method === "POST");
}

function pdf(name = "Suites numériques.pdf", size = 1000) {
  return new File(["%PDF-".padEnd(size, "0")], name, {
    type: "application/pdf",
  });
}

describe("Locker page", () => {
  it("shows the locker and its courses", async () => {
    mockLocker();
    renderApp("/casiers/1");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Mathématiques" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("1,2 Mo, ajouté le 17 novembre 2026"),
    ).toBeInTheDocument();
    expect(screen.getByText("En attente d'analyse")).toBeInTheDocument();

    const open = screen.getByRole("link", {
      name: "Ouvrir Suites numériques (nouvel onglet)",
    });
    expect(open).toHaveAttribute("href", "/api/v1/courses/7/file/");
    expect(open).toHaveAttribute("target", "_blank");
    expect(
      screen.getByRole("link", { name: "Télécharger Suites numériques" }),
    ).toHaveAttribute("href", "/api/v1/courses/7/file/?download=1");
  });

  it("uploads a PDF and confirms it", async () => {
    const user = userEvent.setup();
    const fetchMock = mockLocker({ courses: [] });
    renderApp("/casiers/1");
    const input = await screen.findByLabelText("Ajouter un cours (PDF)");
    expect(input).toHaveAccessibleDescription("PDF uniquement, 10 Mo maximum.");

    const file = pdf();
    await user.upload(input, file);

    expect(
      await screen.findByText(
        "« Suites numériques » a été ajouté à ton casier.",
      ),
    ).toBeInTheDocument();
    const [post] = postCalls(fetchMock);
    const body = post?.[1]?.body;
    if (!(body instanceof FormData)) {
      throw new Error("The course was not sent as multipart form data");
    }
    expect(body.get("file")).toHaveProperty("name", "Suites numériques.pdf");
  });

  it("shows the API refusal under the upload button", async () => {
    const user = userEvent.setup();
    mockLocker({
      upload: () =>
        jsonResponse(
          {
            error: {
              code: "validation_error",
              message: "Certaines données sont invalides.",
              details: { file: ["Ce fichier n'est pas un PDF."] },
            },
          },
          400,
        ),
    });
    renderApp("/casiers/1");
    const input = await screen.findByLabelText("Ajouter un cours (PDF)");

    await user.upload(input, pdf("faux.pdf"));

    expect(
      await screen.findByText("Ce fichier n'est pas un PDF."),
    ).toBeInTheDocument();
    expect(input).toHaveAccessibleDescription(
      "PDF uniquement, 10 Mo maximum. Ce fichier n'est pas un PDF.",
    );
  });

  it("refuses a file over the plan limit without sending it", async () => {
    const user = userEvent.setup();
    const base = authenticatedSession();
    const fetchMock = mockLocker({
      session: {
        ...base,
        user: {
          ...base.user,
          plan: { code: "basic", name: "Basique", max_file_size_bytes: 500 },
        },
      },
    });
    renderApp("/casiers/1");

    await user.upload(
      await screen.findByLabelText("Ajouter un cours (PDF)"),
      pdf(),
    );

    expect(
      await screen.findByText(/dépasse la taille maximale autorisée/),
    ).toBeInTheDocument();
    expect(postCalls(fetchMock)).toHaveLength(0);
  });

  it("says the locker cannot be found, whatever the reason", async () => {
    mockFetch({
      "/auth/session/": () => jsonResponse(authenticatedSession()),
      "/lockers/99/": () =>
        jsonResponse(
          { error: { code: "not_found", message: "Introuvable." } },
          404,
        ),
      "/lockers/99/courses/": () =>
        jsonResponse(
          { error: { code: "not_found", message: "Introuvable." } },
          404,
        ),
    });
    renderApp("/casiers/99");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Casier introuvable",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Retour à mes casiers" }),
    ).toHaveAttribute("href", "/casiers");
  });

  it("does not call the API for an invalid locker address", async () => {
    const fetchMock = mockFetch({
      "/auth/session/": () => jsonResponse(authenticatedSession()),
    });
    renderApp("/casiers/abc");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Casier introuvable",
      }),
    ).toBeInTheDocument();
    const urls = fetchMock.mock.calls.map(([input]) => urlOf(input));
    expect(urls.some((url) => url.includes("/lockers/"))).toBe(false);
  });

  it("has no WCAG A/AA violations", async () => {
    mockLocker();
    renderApp("/casiers/1");
    await screen.findByRole("link", {
      name: "Ouvrir Suites numériques (nouvel onglet)",
    });

    await expectNoAxeViolations(document.body);
  });
});

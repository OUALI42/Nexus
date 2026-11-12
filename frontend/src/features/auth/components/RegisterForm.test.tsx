import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { expectNoAxeViolations } from "@/test/axe";
import { renderApp } from "@/test/renderApp";

const TRACKS = [
  {
    label: "Classes préparatoires",
    options: [{ value: "mpsi", label: "MPSI" }],
  },
];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  return input instanceof URL ? input.href : input.url;
}

function mockApi(registerResponse: Response) {
  const fetchMock = vi.fn<typeof fetch>((input) => {
    const url = urlOf(input);
    if (url.endsWith("/auth/tracks/")) return Promise.resolve(json(TRACKS));
    if (url.endsWith("/auth/privacy-policy/")) {
      return Promise.resolve(json({ version: "2026-11" }));
    }
    if (url.endsWith("/auth/csrf/")) {
      document.cookie = "csrftoken=test-token; path=/";
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    if (url.endsWith("/auth/register/")) {
      return Promise.resolve(registerResponse.clone());
    }
    return Promise.reject(new Error(`Unexpected request: ${url}`));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function registerRequestBody(fetchMock: ReturnType<typeof mockApi>) {
  const call = fetchMock.mock.calls.find(([input]) =>
    urlOf(input).endsWith("/auth/register/"),
  );
  const body = call?.[1]?.body;
  if (typeof body !== "string") {
    throw new Error("The registration request has no JSON body");
  }
  return JSON.parse(body) as Record<string, unknown>;
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    await screen.findByRole("textbox", { name: "Adresse e-mail (obligatoire)" }),
    "ada@example.com",
  );
  await user.type(
    screen.getByLabelText("Mot de passe (obligatoire)"),
    "Correct-horse-42",
  );
  await user.type(
    screen.getByRole("textbox", { name: "Nom d'utilisateur (obligatoire)" }),
    "ada",
  );
  await screen.findByRole("option", { name: "MPSI" });
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Filière (obligatoire)" }),
    "mpsi",
  );
  await user.click(screen.getByRole("checkbox", { name: /J'accepte/ }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
});

describe("Registration form", () => {
  it("masks the password and leaves the consent unchecked by default", async () => {
    mockApi(json({}, 201));
    renderApp("/inscription");

    expect(
      await screen.findByLabelText("Mot de passe (obligatoire)"),
    ).toHaveAttribute("type", "password");
    expect(
      screen.getByRole("checkbox", { name: /J'accepte/ }),
    ).not.toBeChecked();
  });

  it("validates every field before sending and focuses the first error", async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi(json({}, 201));
    renderApp("/inscription");

    await user.click(
      await screen.findByRole("button", { name: "Créer mon compte" }),
    );

    const email = screen.getByRole("textbox", {
      name: "Adresse e-mail (obligatoire)",
    });
    expect(email).toHaveFocus();
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("checkbox", { name: /J'accepte/ })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      fetchMock.mock.calls.some(([input]) =>
        urlOf(input).endsWith("/auth/register/"),
      ),
    ).toBe(false);
  });

  it("sends the accepted policy version and shows the next step", async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi(
      json({ email: "ada@example.com", username: "ada", track: "mpsi" }, 201),
    );
    renderApp("/inscription");

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Créer mon compte" }));

    expect(
      await screen.findByRole("heading", { name: "Vérifie ta boîte mail" }),
    ).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(registerRequestBody(fetchMock)).toMatchObject({
      email: "ada@example.com",
      username: "ada",
      track: "mpsi",
      privacy_policy_accepted: true,
      privacy_policy_version: "2026-11",
    });
  });

  it("shows API errors under the matching field", async () => {
    const user = userEvent.setup();
    mockApi(
      json(
        {
          error: {
            code: "validation_error",
            message: "Les données envoyées sont invalides.",
            details: { username: ["Ce nom d'utilisateur est déjà pris."] },
          },
        },
        400,
      ),
    );
    renderApp("/inscription");

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Créer mon compte" }));

    const username = await screen.findByRole("textbox", {
      name: "Nom d'utilisateur (obligatoire)",
    });
    expect(username).toHaveAccessibleDescription(/déjà pris/);
    expect(username).toHaveFocus();
  });

  it("asks to accept the new version when the policy changed", async () => {
    const user = userEvent.setup();
    mockApi(
      json(
        {
          error: {
            code: "validation_error",
            message: "Les données envoyées sont invalides.",
            details: {
              privacy_policy_version: [
                "La politique de confidentialité a changé.",
              ],
            },
          },
        },
        400,
      ),
    );
    renderApp("/inscription");

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Créer mon compte" }));

    expect(
      await screen.findByText("La politique de confidentialité a changé."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /J'accepte/ }),
    ).not.toBeChecked();
  });

  it("has no WCAG A/AA violations, even with errors displayed", async () => {
    const user = userEvent.setup();
    mockApi(json({}, 201));
    renderApp("/inscription");

    await user.click(
      await screen.findByRole("button", { name: "Créer mon compte" }),
    );

    await expectNoAxeViolations(document.body);
  });
});

import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearCsrfCookie,
  jsonResponse,
  mockFetch,
  urlOf,
} from "@/test/mockFetch";
import { renderApp } from "@/test/renderApp";
import { ANONYMOUS_SESSION, authenticatedSession } from "@/test/sessions";

const WARNING_AT_MS = (1800 - 120) * 1000; // 28 minutes
const TIMEOUT_MS = 1800 * 1000; // 30 minutes

function mockLoggedInApi() {
  let loggedIn = true;
  return mockFetch({
    "/auth/session/": () =>
      jsonResponse(loggedIn ? authenticatedSession() : ANONYMOUS_SESSION),
    "/auth/logout/": () => {
      loggedIn = false;
      return new Response(null, { status: 204 });
    },
    "/health/": () => jsonResponse({ status: "ok" }),
  });
}

function countCalls(fetchMock: ReturnType<typeof mockFetch>, suffix: string) {
  return fetchMock.mock.calls.filter(([input]) => urlOf(input).endsWith(suffix))
    .length;
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

async function renderDashboard() {
  renderApp("/");
  await screen.findByRole("heading", { level: 1, name: "Tableau de bord" });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
  clearCsrfCookie();
});

describe("Logout after inactivity", () => {
  it("warns 2 minutes before logging out", async () => {
    mockLoggedInApi();
    await renderDashboard();

    advance(WARNING_AT_MS - 1000);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    advance(2000);
    expect(
      screen.getByRole("dialog", { name: "Es-tu toujours là ?" }),
    ).toHaveAccessibleDescription(/déconnecté dans 2 minutes/);
  });

  it("stays connected and extends the server session on request", async () => {
    const fetchMock = mockLoggedInApi();
    await renderDashboard();
    advance(WARNING_AT_MS + 1000);
    const sessionCallsBefore = countCalls(fetchMock, "/auth/session/");

    fireEvent.click(screen.getByRole("button", { name: "Rester connecté" }));
    await vi.waitFor(() => {
      expect(countCalls(fetchMock, "/auth/session/")).toBeGreaterThan(
        sessionCallsBefore,
      );
    });

    advance(WARNING_AT_MS - 1000);
    expect(
      screen.getByRole("heading", { level: 1, name: "Tableau de bord" }),
    ).toBeInTheDocument();
    expect(countCalls(fetchMock, "/auth/logout/")).toBe(0);
  });

  it("logs out after 30 minutes without activity", async () => {
    const fetchMock = mockLoggedInApi();
    await renderDashboard();

    advance(TIMEOUT_MS + 1000);

    expect(
      await screen.findByText(/déconnecté après une période d'inactivité/),
    ).toBeInTheDocument();
    expect(countCalls(fetchMock, "/auth/logout/")).toBe(1);
  });

  it("is postponed by user activity", async () => {
    mockLoggedInApi();
    await renderDashboard();

    advance(20 * 60_000);
    fireEvent.keyDown(window, { key: "Tab" });
    advance(20 * 60_000);

    // 40 minutes in total, but only 20 since the last key press.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { apiRequest } from "./client";
import { ApiError } from "./errors";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function clearCsrfCookie(): void {
  document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  clearCsrfCookie();
});

describe("apiRequest", () => {
  it("returns data validated by the schema", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: "ok" }));

    const data = await apiRequest("/health/", {
      schema: z.object({ status: z.string() }),
    });

    expect(data).toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/health/",
      expect.objectContaining({ method: "GET", credentials: "same-origin" }),
    );
  });

  it("converts the backend error envelope into an ApiError", async () => {
    document.cookie = "csrftoken=token-123; path=/";
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: "validation_error",
            message: "Les données envoyées sont invalides.",
            details: { email: ["Un compte existe déjà avec cet e-mail."] },
          },
        },
        400,
      ),
    );

    const error = await apiRequest("/accounts/", {
      method: "POST",
      body: {},
      schema: z.unknown(),
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: "validation_error",
      details: { email: ["Un compte existe déjà avec cet e-mail."] },
    });
  });

  it("falls back to unknown_error when the body is not the envelope", async () => {
    fetchMock.mockResolvedValue(
      new Response("<h1>Server Error</h1>", { status: 500 }),
    );

    const error = await apiRequest("/health/", { schema: z.unknown() }).catch(
      (e: unknown) => e,
    );

    expect(error).toMatchObject({ status: 500, code: "unknown_error" });
  });

  it("reports network failures as network_error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await apiRequest("/health/", { schema: z.unknown() }).catch(
      (e: unknown) => e,
    );

    expect(error).toMatchObject({ status: 0, code: "network_error" });
  });

  it("rejects responses that do not match the schema", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    fetchMock.mockResolvedValue(jsonResponse({ unexpected: true }));

    const error = await apiRequest("/health/", {
      schema: z.object({ status: z.string() }),
    }).catch((e: unknown) => e);

    expect(error).toMatchObject({ code: "invalid_response" });
  });
});

describe("CSRF handling", () => {
  it("does not send a CSRF token on GET", async () => {
    document.cookie = "csrftoken=token-123; path=/";
    fetchMock.mockResolvedValue(jsonResponse({ status: "ok" }));

    await apiRequest("/health/", { schema: z.unknown() });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).has("X-CSRFToken")).toBe(false);
  });

  it("sends the csrftoken cookie in X-CSRFToken on unsafe methods", async () => {
    document.cookie = "csrftoken=token-123; path=/";
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await apiRequest("/items/1/", { method: "DELETE", schema: z.undefined() });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get("X-CSRFToken")).toBe("token-123");
  });

  it("fetches the CSRF cookie first when it is missing", async () => {
    fetchMock.mockImplementation((input) => {
      if (input === "/api/v1/auth/csrf/") {
        document.cookie = "csrftoken=fresh-token; path=/";
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      return Promise.resolve(jsonResponse({ ok: true }, 201));
    });

    await apiRequest("/items/", {
      method: "POST",
      body: {},
      schema: z.object({ ok: z.boolean() }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/auth/csrf/");
    const init = fetchMock.mock.calls[1]?.[1];
    expect(new Headers(init?.headers).get("X-CSRFToken")).toBe("fresh-token");
  });
});

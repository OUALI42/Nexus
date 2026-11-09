import { vi } from "vitest";

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function urlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  return input instanceof URL ? input.href : input.url;
}

/**
 * Stubs fetch: answers by URL suffix. The CSRF endpoint is always handled.
 * Each route is a factory, so a response body can be read on every call.
 */
export function mockFetch(routes: Record<string, () => Response>) {
  const fetchMock = vi.fn<typeof fetch>((input) => {
    const url = urlOf(input);
    if (url.endsWith("/auth/csrf/")) {
      document.cookie = "csrftoken=test-token; path=/";
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    const route = Object.entries(routes).find(([suffix]) =>
      url.endsWith(suffix),
    );
    return route
      ? Promise.resolve(route[1]())
      : Promise.reject(new Error(`Unexpected request: ${url}`));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export function requestBody(
  fetchMock: ReturnType<typeof mockFetch>,
  urlSuffix: string,
): Record<string, unknown> {
  const call = fetchMock.mock.calls.find(([input]) =>
    urlOf(input).endsWith(urlSuffix),
  );
  const body = call?.[1]?.body;
  if (typeof body !== "string") {
    throw new Error(`No JSON body sent to ${urlSuffix}`);
  }
  return JSON.parse(body) as Record<string, unknown>;
}

export function clearCsrfCookie(): void {
  document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}

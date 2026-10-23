import { env } from "@/config/env";

import { ApiError } from "./errors";

const CSRF_COOKIE_NAME = "csrftoken";

let pendingInit: Promise<void> | null = null;

export function getCookie(name: string): string | undefined {
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : undefined;
}

/** Returns the CSRF token, fetching the cookie from the API if missing. */
export async function ensureCsrfToken(): Promise<string> {
  const existing = getCookie(CSRF_COOKIE_NAME);
  if (existing) {
    return existing;
  }

  pendingInit ??= fetch(`${env.apiBaseUrl}/auth/csrf/`, {
    credentials: "same-origin",
  })
    .then(() => undefined)
    .finally(() => {
      pendingInit = null;
    });
  await pendingInit;

  const token = getCookie(CSRF_COOKIE_NAME);
  if (!token) {
    throw new ApiError(
      0,
      "csrf_unavailable",
      "Session de sécurité indisponible.",
    );
  }
  return token;
}

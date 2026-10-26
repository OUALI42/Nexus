import type { ZodType } from "zod";

import { env } from "@/config/env";

import { ensureCsrfToken } from "./csrf";
import { ApiError, errorEnvelopeSchema } from "./errors";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions<T> = {
  method?: HttpMethod;
  body?: unknown;
  schema: ZodType<T>;
  signal?: AbortSignal;
};

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, schema, signal }: RequestOptions<T>,
): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // the browser sets the multipart boundary itself
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }

  if (method !== "GET") {
    headers.set("X-CSRFToken", await ensureCsrfToken());
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      method,
      headers,
      body: payload,
      credentials: "same-origin",
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error; // cancelled by TanStack Query: not an API error
    }
    throw new ApiError(0, "network_error", "Impossible de joindre le serveur.");
  }

  const data: unknown =
    response.status === 204
      ? undefined
      : await response.json().catch(() => undefined);

  if (!response.ok) {
    throw toApiError(response.status, data);
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    if (import.meta.env.DEV) {
      console.error(`Unexpected response for ${method} ${path}`, parsed.error);
    }
    throw new ApiError(
      response.status,
      "invalid_response",
      "Réponse inattendue du serveur.",
    );
  }
  return parsed.data;
}

function toApiError(status: number, data: unknown): ApiError {
  const parsed = errorEnvelopeSchema.safeParse(data);
  if (parsed.success) {
    const { code, message, details } = parsed.data.error;
    return new ApiError(status, code, message, details);
  }
  return new ApiError(
    status,
    "unknown_error",
    "Une erreur inattendue est survenue.",
  );
}

export const api = {
  get: <T>(path: string, schema: ZodType<T>, signal?: AbortSignal) =>
    apiRequest(path, { schema, signal }),
  post: <T>(path: string, body: unknown, schema: ZodType<T>) =>
    apiRequest(path, { method: "POST", body, schema }),
  patch: <T>(path: string, body: unknown, schema: ZodType<T>) =>
    apiRequest(path, { method: "PATCH", body, schema }),
  put: <T>(path: string, body: unknown, schema: ZodType<T>) =>
    apiRequest(path, { method: "PUT", body, schema }),
  delete: <T>(path: string, schema: ZodType<T>) =>
    apiRequest(path, { method: "DELETE", schema }),
};

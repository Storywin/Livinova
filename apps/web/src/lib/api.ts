import { getAccessToken } from "./auth";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getErrorMessage(body: unknown) {
  if (typeof body !== "object" || body === null) return null;
  if (!("message" in body)) return null;
  const message = (body as { message?: unknown }).message;
  return typeof message === "string" ? message : null;
}

export async function apiFetch<T>(
  path: string,
  init?: Omit<RequestInit, "body"> & { body?: unknown },
): Promise<T> {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (!configured) throw new Error("NEXT_PUBLIC_API_URL belum di-set");

  let baseUrl = configured;
  if (typeof window !== "undefined") {
    try {
      const u = new URL(configured);
      const isLoopback = u.hostname === "localhost" || u.hostname === "127.0.0.1";
      const currentHost = window.location.hostname;
      const isCurrentLoopback = currentHost === "localhost" || currentHost === "127.0.0.1";
      if (isLoopback && !isCurrentLoopback) {
        u.hostname = currentHost;
        baseUrl = u.origin;
      }
    } catch {
      baseUrl = configured;
    }
  }

  const token = getAccessToken();

  let requestBody: BodyInit | undefined;
  if (init?.body !== undefined) {
    if (typeof init.body === "string") {
      requestBody = init.body;
    } else if (init.body instanceof FormData || init.body instanceof Blob) {
      requestBody = init.body;
    } else {
      requestBody = JSON.stringify(init.body);
    }
  }

  const res = await fetch(`${baseUrl}${path}`, {
    cache: init?.cache ?? "no-store",
    ...init,
    body: requestBody,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  const result = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const message = getErrorMessage(result) ?? `Request gagal (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return result as T;
}

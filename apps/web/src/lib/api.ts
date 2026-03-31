import { getAccessToken, getRefreshToken } from "./auth";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

function isRefreshResponse(value: unknown): value is RefreshResponse {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.accessToken === "string" && typeof v.refreshToken === "string";
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

  const doRequest = async (tokenOverride?: string | null) => {
    const token = tokenOverride ?? getAccessToken();
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
    return { res, result };
  };

  const first = await doRequest(null);
  if (first.res.ok) return first.result as T;

  if (first.res.status === 401 && typeof window !== "undefined") {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
          cache: "no-store",
        });

        const refreshText = await refreshRes.text();
        const refreshJson = refreshText ? (JSON.parse(refreshText) as unknown) : null;

        if (refreshRes.ok && isRefreshResponse(refreshJson)) {
          localStorage.setItem("livinova_access_token", refreshJson.accessToken);
          localStorage.setItem("livinova_refresh_token", refreshJson.refreshToken);

          const second = await doRequest(refreshJson.accessToken);
          if (second.res.ok) return second.result as T;

          const message2 = getErrorMessage(second.result) ?? `Request gagal (${second.res.status})`;
          throw new ApiError(message2, second.res.status);
        }
      } catch {
        // fall through to original error
      }
    }
  }

  const message = getErrorMessage(first.result) ?? `Request gagal (${first.res.status})`;
  throw new ApiError(message, first.res.status);
}

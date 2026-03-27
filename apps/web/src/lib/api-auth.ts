import { ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

function getErrorMessage(body: unknown) {
  if (typeof body !== "object" || body === null) return null;
  if (!("message" in body)) return null;
  const message = (body as { message?: unknown }).message;
  return typeof message === "string" ? message : null;
}

export async function apiFetchWithAuth<T>(path: string, init?: RequestInit): Promise<T> {
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
  if (!token) throw new ApiError("Silakan login terlebih dahulu", 401);

  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const message = getErrorMessage(body) ?? `Request gagal (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return body as T;
}

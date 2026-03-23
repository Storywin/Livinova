import { ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

function getErrorMessage(body: unknown) {
  if (typeof body !== "object" || body === null) return null;
  if (!("message" in body)) return null;
  const message = (body as { message?: unknown }).message;
  return typeof message === "string" ? message : null;
}

export async function apiFetchWithAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL belum di-set");

  const token = getAccessToken();
  if (!token) throw new ApiError("Silakan login terlebih dahulu", 401);

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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


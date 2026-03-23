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

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL belum di-set");

  const res = await fetch(`${baseUrl}${path}`, {
    cache: init?.cache ?? "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
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

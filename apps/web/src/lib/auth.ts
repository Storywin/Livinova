export type JwtPayload = {
  sub?: string;
  email?: string;
  roles?: string[];
  exp?: number;
};

function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  return atob(base64 + pad);
}

export function parseJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const json = base64UrlDecode(parts[1]);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("livinova_access_token");
}

export function isAdminToken(token: string) {
  const payload = parseJwt(token);
  const roles = payload?.roles ?? [];
  return roles.includes("admin") || roles.includes("super_admin");
}

export function isDeveloperToken(token: string) {
  const payload = parseJwt(token);
  const roles = payload?.roles ?? [];
  return roles.includes("developer") || roles.includes("admin") || roles.includes("super_admin");
}

export function isVerifierToken(token: string) {
  const payload = parseJwt(token);
  const roles = payload?.roles ?? [];
  return roles.includes("verifier") || roles.includes("admin") || roles.includes("super_admin");
}

export function isBuyerToken(token: string) {
  const payload = parseJwt(token);
  const roles = payload?.roles ?? [];
  return roles.includes("buyer") || roles.includes("admin") || roles.includes("super_admin");
}

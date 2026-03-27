"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { getAccessToken, isAdminToken, parseJwt } from "@/lib/auth";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
    setToken(getAccessToken());
  }, []);

  const payload = token ? parseJwt(token) : null;

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace("/auth/login");
  }, [hydrated, router, token]);

  if (!hydrated) return null;
  if (!token) return null;

  if (!isAdminToken(token)) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
        Akses ditolak. Akun kamu tidak memiliki hak admin.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-500">
        Login sebagai: <span className="font-medium text-slate-900">{payload?.email ?? "—"}</span>
      </div>
      {children}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo } from "react";

import { getAccessToken, isAdminToken, parseJwt } from "@/lib/auth";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const token = useMemo(() => getAccessToken(), []);
  const payload = token ? parseJwt(token) : null;

  useEffect(() => {
    if (!token) router.replace("/auth/login");
  }, [router, token]);

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


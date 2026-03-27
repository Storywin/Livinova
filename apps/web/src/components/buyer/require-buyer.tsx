"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

import { useAuthStore } from "@/store/auth";
import { parseJwt } from "@/lib/auth";

export function RequireBuyer({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { token, hydrated, roles } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace("/auth/login");
  }, [hydrated, router, token]);

  if (!hydrated) return null;
  if (!token) return null;

  const payload = parseJwt(token);

  if (!roles.includes("buyer")) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
        Akses ditolak. Akun kamu tidak memiliki hak buyer.
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

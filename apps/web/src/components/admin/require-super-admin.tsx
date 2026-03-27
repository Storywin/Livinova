"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

import { useAuthStore } from "@/store/auth";

export function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { token, hydrated, roles } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace("/auth/login");
  }, [hydrated, router, token]);

  if (!hydrated) return null;
  if (!token) return null;

  if (!roles.includes("super_admin")) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
        Akses ditolak. Halaman ini hanya untuk super admin.
      </div>
    );
  }

  return children;
}


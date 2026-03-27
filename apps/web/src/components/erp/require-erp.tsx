"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuthStore } from "@/store/auth";

export function RequireErp({ children, allowedRoles }: { children: ReactNode, allowedRoles: string[] }) {
  const router = useRouter();
  const { token, hydrated, roles } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace("/erp/login");
      return;
    }
    
    const hasAccess = allowedRoles.some(role => roles.includes(role));
    if (!hasAccess) {
      router.replace("/");
    }
  }, [hydrated, router, token, roles, allowedRoles]);

  if (!hydrated || !token) return null;
  
  const hasAccess = allowedRoles.some(role => roles.includes(role));
  if (!hasAccess) return null;

  return <>{children}</>;
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { getAccessToken, parseJwt } from "@/lib/auth";

export default function DashboardRouterPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      const isErp = window.location.search.includes("from=erp") || document.referrer.includes("/erp");
      router.replace(isErp ? "/erp/login" : "/auth/login");
      return;
    }

    const roles = parseJwt(token)?.roles ?? [];
    const fromErp = window.location.search.includes("from=erp") || document.referrer.includes("/erp");

    if (roles.includes("super_admin") || roles.includes("admin")) {
      router.replace(fromErp ? "/erp/admin" : "/admin");
      return;
    }

    if (roles.includes("verifier")) {
      router.replace("/verifier");
      return;
    }

    if (roles.includes("developer")) {
      router.replace("/developer/dashboard");
      return;
    }

    if (roles.includes("buyer")) {
      router.replace("/buyer/dashboard");
      return;
    }

    if (roles.includes("partner")) {
      router.replace("/erp/partner");
      return;
    }

    if (roles.includes("tenant_admin") || roles.includes("erp_user")) {
      router.replace("/erp/dashboard");
      return;
    }

    router.replace("/");
  }, [router]);

  return null;
}

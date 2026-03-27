"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { ReactNode } from "react";

export function SiteLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isErp = pathname?.startsWith("/erp");

  if (isErp) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}

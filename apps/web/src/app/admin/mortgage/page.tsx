"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { RequireAdmin } from "@/components/admin/require-admin";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin/mortgage/banks", label: "Bank" },
  { href: "/admin/mortgage/products", label: "Produk" },
];

export default function AdminMortgageIndexPage() {
  const pathname = usePathname();

  return (
    <AdminShell title="Pengaturan KPR">
      <RequireAdmin>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const isActive = pathname === t.href || pathname.startsWith(`${t.href}/`);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  isActive ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Pilih tab untuk mengelola bank atau produk KPR.
        </div>
      </RequireAdmin>
    </AdminShell>
  );
}


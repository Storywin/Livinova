"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Container } from "../site/container";

const items = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/review/listings", label: "Verifikasi Listing" },
  { href: "/admin/review/developers", label: "Verifikasi Developer" },
  { href: "/admin/mortgage", label: "Pengaturan KPR" },
  { href: "/admin/site-settings", label: "Pengaturan Situs" },
];

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="py-10">
      <Container>
        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="px-2 pb-3 text-sm font-semibold text-slate-900">Admin</div>
            <nav className="flex flex-col gap-1">
              {items.map((i) => {
                const isActive = pathname === i.href || pathname.startsWith(`${i.href}/`);
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                      isActive && "bg-slate-50 text-slate-900",
                    )}
                  >
                    {i.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <section className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
            </div>
            {children}
          </section>
        </div>
      </Container>
    </main>
  );
}

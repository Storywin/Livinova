"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useMemo } from "react";
import {
  BookOpen,
  FileText,
  Gauge,
  Globe,
  Home,
  Landmark,
  LayoutGrid,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

import { Container } from "../site/container";

type NavItem = { href: string; label: string; icon: ReactNode; superAdminOnly?: boolean };
type NavGroup = { label: string; items: NavItem[] };

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, hydrated, roles } = useAuthStore();
  const setToken = useAuthStore((s) => s.setToken);

  const isSuperAdmin = roles.includes("super_admin");
  const isVerifierView = pathname.startsWith("/verifier");

  const groups: NavGroup[] = useMemo(() => {
    if (isVerifierView) {
      return [
        {
          label: "Verifikasi",
          items: [
            { href: "/verifier", label: "Ringkasan", icon: <Gauge className="h-4 w-4" /> },
            { href: "/verifier/review/listings", label: "Listing", icon: <Home className="h-4 w-4" /> },
            { href: "/verifier/review/projects", label: "Project", icon: <LayoutGrid className="h-4 w-4" /> },
            { href: "/verifier/review/developers", label: "Developer", icon: <Users className="h-4 w-4" /> },
          ],
        },
      ];
    }

    return [
      {
        label: "Backoffice",
        items: [
          { href: "/admin", label: "Dashboard", icon: <Gauge className="h-4 w-4" /> },
          { href: "/admin/review/listings", label: "Verifikasi Listing", icon: <Home className="h-4 w-4" /> },
          { href: "/admin/review/developers", label: "Verifikasi Developer", icon: <Users className="h-4 w-4" /> },
          { href: "/admin/review/projects", label: "Verifikasi Project", icon: <LayoutGrid className="h-4 w-4" /> },
        ],
      },
      {
        label: "CMS",
        items: [
          { href: "/admin/cms/articles", label: "Artikel", icon: <BookOpen className="h-4 w-4" />, superAdminOnly: true },
          { href: "/admin/cms/pages", label: "Halaman", icon: <FileText className="h-4 w-4" />, superAdminOnly: true },
        ],
      },
      {
        label: "Marketing",
        items: [{ href: "/admin/seo", label: "SEO", icon: <Search className="h-4 w-4" />, superAdminOnly: true }],
      },
      {
        label: "Operasional",
        items: [
          { href: "/admin/mortgage", label: "Pengaturan KPR", icon: <Landmark className="h-4 w-4" /> },
          { href: "/admin/site-settings", label: "Pengaturan Situs", icon: <Globe className="h-4 w-4" /> },
        ],
      },
    ];
  }, [isVerifierView]);

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <Container>
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-2 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-slate-900" />
                {isVerifierView ? "Verifier" : "Backoffice"}
              </div>
              {!hydrated ? null : isSuperAdmin ? (
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">Super Admin</span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">Admin</span>
              )}
            </div>

            <nav className="flex flex-col gap-4">
              {groups.map((g) => {
                const visibleItems = g.items.filter((i) => !i.superAdminOnly || isSuperAdmin);
                if (!visibleItems.length) return null;
                return (
                  <div key={g.label} className="space-y-1">
                    <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{g.label}</div>
                    {visibleItems.map((i) => {
                      const isActive = pathname === i.href || pathname.startsWith(`${i.href}/`);
                      return (
                        <Link
                          key={i.href}
                          href={i.href}
                          className={cn(
                            "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                            isActive && "bg-slate-900 text-white hover:bg-slate-900 hover:text-white",
                          )}
                        >
                          <span className={cn("text-slate-500", isActive && "text-white/90")}>{i.icon}</span>
                          <span className="min-w-0 truncate">{i.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </nav>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => {
                  localStorage.removeItem("livinova_access_token");
                  localStorage.removeItem("livinova_refresh_token");
                  setToken(null);
                  router.replace("/auth/login");
                }}
              >
                Keluar
              </Button>
            </div>
          </aside>

          <section className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Home className="h-4 w-4" />
                    {isVerifierView ? "Portal Verifikasi" : "Panel Admin"}
                  </div>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href="/">Beranda</Link>
                  </Button>
                  <Button asChild className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                    <Link href={isVerifierView ? "/verifier" : "/admin"}>Ringkasan</Link>
                  </Button>
                </div>
              </div>
            </div>
            {children}
          </section>
        </div>
      </Container>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileText, LayoutGrid, Search, ShieldCheck } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { RequireAdmin } from "@/components/admin/require-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetchWithAuth } from "@/lib/api-auth";
import { getAccessToken, parseJwt } from "@/lib/auth";

export default function AdminHomePage() {
  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
    setToken(getAccessToken());
  }, []);

  const isSuperAdmin = useMemo(() => {
    if (!token) return false;
    const roles = parseJwt(token)?.roles ?? [];
    return roles.includes("super_admin");
  }, [token]);

  const listingsQuery = useQuery({
    queryKey: ["admin-home-pending-listings"],
    queryFn: () => apiFetchWithAuth<{ totalItems: number }>("/admin/review/listings?status=pending&verificationStatus=pending&page=1&pageSize=1"),
  });
  const devsQuery = useQuery({
    queryKey: ["admin-home-pending-developers"],
    queryFn: () => apiFetchWithAuth<{ totalItems: number }>("/admin/review/developers?status=pending&page=1&pageSize=1"),
  });
  const projectsQuery = useQuery({
    queryKey: ["admin-home-pending-projects"],
    queryFn: () => apiFetchWithAuth<{ totalItems: number }>("/admin/review/projects?verificationStatus=pending&page=1&pageSize=1"),
  });
  const articlesQuery = useQuery({
    queryKey: ["admin-home-articles-draft"],
    queryFn: () => apiFetchWithAuth<{ totalItems: number }>("/admin/cms/articles?status=draft&page=1&pageSize=1"),
    enabled: hydrated && isSuperAdmin,
  });
  const pagesQuery = useQuery({
    queryKey: ["admin-home-pages-draft"],
    queryFn: () => apiFetchWithAuth<{ totalItems: number }>("/admin/cms/pages?status=draft&page=1&pageSize=1"),
    enabled: hydrated && isSuperAdmin,
  });

  return (
    <AdminShell title="Ringkasan">
      <RequireAdmin>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Queue Verifikasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <LayoutGrid className="h-4 w-4" />
                    Project pending
                  </div>
                  <div className="font-semibold text-slate-900">{projectsQuery.data?.totalItems ?? "—"}</div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <ShieldCheck className="h-4 w-4" />
                    Listing pending
                  </div>
                  <div className="font-semibold text-slate-900">{listingsQuery.data?.totalItems ?? "—"}</div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <ShieldCheck className="h-4 w-4" />
                    Developer pending
                  </div>
                  <div className="font-semibold text-slate-900">{devsQuery.data?.totalItems ?? "—"}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/admin/review/projects">Review Project</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/admin/review/listings">Review Listing</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/admin/review/developers">Review Developer</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Operasional</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Kelola bank, produk, suku bunga, margin syariah, biaya admin, provisi, notaris, dan asumsi lainnya.
              <div className="mt-4">
                <Button asChild className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                  <Link href="/admin/mortgage">Pengaturan KPR</Link>
                </Button>
              </div>
              <div className="mt-3">
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/admin/site-settings">Pengaturan Situs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Super Admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                CMS & SEO hanya muncul untuk role super admin.
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <BookOpen className="h-4 w-4" />
                    Draft artikel
                  </div>
                  <div className="font-semibold text-slate-900">{hydrated && isSuperAdmin ? (articlesQuery.data?.totalItems ?? "—") : "—"}</div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <FileText className="h-4 w-4" />
                    Draft halaman
                  </div>
                  <div className="font-semibold text-slate-900">{hydrated && isSuperAdmin ? (pagesQuery.data?.totalItems ?? "—") : "—"}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/admin/cms/articles">CMS Artikel</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/admin/cms/pages">CMS Halaman</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/admin/seo">
                    <span className="inline-flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      SEO
                    </span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </RequireAdmin>
    </AdminShell>
  );
}

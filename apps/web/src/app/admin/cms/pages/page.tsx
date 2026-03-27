"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { RequireSuperAdmin } from "@/components/admin/require-super-admin";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetchWithAuth } from "@/lib/api-auth";

type Page = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
  updatedAt: string;
};

type Paginated<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

export default function AdminCmsPagesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", "1");
    p.set("pageSize", "50");
    if (q.trim()) p.set("q", q.trim());
    if (status) p.set("status", status);
    return p.toString();
  }, [q, status]);

  const pagesQuery = useQuery({
    queryKey: ["admin-cms-pages", queryString],
    queryFn: () => apiFetchWithAuth<Paginated<Page>>(`/admin/cms/pages?${queryString}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiFetchWithAuth(`/admin/cms/pages/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["admin-cms-pages"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal menghapus halaman"),
  });

  return (
    <AdminShell title="CMS • Halaman">
      <RequireSuperAdmin>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input className="h-10 w-64 rounded-xl" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul/slug..." />
            <select className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <Button asChild className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">
            <Link href="/admin/cms/pages/new">Buat Halaman</Link>
          </Button>
        </div>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

        <DataTable<Page>
          columns={[
            {
              header: "Halaman",
              cell: (p) => (
                <div className="min-w-0">
                  <Link className="font-semibold text-slate-900 hover:underline" href={`/admin/cms/pages/${p.id}`}>
                    {p.title}
                  </Link>
                  <div className="mt-1 text-xs text-slate-500">/halaman/{p.slug}</div>
                </div>
              ),
            },
            { header: "Status", cell: (p) => <div className="font-semibold text-slate-900">{p.status}</div>, className: "w-[140px]" },
            {
              header: "Aksi",
              className: "w-[220px]",
              cell: (p) => (
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="h-9 rounded-xl">
                    <Link href={`/halaman/${p.slug}`} target="_blank">
                      Lihat
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 rounded-xl"
                    onClick={() => {
                      if (!confirm("Hapus halaman ini?")) return;
                      deleteMutation.mutate(p.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    Hapus
                  </Button>
                </div>
              ),
            },
          ]}
          rows={pagesQuery.data?.items ?? []}
          rowKey={(p) => p.id}
        />
      </RequireSuperAdmin>
    </AdminShell>
  );
}


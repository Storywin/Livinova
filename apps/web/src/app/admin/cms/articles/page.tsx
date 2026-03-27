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

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  authorName: string | null;
  tags: string[];
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  updatedAt: string;
};

type Paginated<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

export default function AdminCmsArticlesPage() {
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

  const articlesQuery = useQuery({
    queryKey: ["admin-cms-articles", queryString],
    queryFn: () => apiFetchWithAuth<Paginated<Article>>(`/admin/cms/articles?${queryString}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiFetchWithAuth(`/admin/cms/articles/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["admin-cms-articles"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal menghapus artikel"),
  });

  return (
    <AdminShell title="CMS • Artikel">
      <RequireSuperAdmin>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input className="h-10 w-64 rounded-xl" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul/slug/tag..." />
            <select className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <Button asChild className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">
            <Link href="/admin/cms/articles/new">Buat Artikel</Link>
          </Button>
        </div>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

        <DataTable<Article>
          columns={[
            {
              header: "Artikel",
              cell: (a) => (
                <div className="min-w-0">
                  <Link className="font-semibold text-slate-900 hover:underline" href={`/admin/cms/articles/${a.id}`}>
                    {a.title}
                  </Link>
                  <div className="mt-1 text-xs text-slate-500">/{a.slug}</div>
                </div>
              ),
            },
            {
              header: "Status",
              cell: (a) => (
                <div className="text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">{a.status}</div>
                  {a.publishedAt ? <div className="text-xs text-slate-500">{new Date(a.publishedAt).toLocaleDateString("id-ID")}</div> : null}
                </div>
              ),
              className: "w-[140px]",
            },
            {
              header: "Tag",
              cell: (a) => (
                <div className="flex flex-wrap gap-1">
                  {a.tags?.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-full bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                      #{t}
                    </span>
                  ))}
                </div>
              ),
            },
            {
              header: "Aksi",
              className: "w-[160px]",
              cell: (a) => (
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="h-9 rounded-xl">
                    <Link href={`/artikel/${a.slug}`} target="_blank">
                      Lihat
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 rounded-xl"
                    onClick={() => {
                      if (!confirm("Hapus artikel ini?")) return;
                      deleteMutation.mutate(a.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    Hapus
                  </Button>
                </div>
              ),
            },
          ]}
          rows={articlesQuery.data?.items ?? []}
          rowKey={(a) => a.id}
        />
      </RequireSuperAdmin>
    </AdminShell>
  );
}


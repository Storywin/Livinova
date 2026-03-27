"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { RequireSuperAdmin } from "@/components/admin/require-super-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetchWithAuth } from "@/lib/api-auth";

type Page = {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  status: "draft" | "published" | "archived";
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  updatedAt: string;
};

export default function AdminEditPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const pageQuery = useQuery({
    queryKey: ["admin-cms-page", id],
    queryFn: () => apiFetchWithAuth<Page>(`/admin/cms/pages/${id}`),
  });

  const [form, setForm] = useState({
    title: "",
    slug: "",
    status: "draft" as Page["status"],
    content: "",
    metaTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    ogImageUrl: "",
  });

  useEffect(() => {
    const p = pageQuery.data;
    if (!p) return;
    setForm({
      title: p.title ?? "",
      slug: p.slug ?? "",
      status: p.status ?? "draft",
      content: p.content ?? "",
      metaTitle: p.metaTitle ?? "",
      metaDescription: p.metaDescription ?? "",
      canonicalUrl: p.canonicalUrl ?? "",
      ogImageUrl: p.ogImageUrl ?? "",
    });
  }, [pageQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        slug: form.slug,
        status: form.status,
        content: form.content.trim() ? form.content : null,
        metaTitle: form.metaTitle.trim() ? form.metaTitle : null,
        metaDescription: form.metaDescription.trim() ? form.metaDescription : null,
        canonicalUrl: form.canonicalUrl.trim() ? form.canonicalUrl : null,
        ogImageUrl: form.ogImageUrl.trim() ? form.ogImageUrl : null,
      };
      return apiFetchWithAuth<Page>(`/admin/cms/pages/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      setError(null);
      setSuccess("Halaman tersimpan");
      pageQuery.refetch();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal menyimpan halaman"),
  });

  return (
    <AdminShell title="CMS • Edit Halaman">
      <RequireSuperAdmin>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/admin/cms/pages">Kembali</Link>
            </Button>
            {pageQuery.data?.slug ? (
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={`/halaman/${pageQuery.data.slug}`} target="_blank">
                  Lihat Publik
                </Link>
              </Button>
            ) : null}
          </div>
          <Button
            className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => {
              setError(null);
              setSuccess(null);
              saveMutation.mutate();
            }}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Konten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
            {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Judul</Label>
                <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Page["status"] }))}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Content</Label>
                <Textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} className="min-h-[320px]" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input value={form.metaTitle} onChange={(e) => setForm((p) => ({ ...p, metaTitle: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea value={form.metaDescription} onChange={(e) => setForm((p) => ({ ...p, metaDescription: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Canonical URL</Label>
                <Input value={form.canonicalUrl} onChange={(e) => setForm((p) => ({ ...p, canonicalUrl: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>OG Image URL</Label>
                <Input value={form.ogImageUrl} onChange={(e) => setForm((p) => ({ ...p, ogImageUrl: e.target.value }))} />
              </div>
            </div>
          </CardContent>
        </Card>
      </RequireSuperAdmin>
    </AdminShell>
  );
}


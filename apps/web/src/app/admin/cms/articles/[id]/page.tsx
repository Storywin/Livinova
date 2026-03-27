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

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  authorName: string | null;
  tags: string[];
  content: string;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
};

export default function AdminEditArticlePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const articleQuery = useQuery({
    queryKey: ["admin-cms-article", id],
    queryFn: () => apiFetchWithAuth<Article>(`/admin/cms/articles/${id}`),
  });

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    authorName: "",
    tags: "",
    coverImageUrl: "",
    status: "draft" as Article["status"],
    metaTitle: "",
    metaDescription: "",
    content: "",
  });

  useEffect(() => {
    const a = articleQuery.data;
    if (!a) return;
    setForm({
      title: a.title ?? "",
      slug: a.slug ?? "",
      excerpt: a.excerpt ?? "",
      authorName: a.authorName ?? "",
      tags: (a.tags ?? []).join(", "),
      coverImageUrl: a.coverImageUrl ?? "",
      status: a.status ?? "draft",
      metaTitle: a.metaTitle ?? "",
      metaDescription: a.metaDescription ?? "",
      content: a.content ?? "",
    });
  }, [articleQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt.trim() ? form.excerpt : null,
        authorName: form.authorName.trim() ? form.authorName : null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        coverImageUrl: form.coverImageUrl.trim() ? form.coverImageUrl : null,
        status: form.status,
        metaTitle: form.metaTitle.trim() ? form.metaTitle : null,
        metaDescription: form.metaDescription.trim() ? form.metaDescription : null,
        content: form.content,
      };
      return apiFetchWithAuth<Article>(`/admin/cms/articles/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      setError(null);
      setSuccess("Artikel tersimpan");
      articleQuery.refetch();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal menyimpan artikel"),
  });

  return (
    <AdminShell title="CMS • Edit Artikel">
      <RequireSuperAdmin>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/admin/cms/articles">Kembali</Link>
            </Button>
            {articleQuery.data?.slug ? (
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={`/artikel/${articleQuery.data.slug}`} target="_blank">
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
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Article["status"] }))}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input value={form.authorName} onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Tags (pisahkan koma)</Label>
                <Input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Cover Image URL</Label>
                <Input value={form.coverImageUrl} onChange={(e) => setForm((p) => ({ ...p, coverImageUrl: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Excerpt</Label>
                <Textarea value={form.excerpt} onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Content</Label>
                <Textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} className="min-h-[360px]" />
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
            </div>
          </CardContent>
        </Card>
      </RequireSuperAdmin>
    </AdminShell>
  );
}


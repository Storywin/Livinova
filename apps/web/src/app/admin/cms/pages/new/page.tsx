"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { RequireSuperAdmin } from "@/components/admin/require-super-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetchWithAuth } from "@/lib/api-auth";

type Page = { id: string };

export default function AdminNewPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    status: "draft",
    content: "",
    metaTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    ogImageUrl: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        slug: form.slug.trim() ? form.slug : undefined,
        status: form.status,
        content: form.content.trim() ? form.content : undefined,
        metaTitle: form.metaTitle.trim() ? form.metaTitle : undefined,
        metaDescription: form.metaDescription.trim() ? form.metaDescription : undefined,
        canonicalUrl: form.canonicalUrl.trim() ? form.canonicalUrl : undefined,
        ogImageUrl: form.ogImageUrl.trim() ? form.ogImageUrl : undefined,
      };
      return apiFetchWithAuth<Page>("/admin/cms/pages", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: (created) => router.replace(`/admin/cms/pages/${created.id}`),
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal membuat halaman"),
  });

  return (
    <AdminShell title="CMS • Buat Halaman">
      <RequireSuperAdmin>
        <div className="flex items-center justify-between">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin/cms/pages">Kembali</Link>
          </Button>
          <Button
            className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => {
              setError(null);
              createMutation.mutate();
            }}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Konten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Judul</Label>
                <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Slug (opsional)</Label>
                <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="contoh: tentang-kami" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Content</Label>
                <Textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} className="min-h-[260px]" />
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
                <Input value={form.canonicalUrl} onChange={(e) => setForm((p) => ({ ...p, canonicalUrl: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>OG Image URL</Label>
                <Input value={form.ogImageUrl} onChange={(e) => setForm((p) => ({ ...p, ogImageUrl: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
          </CardContent>
        </Card>
      </RequireSuperAdmin>
    </AdminShell>
  );
}


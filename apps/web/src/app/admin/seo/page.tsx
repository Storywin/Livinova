"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { RequireSuperAdmin } from "@/components/admin/require-super-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetchWithAuth } from "@/lib/api-auth";

type SeoSettings = {
  id: string;
  siteName: string;
  titleTemplate: string;
  defaultMetaDescription: string | null;
  robotsTxt: string | null;
  sitemapEnabled: boolean;
  googleSiteVerification: string | null;
  updatedAt: string;
};

export default function AdminSeoPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: ["admin-seo-settings"],
    queryFn: () => apiFetchWithAuth<SeoSettings>("/admin/seo"),
  });

  const [form, setForm] = useState({
    siteName: "",
    titleTemplate: "",
    defaultMetaDescription: "",
    robotsTxt: "",
    sitemapEnabled: true,
    googleSiteVerification: "",
  });

  useEffect(() => {
    const s = settingsQuery.data;
    if (!s) return;
    setForm({
      siteName: s.siteName ?? "",
      titleTemplate: s.titleTemplate ?? "",
      defaultMetaDescription: s.defaultMetaDescription ?? "",
      robotsTxt: s.robotsTxt ?? "",
      sitemapEnabled: Boolean(s.sitemapEnabled),
      googleSiteVerification: s.googleSiteVerification ?? "",
    });
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        siteName: form.siteName,
        titleTemplate: form.titleTemplate,
        defaultMetaDescription: form.defaultMetaDescription.trim() ? form.defaultMetaDescription : null,
        robotsTxt: form.robotsTxt.trim() ? form.robotsTxt : null,
        sitemapEnabled: form.sitemapEnabled,
        googleSiteVerification: form.googleSiteVerification.trim() ? form.googleSiteVerification : null,
      };
      return apiFetchWithAuth<SeoSettings>("/admin/seo", { method: "PUT", body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      setError(null);
      setSuccess("Pengaturan SEO tersimpan");
      settingsQuery.refetch();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal menyimpan SEO"),
  });

  return (
    <AdminShell title="SEO & Metadata">
      <RequireSuperAdmin>
        <div className="grid gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Default SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
              {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama Situs</Label>
                  <Input value={form.siteName} onChange={(e) => setForm((p) => ({ ...p, siteName: e.target.value }))} placeholder="Livinova" />
                </div>
                <div className="space-y-2">
                  <Label>Template Judul</Label>
                  <Input value={form.titleTemplate} onChange={(e) => setForm((p) => ({ ...p, titleTemplate: e.target.value }))} placeholder="%s | Livinova" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Default Meta Description</Label>
                  <Textarea value={form.defaultMetaDescription} onChange={(e) => setForm((p) => ({ ...p, defaultMetaDescription: e.target.value }))} placeholder="Deskripsi default untuk halaman tanpa deskripsi khusus." />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Robots.txt (opsional)</Label>
                <Textarea value={form.robotsTxt} onChange={(e) => setForm((p) => ({ ...p, robotsTxt: e.target.value }))} placeholder="User-agent: *\nAllow: /" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Google Site Verification</Label>
                  <Input value={form.googleSiteVerification} onChange={(e) => setForm((p) => ({ ...p, googleSiteVerification: e.target.value }))} placeholder="kode-verifikasi" />
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <input
                    id="sitemapEnabled"
                    type="checkbox"
                    checked={form.sitemapEnabled}
                    onChange={(e) => setForm((p) => ({ ...p, sitemapEnabled: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <Label htmlFor="sitemapEnabled">Aktifkan sitemap</Label>
                </div>
              </div>

              <div className="flex justify-end">
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
            </CardContent>
          </Card>
        </div>
      </RequireSuperAdmin>
    </AdminShell>
  );
}


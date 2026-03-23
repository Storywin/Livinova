"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { RequireAdmin } from "@/components/admin/require-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetchWithAuth } from "@/lib/api-auth";
import { getAccessToken, parseJwt } from "@/lib/auth";

type SocialLink = { platform: string; url: string; label?: string };
type SettingsResponse = { socialLinks: SocialLink[] };

const platformOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "x", label: "X (Twitter)" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "custom", label: "Custom" },
] as const;

function normalizeLinks(input: SocialLink[]) {
  const out: SocialLink[] = [];
  for (const s of input) {
    const platform = (s.platform || "").trim();
    const url = (s.url || "").trim();
    const label = (s.label || "").trim();
    if (!platform) continue;
    out.push({ platform, url, ...(label ? { label } : {}) });
  }
  return out;
}

export default function AdminSiteSettingsPage() {
  const token = useMemo(() => getAccessToken(), []);
  const payload = useMemo(() => (token ? parseJwt(token) : null), [token]);
  const isSuperAdmin = (payload?.roles ?? []).includes("super_admin");

  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<SocialLink[]>([]);

  const settingsQuery = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: () => apiFetchWithAuth<SettingsResponse>("/admin/site-settings"),
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    setLinks(normalizeLinks(settingsQuery.data.socialLinks ?? []));
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payloadToSend = { socialLinks: normalizeLinks(links) };
      return apiFetchWithAuth<SettingsResponse>("/admin/site-settings", {
        method: "PUT",
        body: JSON.stringify(payloadToSend),
      });
    },
    onSuccess: (data) => {
      setError(null);
      setLinks(normalizeLinks(data.socialLinks ?? []));
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal menyimpan pengaturan"),
  });

  return (
    <AdminShell title="Pengaturan Situs">
      <RequireAdmin>
        <div className="grid gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Media Sosial Footer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isSuperAdmin ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Hanya role <span className="font-semibold">super admin</span> yang bisa mengubah pengaturan ini.
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              ) : null}

              <div className="grid gap-3">
                {links.map((l, idx) => {
                  const platform = l.platform || "custom";
                  const isCustom = platform.toLowerCase() === "custom";
                  return (
                    <div key={`${platform}-${idx}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[200px_1fr_1fr_110px] md:items-end">
                      <div className="space-y-2">
                        <Label>Platform</Label>
                        <select
                          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={platform}
                          onChange={(e) => {
                            const next = e.target.value;
                            setLinks((cur) =>
                              cur.map((c, i) =>
                                i === idx ? { ...c, platform: next, ...(next !== "custom" ? { label: "" } : {}) } : c,
                              ),
                            );
                          }}
                          disabled={!isSuperAdmin}
                        >
                          {platformOptions.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                          value={l.url}
                          onChange={(e) => setLinks((cur) => cur.map((c, i) => (i === idx ? { ...c, url: e.target.value } : c)))}
                          placeholder="https://..."
                          disabled={!isSuperAdmin}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Label (opsional)</Label>
                        <Input
                          value={l.label ?? ""}
                          onChange={(e) => setLinks((cur) => cur.map((c, i) => (i === idx ? { ...c, label: e.target.value } : c)))}
                          placeholder={isCustom ? "Contoh: Threads" : "Otomatis (boleh kosong)"}
                          disabled={!isSuperAdmin || !isCustom}
                        />
                      </div>

                      <div className="flex md:justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setLinks((cur) => cur.filter((_, i) => i !== idx))}
                          disabled={!isSuperAdmin}
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setLinks((cur) => [...cur, { platform: "instagram", url: "" }])}
                  disabled={!isSuperAdmin}
                >
                  Tambah Media Sosial
                </Button>

                <Button
                  className="bg-slate-900 text-white hover:bg-slate-800"
                  onClick={() => {
                    setError(null);
                    saveMutation.mutate();
                  }}
                  disabled={!isSuperAdmin || saveMutation.isPending}
                >
                  {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>

              <div className="text-xs text-slate-500">
                URL wajib diawali <span className="font-medium text-slate-900">https://</span> atau{" "}
                <span className="font-medium text-slate-900">http://</span>.
              </div>
            </CardContent>
          </Card>
        </div>
      </RequireAdmin>
    </AdminShell>
  );
}

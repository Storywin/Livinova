"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Container } from "@/components/site/container";
import { RequireDeveloper } from "@/components/developer/require-developer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { apiFetchWithAuth } from "@/lib/api-auth";

type MyDeveloper = {
  id: string;
  name: string;
  slug: string;
  profileTemplate: string;
  verificationStatus: string;
};

type MeResponse = { developers: MyDeveloper[] };
type UpdateTemplateResponse = { id: string; slug: string; name: string; profileTemplate: string; updatedAt: string };

const templates = [
  { value: "classic", title: "Classic", description: "Tampilan bersih dan profesional untuk company profile." },
  { value: "skyline", title: "Skyline", description: "Gaya modern putih dengan fokus pada portofolio proyek." },
  { value: "aurora", title: "Aurora", description: "Tampilan premium gelap-glass dengan nuansa Smart Living." },
] as const;

export default function DeveloperDashboardPage() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("classic");

  const meQuery = useQuery({
    queryKey: ["developer-me"],
    queryFn: () => apiFetchWithAuth<MeResponse>("/developer/me"),
  });

  const developers = useMemo(() => meQuery.data?.developers ?? [], [meQuery.data?.developers]);

  useEffect(() => {
    if (!developers.length) return;
    if (!selectedDeveloperId) {
      const current = developers[0];
      setSelectedDeveloperId(current.id);
      setSelectedTemplate(current.profileTemplate || "classic");
      return;
    }
    const current = developers.find((d) => d.id === selectedDeveloperId) ?? null;
    if (current) setSelectedTemplate(current.profileTemplate || "classic");
  }, [developers, selectedDeveloperId]);

  const activeDeveloper = useMemo(
    () => developers.find((d) => d.id === selectedDeveloperId) ?? null,
    [developers, selectedDeveloperId],
  );
  const canOpenPublicProfile = activeDeveloper?.verificationStatus === "approved";

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDeveloperId) throw new Error("Developer tidak ditemukan");
      const result = await apiFetchWithAuth<UpdateTemplateResponse | null>("/developer/profile-template", {
        method: "PUT",
        body: JSON.stringify({ developerId: selectedDeveloperId, profileTemplate: selectedTemplate }),
      });
      if (!result) throw new Error("Gagal menyimpan template");
      return result;
    },
    onSuccess: (updated) => {
      setError(null);
      setSuccess("Template berhasil disimpan");
      qc.setQueryData<MeResponse>(["developer-me"], (prev) => {
        if (!prev) return prev;
        return {
          developers: prev.developers.map((d) =>
            d.id === updated.id ? { ...d, profileTemplate: updated.profileTemplate } : d,
          ),
        };
      });
      setSelectedTemplate(updated.profileTemplate);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal menyimpan template"),
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <Container className="py-10">
        <RequireDeveloper>
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard Developer</h1>
                <div className="mt-1 text-sm text-slate-600">Kelola profil, project, dan listing.</div>
              </div>
              {activeDeveloper ? (
                <div className="flex flex-col items-end gap-1">
                  {canOpenPublicProfile ? (
                    <Button asChild variant="outline" className="rounded-xl">
                      <Link href={`/developer/${activeDeveloper.slug}`} target="_blank">
                        Lihat Profil Publik
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" className="rounded-xl" disabled>
                      Lihat Profil Publik
                    </Button>
                  )}
                  {!canOpenPublicProfile ? (
                    <div className="text-xs text-slate-500">Profil publik tampil setelah status developer approved.</div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Project</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600">
                  Buat dan kelola proyek. Project dipakai sebagai wadah untuk listing.
                  <div className="mt-4">
                    <Button asChild variant="outline" className="rounded-xl">
                      <Link href="/developer/projects">Kelola Project</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Listing</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600">
                  Buat draft, upload foto, lalu submit listing untuk verifikasi.
                  <div className="mt-4">
                    <Button asChild className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                      <Link href="/developer/listings">Kelola Listing</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Template Profil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
                ) : null}
                {success ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>
                ) : null}

                <div className="space-y-2">
                  <Label>Developer</Label>
                  <select
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={selectedDeveloperId ?? ""}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedDeveloperId(id);
                      const dev = developers.find((d) => d.id === id);
                      if (dev?.profileTemplate) setSelectedTemplate(dev.profileTemplate);
                    }}
                    disabled={meQuery.isLoading}
                  >
                    {developers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.verificationStatus})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {templates.map((t) => {
                    const active = selectedTemplate === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setSelectedTemplate(t.value)}
                        className={`rounded-2xl border p-4 text-left shadow-sm transition ${
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-sm font-semibold">{t.title}</div>
                        <div className={`mt-1 text-xs ${active ? "text-white/80" : "text-slate-600"}`}>{t.description}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                    onClick={() => {
                      setError(null);
                      setSuccess(null);
                      saveMutation.mutate();
                    }}
                    disabled={!selectedDeveloperId || saveMutation.isPending}
                  >
                    {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </RequireDeveloper>
      </Container>
    </main>
  );
}

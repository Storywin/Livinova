"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { RequireDeveloper } from "@/components/developer/require-developer";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetchWithAuth } from "@/lib/api-auth";
import { formatRupiah } from "@/lib/format";

type MyDeveloper = { id: string; name: string; slug: string; verificationStatus: string };
type MeResponse = { developers: MyDeveloper[] };

type Project = {
  id: string;
  developerId: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  smartReadiness: string;
  verificationStatus: string;
  startingPrice: string | null;
  location: { address: string | null; city: string | null; area: string | null; province: string | null } | null;
  counts: { listings: number; units: number };
  createdAt: string;
  updatedAt: string;
};

type ListProjectsResponse = { items: Project[] };

export default function DeveloperProjectsPage() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: ["developer-me"],
    queryFn: () => apiFetchWithAuth<MeResponse>("/developer/me"),
  });

  const developers = useMemo(() => meQuery.data?.developers ?? [], [meQuery.data?.developers]);
  const [developerId, setDeveloperId] = useState<string | null>(null);

  useEffect(() => {
    if (!developers.length) return;
    if (!developerId) setDeveloperId(developers[0].id);
  }, [developerId, developers]);

  const projectsQuery = useQuery({
    queryKey: ["developer-projects"],
    queryFn: () => apiFetchWithAuth<ListProjectsResponse>("/developer/projects"),
  });

  const projects = useMemo(() => projectsQuery.data?.items ?? [], [projectsQuery.data?.items]);
  const myProjects = useMemo(
    () => (developerId ? projects.filter((p) => p.developerId === developerId) : projects),
    [developerId, projects],
  );

  const [form, setForm] = useState({
    name: "",
    description: "",
    startingPrice: "",
    address: "",
    area: "",
    city: "",
    province: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!developerId) throw new Error("Developer belum dipilih");
      if (!form.name.trim()) throw new Error("Nama project wajib");
      const payload = {
        developerId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        startingPrice: form.startingPrice.trim() ? Number(form.startingPrice) : undefined,
        location: {
          address: form.address.trim() || undefined,
          area: form.area.trim() || undefined,
          city: form.city.trim() || undefined,
          province: form.province.trim() || undefined,
        },
      };
      return apiFetchWithAuth<Project>("/developer/projects", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: async () => {
      setError(null);
      setSuccess("Project berhasil dibuat");
      setForm({ name: "", description: "", startingPrice: "", address: "", area: "", city: "", province: "" });
      await qc.invalidateQueries({ queryKey: ["developer-projects"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal membuat project"),
  });

  return (
    <RequireDeveloper>
      <main className="min-h-screen bg-slate-50">
        <Container className="py-10">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Project Developer</h1>
                <div className="mt-1 text-sm text-slate-600">Buat dan kelola proyek sebelum menambahkan listing.</div>
              </div>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/developer/dashboard">Kembali</Link>
              </Button>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Buat Project Baru</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
                {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Developer</Label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={developerId ?? ""}
                      onChange={(e) => setDeveloperId(e.target.value)}
                      disabled={!developers.length}
                    >
                      {developers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.verificationStatus})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Nama Project</Label>
                    <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Contoh: Green Residence" />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Deskripsi</Label>
                    <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Deskripsi singkat proyek (opsional)" />
                  </div>

                  <div className="space-y-2">
                    <Label>Harga Mulai (Rp)</Label>
                    <Input value={form.startingPrice} onChange={(e) => setForm((p) => ({ ...p, startingPrice: e.target.value }))} inputMode="numeric" placeholder="Contoh: 850000000" />
                  </div>

                  <div className="space-y-2">
                    <Label>Provinsi</Label>
                    <Input value={form.province} onChange={(e) => setForm((p) => ({ ...p, province: e.target.value }))} placeholder="Contoh: DI Yogyakarta" />
                  </div>

                  <div className="space-y-2">
                    <Label>Kota</Label>
                    <Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="Contoh: Sleman" />
                  </div>

                  <div className="space-y-2">
                    <Label>Kecamatan/Area</Label>
                    <Input value={form.area} onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))} placeholder="Contoh: Ngaglik" />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Alamat</Label>
                    <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="Alamat (opsional)" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                    onClick={() => {
                      setError(null);
                      setSuccess(null);
                      createMutation.mutate();
                    }}
                    disabled={createMutation.isPending || meQuery.isLoading}
                  >
                    {createMutation.isPending ? "Membuat..." : "Buat Project"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Daftar Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {projectsQuery.isLoading ? <div className="text-sm text-slate-600">Memuat...</div> : null}
                {!projectsQuery.isLoading && !myProjects.length ? (
                  <div className="text-sm text-slate-600">Belum ada project.</div>
                ) : null}
                <div className="grid gap-3">
                  {myProjects.map((p) => (
                    <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {p.location ? [p.location.area, p.location.city, p.location.province].filter(Boolean).join(", ") : "—"}
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            Listing: {p.counts.listings} • Unit: {p.counts.units} • Status: {p.status} • Verifikasi: {p.verificationStatus}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button asChild variant="outline" className="h-9 rounded-xl">
                              <Link href={`/developer/projects/${p.id}`}>Edit</Link>
                            </Button>
                            <Button asChild variant="outline" className="h-9 rounded-xl">
                              <Link href="/developer/listings/new">Tambah Listing</Link>
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          {p.startingPrice ? formatRupiah(p.startingPrice) : "—"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
    </RequireDeveloper>
  );
}

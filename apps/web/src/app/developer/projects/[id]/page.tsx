"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { RequireDeveloper } from "@/components/developer/require-developer";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetchWithAuth } from "@/lib/api-auth";

type Project = {
  id: string;
  developerId: string;
  name: string;
  slug: string;
  description: string | null;
  status: "ready_stock" | "pre_launch" | "under_development" | "archived";
  smartReadiness: "none" | "planned" | "partial" | "integrated";
  verificationStatus: string;
  startingPrice: string | null;
  location: { address: string | null; city: string | null; area: string | null; province: string | null } | null;
};

type ListProjectsResponse = { items: Project[] };

export default function DeveloperProjectEditPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const projectsQuery = useQuery({
    queryKey: ["developer-projects"],
    queryFn: () => apiFetchWithAuth<ListProjectsResponse>("/developer/projects"),
  });

  const project = useMemo(() => (projectsQuery.data?.items ?? []).find((p) => p.id === projectId) ?? null, [projectId, projectsQuery.data?.items]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "under_development" as Project["status"],
    smartReadiness: "none" as Project["smartReadiness"],
    startingPrice: "",
    address: "",
    area: "",
    city: "",
    province: "",
  });

  useEffect(() => {
    if (!project) return;
    setForm({
      name: project.name ?? "",
      description: project.description ?? "",
      status: project.status ?? "under_development",
      smartReadiness: project.smartReadiness ?? "none",
      startingPrice: project.startingPrice ?? "",
      address: project.location?.address ?? "",
      area: project.location?.area ?? "",
      city: project.location?.city ?? "",
      province: project.location?.province ?? "",
    });
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim() || undefined,
        description: form.description.trim() || undefined,
        status: form.status,
        smartReadiness: form.smartReadiness,
        startingPrice: form.startingPrice.trim() ? Number(form.startingPrice) : null,
        location: {
          address: form.address.trim() || null,
          area: form.area.trim() || null,
          city: form.city.trim() || null,
          province: form.province.trim() || null,
        },
      };
      return apiFetchWithAuth(`/developer/projects/${projectId}`, { method: "PUT", body: JSON.stringify(payload) });
    },
    onSuccess: async () => {
      setError(null);
      setSuccess("Perubahan project tersimpan");
      await qc.invalidateQueries({ queryKey: ["developer-projects"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal menyimpan project"),
  });

  return (
    <RequireDeveloper>
      <main className="min-h-screen bg-slate-50">
        <Container className="py-10">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Edit Project</h1>
                <div className="mt-1 text-sm text-slate-600">Lengkapi informasi project agar listing bisa tampil optimal.</div>
              </div>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/developer/projects">Kembali</Link>
              </Button>
            </div>

            {!project && !projectsQuery.isLoading ? (
              <Card className="shadow-sm">
                <CardContent className="p-6 text-sm text-slate-700">
                  Project tidak ditemukan atau kamu tidak punya akses.
                </CardContent>
              </Card>
            ) : null}

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Detail Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
                {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}

                <div className="space-y-2">
                  <Label>Nama</Label>
                  <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Status Project</Label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Project["status"] }))}
                    >
                      <option value="under_development">Under development</option>
                      <option value="pre_launch">Pre-launch</option>
                      <option value="ready_stock">Ready stock</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Smart Readiness</Label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={form.smartReadiness}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, smartReadiness: e.target.value as Project["smartReadiness"] }))
                      }
                    >
                      <option value="none">None</option>
                      <option value="planned">Planned</option>
                      <option value="partial">Partial</option>
                      <option value="integrated">Integrated</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Harga Mulai (Rp)</Label>
                  <Input value={form.startingPrice} onChange={(e) => setForm((p) => ({ ...p, startingPrice: e.target.value }))} inputMode="numeric" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Alamat</Label>
                    <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Area</Label>
                    <Input value={form.area} onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Kota</Label>
                    <Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Provinsi</Label>
                    <Input value={form.province} onChange={(e) => setForm((p) => ({ ...p, province: e.target.value }))} />
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                    onClick={() => {
                      setError(null);
                      setSuccess(null);
                      updateMutation.mutate();
                    }}
                    disabled={updateMutation.isPending || projectsQuery.isLoading || !project}
                  >
                    {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => router.push("/developer/listings/new")}
                    disabled={!project}
                  >
                    Buat Listing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
    </RequireDeveloper>
  );
}

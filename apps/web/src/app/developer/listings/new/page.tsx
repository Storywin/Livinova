"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { RequireDeveloper } from "@/components/developer/require-developer";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetchWithAuth } from "@/lib/api-auth";

type Project = { id: string; name: string };
type ListProjectsResponse = { items: Array<{ id: string; name: string }> };

type CreatedListing = { id: string; title: string; slug: string };

export default function DeveloperNewListingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const projectsQuery = useQuery({
    queryKey: ["developer-projects"],
    queryFn: () => apiFetchWithAuth<ListProjectsResponse>("/developer/projects"),
  });

  const projects: Project[] = useMemo(
    () => (projectsQuery.data?.items ?? []).map((p) => ({ id: p.id, name: p.name })),
    [projectsQuery.data],
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("Pilih project dulu");
      if (!title.trim()) throw new Error("Judul listing wajib");
      const payload = {
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        price: price.trim() ? Number(price) : undefined,
      };
      return apiFetchWithAuth<CreatedListing>("/developer/listings", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: (created) => {
      router.push(`/developer/listings/${created.id}`);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal membuat listing"),
  });

  return (
    <RequireDeveloper>
      <main className="min-h-screen bg-slate-50">
        <Container className="py-10">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tambah Listing</h1>
                <div className="mt-1 text-sm text-slate-600">Buat draft listing baru untuk kemudian dilengkapi.</div>
              </div>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/developer/listings">Kembali</Link>
              </Button>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Form Draft</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

                {!projects.length ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
                    Belum ada project. Buat dulu di{" "}
                    <Link className="font-semibold text-slate-900 hover:underline" href="/developer/projects">
                      Project Developer
                    </Link>
                    .
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label>Project</Label>
                  <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={!projects.length}>
                    <option value="">Pilih project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Judul Listing</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Rumah Minimalis 2 Lantai" />
                </div>

                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi singkat (opsional)" />
                </div>

                <div className="space-y-2">
                  <Label>Harga (Rp)</Label>
                  <Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" placeholder="Contoh: 950000000" />
                </div>

                <div className="flex justify-end">
                  <Button
                    className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                    onClick={() => {
                      setError(null);
                      createMutation.mutate();
                    }}
                    disabled={createMutation.isPending || projectsQuery.isLoading}
                  >
                    {createMutation.isPending ? "Membuat..." : "Buat Draft"}
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


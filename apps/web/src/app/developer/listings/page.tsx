"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

import { RequireDeveloper } from "@/components/developer/require-developer";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetchWithAuth } from "@/lib/api-auth";
import { formatRupiah } from "@/lib/format";

type Listing = {
  id: string;
  title: string;
  slug: string;
  status: string;
  verificationStatus: string;
  price: string | null;
  startingPrice: string | null;
  project: { id: string; name: string; slug: string; location: { city: string | null; area: string | null; province: string | null } | null };
  thumbnail: string | null;
  updatedAt: string;
};

type ListListingsResponse = { items: Listing[] };
type Project = { id: string; name: string };
type ListProjectsResponse = { items: Array<{ id: string; name: string }> };

export default function DeveloperListingsPage() {
  const [projectId, setProjectId] = useState<string>("");

  const projectsQuery = useQuery({
    queryKey: ["developer-projects"],
    queryFn: () => apiFetchWithAuth<ListProjectsResponse>("/developer/projects"),
  });

  const listingsQuery = useQuery({
    queryKey: ["developer-listings", projectId],
    queryFn: () => apiFetchWithAuth<ListListingsResponse>(`/developer/listings${projectId ? `?projectId=${projectId}` : ""}`),
  });

  const projects: Project[] = useMemo(
    () => (projectsQuery.data?.items ?? []).map((p) => ({ id: p.id, name: p.name })),
    [projectsQuery.data],
  );

  const listings = listingsQuery.data?.items ?? [];

  return (
    <RequireDeveloper>
      <main className="min-h-screen bg-slate-50">
        <Container className="py-10">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Listing</h1>
                <div className="mt-1 text-sm text-slate-600">Buat, edit draft, dan submit listing untuk verifikasi.</div>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/developer/dashboard">Kembali</Link>
                </Button>
                <Button asChild className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                  <Link href="/developer/listings/new">Tambah Listing</Link>
                </Button>
              </div>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Filter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs text-slate-500">Project</div>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">Semua</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {!projects.length ? (
                  <div className="text-xs text-slate-500">
                    Belum ada project. Buat dulu di{" "}
                    <Link className="font-medium text-slate-900 hover:underline" href="/developer/projects">
                      Project Developer
                    </Link>
                    .
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Daftar Listing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {listingsQuery.isLoading ? <div className="text-sm text-slate-600">Memuat...</div> : null}
                {!listingsQuery.isLoading && !listings.length ? <div className="text-sm text-slate-600">Belum ada listing.</div> : null}
                <div className="grid gap-3">
                  {listings.map((l) => (
                    <Link key={l.id} href={`/developer/listings/${l.id}`} className="block rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900">{l.title}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {l.project.name} • {l.project.location ? [l.project.location.area, l.project.location.city, l.project.location.province].filter(Boolean).join(", ") : "—"}
                          </div>
                          <div className="mt-2 text-xs text-slate-500">Status: {l.status} • Verifikasi: {l.verificationStatus}</div>
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          {formatRupiah(l.price ?? l.startingPrice)}
                        </div>
                      </div>
                    </Link>
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


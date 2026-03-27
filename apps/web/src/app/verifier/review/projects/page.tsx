"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { DataTable } from "@/components/admin/data-table";
import { RequireVerifier } from "@/components/verifier/require-verifier";
import { Button } from "@/components/ui/button";
import { apiFetchWithAuth } from "@/lib/api-auth";
import { formatRupiah } from "@/lib/format";

type Project = {
  id: string;
  name: string;
  slug: string;
  status: string;
  verificationStatus: string;
  startingPrice: string | null;
  createdAt: string;
  developer: { id: string; name: string; slug: string; verificationStatus: string };
  location: { city: string | null; area: string | null; province: string | null } | null;
};

type Paginated<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

export default function VerifierReviewProjectsPage() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const projectsQuery = useQuery({
    queryKey: ["verifier-review-projects"],
    queryFn: () =>
      apiFetchWithAuth<Paginated<Project>>(
        "/admin/review/projects?verificationStatus=pending&page=1&pageSize=50",
      ),
  });

  const reviewMutation = useMutation({
    mutationFn: async (input: { id: string; outcome: "approved" | "rejected" | "revision_requested"; notes?: string }) => {
      return apiFetchWithAuth(`/admin/review/projects/${input.id}`, {
        method: "POST",
        body: JSON.stringify({ outcome: input.outcome, notes: input.notes }),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["verifier-review-projects"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal memproses verifikasi"),
  });

  return (
    <AdminShell title="Verifikasi Project">
      <RequireVerifier>
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <DataTable<Project>
          columns={[
            { header: "Project", cell: (p) => <div className="font-medium text-slate-900">{p.name}</div> },
            { header: "Developer", cell: (p) => <div className="text-slate-700">{p.developer.name}</div> },
            {
              header: "Lokasi",
              cell: (p) => {
                const loc = p.location;
                return (
                  <div className="text-slate-700">
                    {loc ? [loc.area, loc.city, loc.province].filter(Boolean).join(", ") : "—"}
                  </div>
                );
              },
            },
            { header: "Harga Mulai", cell: (p) => <div className="text-slate-700">{formatRupiah(p.startingPrice)}</div> },
            { header: "Status", cell: (p) => <div className="text-slate-700">{p.verificationStatus}</div> },
            {
              header: "Aksi",
              className: "w-[240px]",
              cell: (p) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="bg-slate-900 text-white hover:bg-slate-800"
                    onClick={() => {
                      setError(null);
                      const notes = window.prompt("Catatan verifikasi (opsional):") ?? undefined;
                      reviewMutation.mutate({ id: p.id, outcome: "approved", notes });
                    }}
                    disabled={reviewMutation.isPending}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setError(null);
                      const notes = window.prompt("Alasan reject (opsional):") ?? undefined;
                      reviewMutation.mutate({ id: p.id, outcome: "rejected", notes });
                    }}
                    disabled={reviewMutation.isPending}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setError(null);
                      const notes = window.prompt("Catatan revisi (wajib disarankan):") ?? undefined;
                      reviewMutation.mutate({ id: p.id, outcome: "revision_requested", notes });
                    }}
                    disabled={reviewMutation.isPending}
                  >
                    Request Revisi
                  </Button>
                </div>
              ),
            },
          ]}
          rows={projectsQuery.data?.items ?? []}
          rowKey={(p) => p.id}
        />
      </RequireVerifier>
    </AdminShell>
  );
}


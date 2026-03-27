"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { DataTable } from "@/components/admin/data-table";
import { RequireVerifier } from "@/components/verifier/require-verifier";
import { Button } from "@/components/ui/button";
import { apiFetchWithAuth } from "@/lib/api-auth";

type Developer = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  province: string | null;
  verificationStatus: string;
  createdAt: string;
};

type Paginated<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

export default function VerifierReviewDevelopersPage() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const developersQuery = useQuery({
    queryKey: ["verifier-review-developers"],
    queryFn: () => apiFetchWithAuth<Paginated<Developer>>("/admin/review/developers?status=pending&page=1&pageSize=50"),
  });

  const reviewMutation = useMutation({
    mutationFn: async (input: { id: string; outcome: "approved" | "rejected" | "revision_requested"; notes?: string }) => {
      return apiFetchWithAuth(`/admin/review/developers/${input.id}`, {
        method: "POST",
        body: JSON.stringify({ outcome: input.outcome, notes: input.notes }),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["verifier-review-developers"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal memproses verifikasi"),
  });

  return (
    <AdminShell title="Verifikasi Developer">
      <RequireVerifier>
        {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

        <DataTable<Developer>
          columns={[
            { header: "Developer", cell: (d) => <div className="font-medium text-slate-900">{d.name}</div> },
            {
              header: "Lokasi",
              cell: (d) => <div className="text-slate-700">{[d.city, d.province].filter(Boolean).join(", ") || "—"}</div>,
            },
            { header: "Status", cell: (d) => <div className="text-slate-700">{d.verificationStatus}</div> },
            {
              header: "Aksi",
              className: "w-[240px]",
              cell: (d) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="bg-slate-900 text-white hover:bg-slate-800"
                    onClick={() => {
                      setError(null);
                      const notes = window.prompt("Catatan verifikasi (opsional):") ?? undefined;
                      reviewMutation.mutate({ id: d.id, outcome: "approved", notes });
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
                      reviewMutation.mutate({ id: d.id, outcome: "rejected", notes });
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
                      reviewMutation.mutate({ id: d.id, outcome: "revision_requested", notes });
                    }}
                    disabled={reviewMutation.isPending}
                  >
                    Request Revisi
                  </Button>
                </div>
              ),
            },
          ]}
          rows={developersQuery.data?.items ?? []}
          rowKey={(d) => d.id}
        />
      </RequireVerifier>
    </AdminShell>
  );
}


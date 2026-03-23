"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { DataTable } from "@/components/admin/data-table";
import { RequireAdmin } from "@/components/admin/require-admin";
import { Button } from "@/components/ui/button";
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
  createdAt: string;
  project: {
    developer: { name: string; slug: string };
    location: { city: string | null; area: string | null; province: string | null } | null;
  };
};

type Paginated<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

export default function AdminReviewListingsPage() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const listingsQuery = useQuery({
    queryKey: ["admin-review-listings"],
    queryFn: () =>
      apiFetchWithAuth<Paginated<Listing>>(
        "/admin/review/listings?status=pending&verificationStatus=pending&page=1&pageSize=50",
      ),
  });

  const reviewMutation = useMutation({
    mutationFn: async (input: { id: string; outcome: "approved" | "rejected" | "revision_requested"; notes?: string }) => {
      return apiFetchWithAuth(`/admin/review/listings/${input.id}`, {
        method: "POST",
        body: JSON.stringify({ outcome: input.outcome, notes: input.notes }),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-review-listings"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal memproses verifikasi"),
  });

  return (
    <AdminShell title="Verifikasi Listing">
      <RequireAdmin>
        {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

        <DataTable<Listing>
          columns={[
            {
              header: "Listing",
              cell: (l) => (
                <div>
                  <Link className="font-medium text-slate-900 hover:underline" href={`/properti/${l.slug}`}>
                    {l.title}
                  </Link>
                  <div className="mt-1 text-xs text-slate-500">{l.project.developer.name}</div>
                </div>
              ),
            },
            {
              header: "Lokasi",
              cell: (l) => {
                const loc = l.project.location;
                const text = loc ? [loc.area, loc.city, loc.province].filter(Boolean).join(", ") : "—";
                return <div className="text-slate-700">{text}</div>;
              },
            },
            {
              header: "Harga",
              cell: (l) => (
                <div className="text-slate-700">{formatRupiah(l.price ?? l.startingPrice)}</div>
              ),
            },
            {
              header: "Aksi",
              className: "w-[240px]",
              cell: (l) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="bg-slate-900 text-white hover:bg-slate-800"
                    onClick={() => {
                      setError(null);
                      const notes = window.prompt("Catatan verifikasi (opsional):") ?? undefined;
                      reviewMutation.mutate({ id: l.id, outcome: "approved", notes });
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
                      reviewMutation.mutate({ id: l.id, outcome: "rejected", notes });
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
                      reviewMutation.mutate({ id: l.id, outcome: "revision_requested", notes });
                    }}
                    disabled={reviewMutation.isPending}
                  >
                    Request Revisi
                  </Button>
                </div>
              ),
            },
          ]}
          rows={listingsQuery.data?.items ?? []}
          rowKey={(l) => l.id}
        />
      </RequireAdmin>
    </AdminShell>
  );
}


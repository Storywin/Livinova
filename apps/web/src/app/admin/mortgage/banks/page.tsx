"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";

import { AdminShell } from "@/components/admin/admin-shell";
import { DataTable } from "@/components/admin/data-table";
import { RequireAdmin } from "@/components/admin/require-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetchWithAuth } from "@/lib/api-auth";

type Bank = { id: string; name: string; slug: string; isSharia: boolean };

const createSchema = z.object({
  name: z.string().min(2, "Nama bank minimal 2 karakter"),
  isSharia: z.boolean().optional(),
});

export default function AdminMortgageBanksPage() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [isSharia, setIsSharia] = useState(false);

  const banksQuery = useQuery({
    queryKey: ["admin-mortgage-banks"],
    queryFn: () => apiFetchWithAuth<Bank[]>("/admin/mortgage/banks"),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = createSchema.parse({ name, isSharia });
      return apiFetchWithAuth<Bank>("/admin/mortgage/banks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      setName("");
      setIsSharia(false);
      await qc.invalidateQueries({ queryKey: ["admin-mortgage-banks"] });
    },
    onError: (e) => {
      setError(e instanceof Error ? e.message : "Gagal membuat bank");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetchWithAuth<{ ok: true }>(`/admin/mortgage/banks/${id}`, { method: "DELETE" });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-mortgage-banks"] });
    },
    onError: (e) => {
      setError(e instanceof Error ? e.message : "Gagal menghapus bank");
    },
  });

  return (
    <AdminShell title="Pengaturan KPR — Bank">
      <RequireAdmin>
        <div className="grid gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Tambah Bank</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3 md:items-end">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Nama Bank</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: BCA" />
                </div>
                <div className="flex items-center gap-2 md:justify-end">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={isSharia}
                      onChange={(e) => setIsSharia(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Syariah
                  </label>
                  <Button
                    className="bg-slate-900 text-white hover:bg-slate-800"
                    onClick={() => {
                      setError(null);
                      createMutation.mutate();
                    }}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </div>
              {error ? <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
            </CardContent>
          </Card>

          <DataTable<Bank>
            columns={[
              { header: "Nama", cell: (b) => <div className="font-medium text-slate-900">{b.name}</div> },
              { header: "Slug", cell: (b) => <div className="text-slate-600">{b.slug}</div> },
              { header: "Tipe", cell: (b) => <div className="text-slate-600">{b.isSharia ? "Syariah" : "Konvensional"}</div> },
              {
                header: "",
                className: "w-[120px] text-right",
                cell: (b) => (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => deleteMutation.mutate(b.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Hapus
                    </Button>
                  </div>
                ),
              },
            ]}
            rows={banksQuery.data ?? []}
            rowKey={(b) => b.id}
          />
        </div>
      </RequireAdmin>
    </AdminShell>
  );
}


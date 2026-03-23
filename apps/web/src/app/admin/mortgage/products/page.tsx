"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";

import { AdminShell } from "@/components/admin/admin-shell";
import { DataTable } from "@/components/admin/data-table";
import { RequireAdmin } from "@/components/admin/require-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetchWithAuth } from "@/lib/api-auth";
import { formatRupiah } from "@/lib/format";

type Bank = { id: string; name: string; slug: string; isSharia: boolean };
type Product = {
  id: string;
  name: string;
  slug: string;
  bankId: string;
  bank: Bank;
  defaultInterestRate: string | null;
  promoInterestRate: string | null;
  fixedPeriodMonths: number | null;
  floatingRateAssumption: string | null;
  shariaMargin: string | null;
  adminFee: string | null;
  insuranceRate: string | null;
  provisiRate: string | null;
  notaryFeeEstimate: string | null;
  isActive: boolean;
};

const schema = z.object({
  bankId: z.string().min(1, "Bank wajib dipilih"),
  name: z.string().min(2, "Nama produk minimal 2 karakter"),
  defaultInterestRate: z.coerce.number().min(0).optional(),
  promoInterestRate: z.coerce.number().min(0).optional(),
  fixedPeriodMonths: z.coerce.number().int().min(0).optional(),
  floatingRateAssumption: z.coerce.number().min(0).optional(),
  shariaMargin: z.coerce.number().min(0).optional(),
  adminFee: z.coerce.number().min(0).optional(),
  insuranceRate: z.coerce.number().min(0).optional(),
  provisiRate: z.coerce.number().min(0).optional(),
  notaryFeeEstimate: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export default function AdminMortgageProductsPage() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const banksQuery = useQuery({
    queryKey: ["admin-mortgage-banks"],
    queryFn: () => apiFetchWithAuth<Bank[]>("/admin/mortgage/banks"),
  });

  const productsQuery = useQuery({
    queryKey: ["admin-mortgage-products"],
    queryFn: () => apiFetchWithAuth<Product[]>("/admin/mortgage/products"),
  });

  const [form, setForm] = useState({
    bankId: "",
    name: "",
    defaultInterestRate: "",
    promoInterestRate: "",
    fixedPeriodMonths: "",
    floatingRateAssumption: "",
    shariaMargin: "",
    adminFee: "",
    insuranceRate: "",
    provisiRate: "",
    notaryFeeEstimate: "",
    isActive: true,
  });

  const selectedBank = useMemo(() => banksQuery.data?.find((b) => b.id === form.bankId) ?? null, [banksQuery.data, form.bankId]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = schema.parse({
        bankId: form.bankId,
        name: form.name,
        defaultInterestRate: form.defaultInterestRate ? Number(form.defaultInterestRate) : undefined,
        promoInterestRate: form.promoInterestRate ? Number(form.promoInterestRate) : undefined,
        fixedPeriodMonths: form.fixedPeriodMonths ? Number(form.fixedPeriodMonths) : undefined,
        floatingRateAssumption: form.floatingRateAssumption ? Number(form.floatingRateAssumption) : undefined,
        shariaMargin: form.shariaMargin ? Number(form.shariaMargin) : undefined,
        adminFee: form.adminFee ? Number(form.adminFee) : undefined,
        insuranceRate: form.insuranceRate ? Number(form.insuranceRate) : undefined,
        provisiRate: form.provisiRate ? Number(form.provisiRate) : undefined,
        notaryFeeEstimate: form.notaryFeeEstimate ? Number(form.notaryFeeEstimate) : undefined,
        isActive: form.isActive,
      });
      return apiFetchWithAuth<Product>("/admin/mortgage/products", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: async () => {
      setForm({
        bankId: "",
        name: "",
        defaultInterestRate: "",
        promoInterestRate: "",
        fixedPeriodMonths: "",
        floatingRateAssumption: "",
        shariaMargin: "",
        adminFee: "",
        insuranceRate: "",
        provisiRate: "",
        notaryFeeEstimate: "",
        isActive: true,
      });
      await qc.invalidateQueries({ queryKey: ["admin-mortgage-products"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal membuat produk"),
  });

  return (
    <AdminShell title="Pengaturan KPR — Produk">
      <RequireAdmin>
        <div className="grid gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Tambah Produk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bankId">Bank</Label>
                  <select
                    id="bankId"
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.bankId}
                    onChange={(e) => setForm((p) => ({ ...p, bankId: e.target.value }))}
                  >
                    <option value="">Pilih bank</option>
                    {banksQuery.data?.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.isSharia ? "(Syariah)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Produk</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Contoh: KPR Fix & Cap" />
                </div>

                {selectedBank?.isSharia ? (
                  <div className="space-y-2">
                    <Label htmlFor="shariaMargin">Margin Syariah (%/tahun)</Label>
                    <Input id="shariaMargin" inputMode="decimal" value={form.shariaMargin} onChange={(e) => setForm((p) => ({ ...p, shariaMargin: e.target.value }))} />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="promoInterestRate">Bunga Promo (%/tahun)</Label>
                      <Input id="promoInterestRate" inputMode="decimal" value={form.promoInterestRate} onChange={(e) => setForm((p) => ({ ...p, promoInterestRate: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="defaultInterestRate">Bunga Default (%/tahun)</Label>
                      <Input id="defaultInterestRate" inputMode="decimal" value={form.defaultInterestRate} onChange={(e) => setForm((p) => ({ ...p, defaultInterestRate: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fixedPeriodMonths">Fixed Period (bulan)</Label>
                      <Input id="fixedPeriodMonths" inputMode="numeric" value={form.fixedPeriodMonths} onChange={(e) => setForm((p) => ({ ...p, fixedPeriodMonths: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="floatingRateAssumption">Asumsi Floating (%/tahun)</Label>
                      <Input id="floatingRateAssumption" inputMode="decimal" value={form.floatingRateAssumption} onChange={(e) => setForm((p) => ({ ...p, floatingRateAssumption: e.target.value }))} />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="adminFee">Biaya Admin</Label>
                  <Input id="adminFee" inputMode="numeric" value={form.adminFee} onChange={(e) => setForm((p) => ({ ...p, adminFee: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provisiRate">Provisi (% dari pembiayaan)</Label>
                  <Input id="provisiRate" inputMode="decimal" value={form.provisiRate} onChange={(e) => setForm((p) => ({ ...p, provisiRate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insuranceRate">Asuransi (% dari pembiayaan)</Label>
                  <Input id="insuranceRate" inputMode="decimal" value={form.insuranceRate} onChange={(e) => setForm((p) => ({ ...p, insuranceRate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notaryFeeEstimate">Notaris (estimasi)</Label>
                  <Input id="notaryFeeEstimate" inputMode="numeric" value={form.notaryFeeEstimate} onChange={(e) => setForm((p) => ({ ...p, notaryFeeEstimate: e.target.value }))} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 rounded border-slate-300" />
                  Aktif
                </label>
                <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => { setError(null); createMutation.mutate(); }} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>

              {error ? <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
            </CardContent>
          </Card>

          <DataTable<Product>
            columns={[
              {
                header: "Produk",
                cell: (p) => (
                  <div>
                    <div className="font-medium text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.bank.name}</div>
                  </div>
                ),
              },
              {
                header: "Rate/Margin",
                cell: (p) =>
                  p.bank.isSharia ? (
                    <div className="text-slate-700">{p.shariaMargin ? `${p.shariaMargin}%` : "—"}</div>
                  ) : (
                    <div className="text-slate-700">
                      Promo {p.promoInterestRate ? `${p.promoInterestRate}%` : "—"} • Default{" "}
                      {p.defaultInterestRate ? `${p.defaultInterestRate}%` : "—"}
                    </div>
                  ),
              },
              {
                header: "Biaya",
                cell: (p) => (
                  <div className="text-slate-700">
                    Admin {formatRupiah(p.adminFee)} • Notaris {formatRupiah(p.notaryFeeEstimate)}
                  </div>
                ),
              },
              { header: "Aktif", className: "w-[90px]", cell: (p) => <div className="text-slate-700">{p.isActive ? "Ya" : "Tidak"}</div> },
            ]}
            rows={productsQuery.data ?? []}
            rowKey={(p) => p.id}
          />
        </div>
      </RequireAdmin>
    </AdminShell>
  );
}


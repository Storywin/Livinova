"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Banknote, Calculator, Check, ChevronDown, Landmark, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  bank: { name: string; slug: string; isSharia: boolean };
  sourceUrl?: string | null;
  sourceCheckedAt?: string | null;
  notes?: string | null;
};

type SimulationResult = {
  outputs: {
    monthlyInstallment: number;
    laterMonthlyInstallment: number | null;
    schedule: Array<{ months: number; monthly: number; ratePercent: number; kind: string }>;
  };
  bank: { name: string; isSharia: boolean };
  product: { name: string };
};

export function KprQuick() {
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState("");
  const [propertyPriceDigits, setPropertyPriceDigits] = useState("1500000000");
  const [downPaymentDigits, setDownPaymentDigits] = useState("300000000");
  const [tenorMonths, setTenorMonths] = useState("240");
  const [productOpen, setProductOpen] = useState(false);
  const productWrapRef = useRef<HTMLDivElement | null>(null);

  const formatDigits = (digits: string) => {
    const cleaned = digits.replace(/^0+(?=\d)/, "");
    if (!cleaned) return "";
    try {
      return new Intl.NumberFormat("id-ID").format(BigInt(cleaned));
    } catch {
      return cleaned;
    }
  };

  const digitsOnly = (value: string) => value.replace(/[^\d]/g, "");

  useEffect(() => {
    if (!productOpen) return;
    const onDown = (e: MouseEvent) => {
      const el = productWrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setProductOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProductOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [productOpen]);

  const productsQuery = useQuery({
    queryKey: ["home-kpr-products"],
    queryFn: () => apiFetch<Product[]>("/public/mortgage/products"),
  });

  const defaultProductId = useMemo(() => productsQuery.data?.[0]?.id ?? "", [productsQuery.data]);
  const bankCount = useMemo(() => {
    const set = new Set(productsQuery.data?.map((p) => p.bank.slug) ?? []);
    return set.size;
  }, [productsQuery.data]);
  const productCount = productsQuery.data?.length ?? 0;

  const simulate = useMutation({
    mutationFn: async () => {
      const price = propertyPriceDigits ? Number(propertyPriceDigits) : 0;
      const dp = downPaymentDigits ? Number(downPaymentDigits) : 0;
      const tenor = tenorMonths ? Number(tenorMonths) : 0;
      if (!price || !Number.isFinite(price)) throw new Error("Harga properti tidak valid");
      if (!Number.isFinite(dp) || dp < 0) throw new Error("Uang muka tidak valid");
      if (!tenor || !Number.isFinite(tenor)) throw new Error("Tenor tidak valid");

      const payload = {
        productId: productId || defaultProductId,
        propertyPrice: price,
        downPayment: dp,
        tenorMonths: tenor,
      };
      return apiFetch<SimulationResult>("/public/mortgage/simulate", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Gagal melakukan simulasi"),
  });

  const selected = useMemo(() => {
    const id = productId || defaultProductId;
    return productsQuery.data?.find((p) => p.id === id) ?? null;
  }, [defaultProductId, productId, productsQuery.data]);

  const dpPercent = useMemo(() => {
    const p = propertyPriceDigits ? Number(propertyPriceDigits) : 0;
    const dp = downPaymentDigits ? Number(downPaymentDigits) : 0;
    if (!Number.isFinite(p) || !Number.isFinite(dp) || p <= 0) return null;
    return Math.max(0, Math.min(100, Math.round((dp / p) * 100)));
  }, [downPaymentDigits, propertyPriceDigits]);

  return (
    <section className="relative overflow-hidden bg-white py-12 md:py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-28 h-[520px] w-[520px] rounded-full bg-violet-500/12 blur-3xl" />
        <div className="absolute -right-24 -top-28 h-[520px] w-[520px] rounded-full bg-sky-500/12 blur-3xl" />
        <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] [background-size:26px_26px] opacity-50" />
      </div>
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="grid gap-6 md:grid-cols-2 md:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-violet-600" />
              Simulasi KPR Cepat
            </div>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Estimasi Cicilan dalam Sekali Hitung
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 md:text-base">
              Bandingkan estimasi cicilan berdasarkan produk bank yang dikelola dari sistem. Masukkan harga properti dan
              uang muka untuk melihat perkiraan cicilan bulanan.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-sky-600" />
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bank</div>
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {productsQuery.isLoading ? "—" : <CountUp value={bankCount} />}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-violet-600" />
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Produk</div>
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {productsQuery.isLoading ? "—" : <CountUp value={productCount} />}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-emerald-600" />
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">DP</div>
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {dpPercent === null ? "—" : <CountUp value={dpPercent} suffix="%" />}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              <Link
                className="inline-flex items-center rounded-full bg-slate-50 px-4 py-2 font-semibold text-slate-900 ring-1 ring-slate-200 transition hover:bg-slate-100"
                href="/kpr"
              >
                Buka simulator lengkap →
              </Link>
              <Link className="text-slate-600 hover:text-slate-900" href="/promo">
                Lihat promo bank & iklan →
              </Link>
            </div>
          </div>

          <Card className="overflow-hidden border border-slate-200 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur">
            <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50">
              <CardTitle>Hitung Estimasi</CardTitle>
              <div className="mt-1 text-sm text-slate-600">Hasil berupa estimasi untuk membantu perbandingan.</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Produk</Label>
                <div ref={productWrapRef} className="relative">
                  <button
                    id="product"
                    type="button"
                    onClick={() => setProductOpen((v) => !v)}
                    className="inline-flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-3 text-left text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-haspopup="listbox"
                    aria-expanded={productOpen}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {selected ? `${selected.bank.name} — ${selected.name}` : "Pilih produk"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </button>

                  {productOpen ? (
                    <div
                      role="listbox"
                      aria-label="Daftar produk KPR"
                      className="absolute z-30 mt-2 max-h-[240px] w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
                    >
                      {(productsQuery.data ?? []).map((p) => {
                        const active = (productId || defaultProductId) === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            role="option"
                            aria-selected={active}
                            onClick={() => {
                              setProductId(p.id);
                              setProductOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-50",
                              active && "bg-slate-900 text-white hover:bg-slate-900",
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {p.bank.name} — {p.name}
                            </span>
                            {active ? <Check className="h-4 w-4" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                {selected ? (
                  <div className="text-xs text-slate-500">
                    {selected.bank.isSharia ? "Mode Syariah" : "Mode Konvensional"} • {selected.bank.name}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Harga Properti</Label>
                  <Input
                    id="price"
                    inputMode="numeric"
                    value={formatDigits(propertyPriceDigits)}
                    onChange={(e) => setPropertyPriceDigits(digitsOnly(e.target.value))}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dp">Uang Muka</Label>
                  <Input
                    id="dp"
                    inputMode="numeric"
                    value={formatDigits(downPaymentDigits)}
                    onChange={(e) => setDownPaymentDigits(digitsOnly(e.target.value))}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const p = propertyPriceDigits ? Number(propertyPriceDigits) : 0;
                    if (!Number.isFinite(p) || p <= 0) return;
                    setDownPaymentDigits(String(Math.round(p * 0.2)));
                  }}
                  className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-100"
                >
                  DP 20%
                </button>
                <button
                  type="button"
                  onClick={() => setTenorMonths("180")}
                  className={cn(
                    "rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-100",
                    tenorMonths === "180" && "bg-slate-900 text-white ring-slate-900 hover:bg-slate-800",
                  )}
                >
                  15 tahun
                </button>
                <button
                  type="button"
                  onClick={() => setTenorMonths("240")}
                  className={cn(
                    "rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-100",
                    tenorMonths === "240" && "bg-slate-900 text-white ring-slate-900 hover:bg-slate-800",
                  )}
                >
                  20 tahun
                </button>
                <button
                  type="button"
                  onClick={() => setTenorMonths("300")}
                  className={cn(
                    "rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-100",
                    tenorMonths === "300" && "bg-slate-900 text-white ring-slate-900 hover:bg-slate-800",
                  )}
                >
                  25 tahun
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenor">Tenor (bulan)</Label>
                <Input
                  id="tenor"
                  inputMode="numeric"
                  value={tenorMonths}
                  onChange={(e) => setTenorMonths(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              {productsQuery.isError ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Produk KPR belum bisa dimuat. Silakan coba refresh.
                </div>
              ) : null}

              {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

              <Button
                className="w-full bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => {
                  setError(null);
                  simulate.mutate();
                }}
                disabled={simulate.isPending || productsQuery.isLoading}
              >
                {simulate.isPending ? "Menghitung..." : "Hitung"}
              </Button>

              {simulate.data ? (
                <div className="space-y-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimasi Cicilan Bulanan</div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                      {formatRupiah(simulate.data.outputs.monthlyInstallment)}
                      <span className="ml-2 text-sm font-semibold text-slate-600">/ bulan</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {simulate.data.bank.name} — {simulate.data.product.name}
                    </div>
                  </div>

                  {simulate.data.outputs.laterMonthlyInstallment ? (
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                      Estimasi setelah masa promo/fase awal:{" "}
                      <span className="font-semibold text-slate-900">
                        {formatRupiah(simulate.data.outputs.laterMonthlyInstallment)}
                      </span>
                      <span className="text-slate-600"> / bulan</span>
                    </div>
                  ) : null}

                  {simulate.data.outputs.schedule?.length ? (
                    <div className="grid gap-2">
                      {simulate.data.outputs.schedule.slice(0, 3).map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900">{s.months} bulan</div>
                            <div className="text-xs text-slate-600">{Number(s.ratePercent).toFixed(2)}% / tahun</div>
                          </div>
                          <div className="font-semibold text-slate-900">{formatRupiah(s.monthly)}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {selected?.sourceUrl ? (
                    <div className="text-xs text-slate-500">
                      Sumber bunga:{" "}
                      <a
                        className="font-semibold text-sky-700 hover:text-sky-800 hover:underline"
                        href={selected.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {selected.bank.name}
                      </a>
                      {selected.sourceCheckedAt ? (
                        <span> • dicek {new Date(selected.sourceCheckedAt).toLocaleDateString("id-ID")}</span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">Suku bunga dapat berubah sewaktu-waktu sesuai kebijakan bank.</div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

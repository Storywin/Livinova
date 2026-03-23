"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Banknote, BadgeCheck, Calculator, Check, ChevronDown, CircleHelp, Landmark, Scale, ShieldCheck, Sparkles } from "lucide-react";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

type Bank = { id: string; name: string; slug: string; isSharia: boolean; productCount: number };

type Product = {
  id: string;
  name: string;
  slug: string;
  bank: { id: string; name: string; slug: string; isSharia: boolean };
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
  productId: z.string().min(1, "Produk KPR wajib dipilih"),
  propertyPrice: z.coerce.number().min(0, "Harga properti tidak valid"),
  downPayment: z.coerce.number().min(0, "Uang muka tidak valid"),
  tenorMonths: z.coerce.number().int().min(1, "Tenor tidak valid"),
  monthlyIncome: z.coerce.number().min(0).optional(),
  additionalFees: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

type SimulationResult = {
  bank: { name: string; slug: string; isSharia: boolean };
  product: { name: string };
  derived: {
    financing: number;
    fees: {
      adminFee: number;
      notaryFeeEstimate: number;
      provisiRatePercent: number;
      provisi: number;
      insuranceRatePercent: number;
      insurance: number;
      additionalFees: number;
      totalFees: number;
    };
    totalDownPayment: number;
  };
  outputs: {
    monthlyInstallment: number;
    estimatedTotalPayment: number;
    affordabilityRatio: number | null;
  };
  assumption: Record<string, unknown>;
};

type InfoTab = "konvensional" | "syariah" | "subsidi";

function idNumber(value: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, "");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function calcPercent(numerator: number, denominator: number) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return clamp(Math.round((numerator / denominator) * 100), 0, 100);
}

const bankLogos = [
  { src: "/bank/BNI.png", name: "BNI" },
  { src: "/bank/BTN.png", name: "BTN" },
  { src: "/bank/Mandiri.png", name: "Mandiri" },
  { src: "/bank/CIMB.png", name: "CIMB Niaga" },
  { src: "/bank/Danamon.png", name: "Danamon" },
  { src: "/bank/Permata.png", name: "Permata" },
  { src: "/bank/ocbc.png", name: "OCBC" },
  { src: "/bank/UOB.png", name: "UOB" },
  { src: "/bank/Panin Bank.png", name: "Panin Bank" },
  { src: "/bank/Maybank.png", name: "Maybank" },
  { src: "/bank/Muamalat.png", name: "Bank Muamalat" },
  { src: "/bank/BSI Syariah.png", name: "BSI" },
  { src: "/bank/BCA Syariah.png", name: "BCA Syariah" },
  { src: "/bank/Bukopin.png", name: "Bukopin" },
];

function MortgagePageClient() {
  const searchParams = useSearchParams();
  const listingSlug = searchParams.get("listing");

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [infoTab, setInfoTab] = useState<InfoTab>("konvensional");
  const [productOpen, setProductOpen] = useState(false);
  const productWrapRef = useRef<HTMLDivElement | null>(null);

  const banksQuery = useQuery({
    queryKey: ["mortgage-banks"],
    queryFn: () => apiFetch<Bank[]>("/public/mortgage/banks"),
  });

  const productsQuery = useQuery({
    queryKey: ["mortgage-products"],
    queryFn: () => apiFetch<Product[]>("/public/mortgage/products"),
  });

  const defaultProductId = useMemo(() => productsQuery.data?.[0]?.id ?? "", [productsQuery.data]);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      productId: defaultProductId,
      propertyPrice: 1500000000,
      downPayment: 300000000,
      tenorMonths: 240,
      monthlyIncome: 20000000,
      additionalFees: 0,
    },
  });

  const productId = watch("productId");
  const propertyPrice = watch("propertyPrice");
  const downPayment = watch("downPayment");
  const dpPercent = useMemo(() => calcPercent(Number(downPayment), Number(propertyPrice)), [downPayment, propertyPrice]);
  const partnerBankCount = useMemo(() => {
    const set = new Set((productsQuery.data ?? []).map((p) => p.bank.id));
    return set.size;
  }, [productsQuery.data]);

  useEffect(() => {
    if (!defaultProductId) return;
    if (productId) return;
    setValue("productId", defaultProductId);
  }, [defaultProductId, productId, setValue]);

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

  const selectedProduct = useMemo(() => {
    return productsQuery.data?.find((p) => p.id === productId) ?? null;
  }, [productId, productsQuery.data]);

  const simulateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = schema.parse(values);
      return apiFetch<SimulationResult>("/public/mortgage/simulate", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          listingId: undefined,
        }),
      });
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (e) => {
      if (e instanceof ApiError) {
        setError(e.message);
        return;
      }
      setError("Terjadi kesalahan. Coba lagi.");
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setResult(null);
    try {
      schema.parse(values);
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.issues[0]?.message ?? "Data tidak valid");
        return;
      }
      setError("Data tidak valid");
      return;
    }

    await simulateMutation.mutateAsync(values);
  });

  return (
    <main className="bg-white">
      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-[520px] w-[520px] rounded-full bg-violet-500/14 blur-3xl" />
          <div className="absolute -right-24 -top-32 h-[520px] w-[520px] rounded-full bg-sky-500/14 blur-3xl" />
          <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.08)_1px,transparent_0)] [background-size:26px_26px] opacity-45" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-white" />
        </div>

        <Container className="relative max-w-6xl pb-12 pt-10 md:pb-16 md:pt-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
                ← Beranda
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4 text-violet-600" />
                Simulasi KPR Indonesia
              </div>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                Simulasi KPR Konvensional & Syariah
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
                Hitung estimasi cicilan bulanan, biaya awal, dan ringkasan pembiayaan berdasarkan produk bank yang
                dikonfigurasi di sistem Livinova.
              </p>
              {listingSlug ? <div className="text-sm text-slate-600">Listing: {listingSlug}</div> : null}
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 md:w-auto">
              <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-sky-600" />
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bank</div>
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {productsQuery.isLoading ? "—" : <CountUp value={partnerBankCount} />}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-violet-600" />
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Produk</div>
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {productsQuery.isLoading ? "—" : <CountUp value={productsQuery.data?.length ?? 0} />}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-emerald-600" />
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">DP</div>
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {dpPercent === null ? "—" : <CountUp value={dpPercent} suffix="%" />}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_420px]">
            <Card className="overflow-hidden border border-slate-200 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur">
              <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50">
                <CardTitle>Hitung Simulasi</CardTitle>
                <div className="mt-1 text-sm text-slate-600">Masukkan harga properti, DP, dan tenor.</div>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productId">Produk KPR</Label>
                    <Controller
                      control={control}
                      name="productId"
                      render={({ field }) => {
                        const selectedOption = productsQuery.data?.find((p) => p.id === field.value) ?? null;
                        const optionLabel = selectedOption ? `${selectedOption.bank.name} — ${selectedOption.name}` : "";

                        return (
                          <div ref={productWrapRef} className="relative">
                            <button
                              id="productId"
                              type="button"
                              onClick={() => setProductOpen((v) => !v)}
                              className="inline-flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-3 text-left text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              aria-haspopup="listbox"
                              aria-expanded={productOpen}
                            >
                              <span className="min-w-0 flex-1 truncate">
                                {optionLabel || "Pilih produk"}
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
                                  const active = field.value === p.id;
                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      role="option"
                                      aria-selected={active}
                                      onClick={() => {
                                        field.onChange(p.id);
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
                        );
                      }}
                    />
                    {selectedProduct ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        {selectedProduct.bank.isSharia ? (
                          <>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 ring-1 ring-emerald-200">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Syariah
                            </span>
                            <span>Margin {selectedProduct.shariaMargin ?? "—"}%</span>
                          </>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 font-semibold text-sky-800 ring-1 ring-sky-200">
                              <Banknote className="h-3.5 w-3.5" />
                              Konvensional
                            </span>
                            <span>Bunga promo {selectedProduct.promoInterestRate ?? "—"}%</span>
                            <span>•</span>
                            <span>Default {selectedProduct.defaultInterestRate ?? "—"}%</span>
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="propertyPrice">Harga Properti</Label>
                      <Controller
                        control={control}
                        name="propertyPrice"
                        render={({ field }) => (
                          <Input
                            id="propertyPrice"
                            className="h-11 rounded-xl"
                            inputMode="numeric"
                            value={idNumber(Number(field.value) || 0)}
                            onChange={(e) => {
                              const digits = digitsOnly(e.target.value);
                              field.onChange(digits ? Number(digits) : 0);
                            }}
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="downPayment">Uang Muka</Label>
                      <Controller
                        control={control}
                        name="downPayment"
                        render={({ field }) => (
                          <Input
                            id="downPayment"
                            className="h-11 rounded-xl"
                            inputMode="numeric"
                            value={idNumber(Number(field.value) || 0)}
                            onChange={(e) => {
                              const digits = digitsOnly(e.target.value);
                              field.onChange(digits ? Number(digits) : 0);
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const p = Number(propertyPrice);
                        if (!Number.isFinite(p) || p <= 0) return;
                        setValue("downPayment", Math.round(p * 0.2));
                      }}
                      className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-100"
                    >
                      DP 20%
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("tenorMonths", 180)}
                      className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-100"
                    >
                      15 tahun
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("tenorMonths", 240)}
                      className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-100"
                    >
                      20 tahun
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("tenorMonths", 300)}
                      className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-100"
                    >
                      25 tahun
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tenorMonths">Tenor (bulan)</Label>
                      <Input id="tenorMonths" className="h-11 rounded-xl" inputMode="numeric" {...register("tenorMonths")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthlyIncome">Penghasilan Bulanan (opsional)</Label>
                      <Controller
                        control={control}
                        name="monthlyIncome"
                        render={({ field }) => (
                          <Input
                            id="monthlyIncome"
                            className="h-11 rounded-xl"
                            inputMode="numeric"
                            value={field.value ? idNumber(Number(field.value) || 0) : ""}
                            onChange={(e) => {
                              const digits = digitsOnly(e.target.value);
                              field.onChange(digits ? Number(digits) : 0);
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalFees">Biaya Tambahan (opsional)</Label>
                    <Input id="additionalFees" className="h-11 rounded-xl" inputMode="numeric" {...register("additionalFees")} />
                  </div>

                  {productsQuery.isError ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      Produk KPR belum bisa dimuat. Silakan refresh.
                    </div>
                  ) : null}

                  {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
                  ) : null}

                  <Button
                    type="submit"
                    className="w-full bg-slate-900 text-white hover:bg-slate-800"
                    disabled={isSubmitting || simulateMutation.isPending}
                  >
                    {isSubmitting || simulateMutation.isPending ? "Menghitung..." : "Hitung Simulasi"}
                  </Button>
                </form>

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Bank Tersedia</h3>
                    <Link className="text-sm font-medium text-slate-900 hover:underline" href="/promo">
                      Lihat promo →
                    </Link>
                  </div>
                  {banksQuery.data ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {banksQuery.data.map((b) => (
                        <span
                          key={b.id}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200",
                            b.isSharia && "bg-emerald-50 text-emerald-800 ring-emerald-200",
                          )}
                        >
                          {b.isSharia ? <BadgeCheck className="h-3.5 w-3.5" /> : null}
                          {b.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-slate-600">Memuat daftar bank...</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-slate-200 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur">
              <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50">
                <CardTitle>Hasil Simulasi</CardTitle>
                <div className="mt-1 text-sm text-slate-600">Ringkasan cicilan dan biaya awal.</div>
              </CardHeader>
              <CardContent className="space-y-5">
                {!result ? (
                  <div className="text-sm text-slate-600">Masukkan data lalu klik “Hitung Simulasi”.</div>
                ) : (
                  <>
                    <div>
                      <div className="text-sm text-slate-500">Produk</div>
                      <div className="mt-1 font-semibold text-slate-900">
                        {result.bank.name} — {result.product.name}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimasi Cicilan Bulanan</div>
                      <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                        {formatRupiah(result.outputs.monthlyInstallment)}
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        Total perkiraan pembayaran: <span className="font-semibold text-slate-900">{formatRupiah(result.outputs.estimatedTotalPayment)}</span>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-sm text-slate-500">Total Pembiayaan</div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">{formatRupiah(result.derived.financing)}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-sm text-slate-500">Total Uang Muka + Biaya</div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">{formatRupiah(result.derived.totalDownPayment)}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-slate-900">Rincian Biaya</div>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <dt className="text-slate-500">Administrasi</dt>
                          <dd className="font-semibold text-slate-900">{formatRupiah(result.derived.fees.adminFee)}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <dt className="text-slate-500">Notaris (estimasi)</dt>
                          <dd className="font-semibold text-slate-900">{formatRupiah(result.derived.fees.notaryFeeEstimate)}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <dt className="text-slate-500">Provisi</dt>
                          <dd className="font-semibold text-slate-900">{formatRupiah(result.derived.fees.provisi)}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <dt className="text-slate-500">Asuransi (estimasi)</dt>
                          <dd className="font-semibold text-slate-900">{formatRupiah(result.derived.fees.insurance)}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <dt className="text-slate-500">Biaya tambahan</dt>
                          <dd className="font-semibold text-slate-900">{formatRupiah(result.derived.fees.additionalFees)}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3">
                          <dt className="text-slate-500">Total biaya</dt>
                          <dd className="text-base font-semibold text-slate-900">{formatRupiah(result.derived.fees.totalFees)}</dd>
                        </div>
                      </dl>
                    </div>

                    {result.outputs.affordabilityRatio !== null ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
                        Rasio cicilan/penghasilan:{" "}
                        <span className="font-semibold text-slate-900">{(result.outputs.affordabilityRatio * 100).toFixed(1)}%</span>
                      </div>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      <section className="py-10 md:py-14">
        <Container className="max-w-6xl">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Panduan KPR Indonesia</h2>
              <p className="mt-1 text-sm text-slate-600">
                Ringkasan konsep KPR konvensional, syariah, dan program subsidi. Konten mengacu pada sumber resmi.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setInfoTab("konvensional")}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition",
                  infoTab === "konvensional"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                )}
              >
                Konvensional
              </button>
              <button
                type="button"
                onClick={() => setInfoTab("syariah")}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition",
                  infoTab === "syariah"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                )}
              >
                Syariah
              </button>
              <button
                type="button"
                onClick={() => setInfoTab("subsidi")}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition",
                  infoTab === "subsidi"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                )}
              >
                Subsidi Pemerintah
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
            <Card className="shadow-sm">
              <CardContent className="space-y-4 pt-6">
                {infoTab === "konvensional" ? (
                  <>
                    <div className="flex items-start gap-3">
                      <Banknote className="mt-0.5 h-5 w-5 text-sky-600" />
                      <div>
                        <div className="text-sm font-semibold text-slate-900">KPR Konvensional</div>
                        <div className="mt-1 text-sm text-slate-700">
                          Umumnya menggunakan suku bunga (fixed/floating) sesuai kebijakan bank, dengan cicilan bulanan
                          berdasarkan metode anuitas atau metode lain yang ditetapkan bank.
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Komponen biaya awal</div>
                        <div className="mt-2 text-sm text-slate-700">Admin, provisi, asuransi, notaris/PPAT, appraisal, biaya lain.</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risiko yang perlu dipahami</div>
                        <div className="mt-2 text-sm text-slate-700">Perubahan bunga floating, penalti pelunasan dipercepat, dan biaya tambahan.</div>
                      </div>
                    </div>
                  </>
                ) : null}

                {infoTab === "syariah" ? (
                  <>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                      <div>
                        <div className="text-sm font-semibold text-slate-900">KPR Syariah</div>
                        <div className="mt-1 text-sm text-slate-700">
                          Pembiayaan rumah menggunakan prinsip syariah (akad). Contoh akad yang umum: murabahah (jual-beli)
                          dan musyarakah mutanaqisah (kepemilikan bertahap). OJK menerbitkan pedoman produk pembiayaan syariah.
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
                        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Murabahah</div>
                        <div className="mt-2 text-sm text-emerald-900">
                          Skema jual-beli: bank membeli aset lalu menjual ke nasabah dengan margin yang disepakati.
                        </div>
                      </div>
                      <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
                        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Musyarakah Mutanaqisah</div>
                        <div className="mt-2 text-sm text-emerald-900">
                          Kepemilikan aset bertahap: porsi bank berkurang seiring pembayaran nasabah.
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">
                      Sumber resmi:{" "}
                      <a
                        className="font-semibold text-slate-900 hover:underline"
                        href="https://ojk.go.id/id/kanal/syariah/berita-dan-kegiatan/publikasi/Pages/Buku-Standar-Produk-Musyarakah-dan-Musyarakah-Mutanaqishah.aspx"
                        target="_blank"
                        rel="noreferrer"
                      >
                        OJK — Pedoman Produk Pembiayaan Musyarakah
                      </a>
                    </div>
                  </>
                ) : null}

                {infoTab === "subsidi" ? (
                  <>
                    <div className="flex items-start gap-3">
                      <BadgeCheck className="mt-0.5 h-5 w-5 text-violet-600" />
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Program KPR Bersubsidi</div>
                        <div className="mt-1 text-sm text-slate-700">
                          Pemerintah memiliki program pembiayaan perumahan untuk MBR (contoh: skema FLPP). Persyaratan
                          dapat berubah mengikuti regulasi yang berlaku.
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contoh syarat umum (MBR)</div>
                      <div className="mt-2 text-sm text-slate-700">
                        WNI, usia minimal 21 tahun atau sudah menikah, belum memiliki rumah, belum pernah menerima subsidi
                        perumahan, dan memenuhi ketentuan penghasilan sesuai program.
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">
                      Sumber rujukan:{" "}
                      <a
                        className="font-semibold text-slate-900 hover:underline"
                        href="https://indonesia.go.id/kategori/kependudukan/2391/syarat-mengajukan-kpr-bersubsidi"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Portal Informasi Indonesia — Syarat Mengajukan KPR Bersubsidi
                      </a>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>FAQ Singkat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <details className="rounded-2xl border border-slate-200 bg-white p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-900">
                    Apa beda konvensional vs syariah?
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </summary>
                  <div className="mt-3 text-sm text-slate-700">
                    Konvensional umumnya berbasis suku bunga. Syariah menggunakan akad dan margin/nisbah sesuai kesepakatan,
                    mengikuti prinsip syariah dan pedoman regulator.
                  </div>
                </details>
                <details className="rounded-2xl border border-slate-200 bg-white p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-900">
                    Apa saja biaya awal KPR?
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </summary>
                  <div className="mt-3 text-sm text-slate-700">
                    Umumnya meliputi provisi, administrasi, notaris/PPAT, asuransi, appraisal, dan biaya lain sesuai bank.
                  </div>
                </details>
                <details className="rounded-2xl border border-slate-200 bg-white p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-900">
                    Apakah hasil simulasi ini final?
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </summary>
                  <div className="mt-3 text-sm text-slate-700">
                    Tidak. Hasil simulasi adalah estimasi. Persetujuan dan angka final mengikuti analisis kredit dan kebijakan bank.
                  </div>
                </details>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <CircleHelp className="mt-0.5 h-5 w-5 text-slate-900" />
                  <div className="text-sm text-slate-700">
                    Butuh bantuan? Buka simulator lengkap dan bandingkan produk bank yang tersedia di sistem.
                    <div className="mt-2">
                      <Link className="font-semibold text-slate-900 hover:underline" href="/kpr">
                        Lihat opsi produk →
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bank Partner</div>
                <div className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Logo Bank (Demo)</div>
              </div>
              <div className="text-sm text-slate-600">
                <CountUp value={10000} suffix="+" /> simulasi • <CountUp value={100000} suffix="+" /> pencarian •{" "}
                <CountUp value={1000000} suffix="+" /> impresi
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {bankLogos.map((b) => (
                <div
                  key={b.src}
                  className="flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 shadow-[0_1px_0_rgba(15,23,42,0.08)]"
                >
                  <Image src={b.src} alt={`Logo ${b.name}`} width={160} height={64} className="h-8 w-auto object-contain opacity-90" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default function MortgagePage() {
  return (
    <Suspense
      fallback={
        <main className="py-10">
          <Container className="max-w-5xl">
            <div className="text-sm text-slate-600">Memuat halaman...</div>
          </Container>
        </main>
      }
    >
      <MortgagePageClient />
    </Suspense>
  );
}

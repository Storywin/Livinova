import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Star } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

type ListingSpecs = {
  floors?: number | null;
  certificate?: "SHM" | "HGB" | "HGU" | string | null;
} | null;

type PublicListingItem = {
  id: string;
  title: string;
  slug: string;
  featured: boolean;
  sponsored: boolean;
  verificationStatus: string;
  price: string | null;
  startingPrice: string | null;
  specs: ListingSpecs;
  images: Array<{ id: string; url: string; kind: string }>;
  unit: {
    bedrooms: number | null;
    bathrooms: number | null;
    buildingSize: number | null;
    landSize: number | null;
    availableUnits: number | null;
    propertyType: string;
  } | null;
  project: {
    name: string;
    slug: string;
    status: string;
    developer: { name: string; slug: string };
    location: { city: string | null; area: string | null; province: string | null } | null;
  };
  averageRating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
};

type PublicListingsResponse = {
  items: PublicListingItem[];
};

type MortgageProduct = {
  id: string;
};

type MortgageSimulationResult = {
  outputs: { monthlyInstallment: number };
};

function getDeveloperLogo(slug: string) {
  if (slug === "nusantara-properti") return "/developers/nusantara-properti.svg";
  if (slug === "bali-smart-living") return "/developers/bali-smart-living.svg";
  if (slug === "demo-developer-pending") return "/developers/demo-developer-pending.svg";
  return "/developers/default.svg";
}

function formatDateShort(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

const chip3dClass =
  "inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-800 ring-1 ring-white/30 shadow-[0_1px_0_rgba(15,23,42,0.10)] backdrop-blur transition will-change-transform hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-sky-600 hover:to-cyan-500 hover:text-white hover:shadow-[0_10px_20px_rgba(2,132,199,0.25)]";

function SpecTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="group/tile rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-200 shadow-[0_1px_0_rgba(15,23,42,0.10)] transition will-change-transform hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-sky-600 hover:to-cyan-500 hover:ring-sky-200 hover:shadow-[0_10px_20px_rgba(2,132,199,0.25)]">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 group-hover/tile:text-white/85">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-slate-900 group-hover/tile:text-white">{value}</div>
    </div>
  );
}

export async function FeaturedListings() {
  let items: PublicListingItem[] = [];
  let productId: string | null = null;
  let isApiAvailable = true;

  try {
    const data = await apiFetch<PublicListingsResponse>("/public/listings?sort=featured&page=1&pageSize=6");
    items = data.items ?? [];
    const products = await apiFetch<MortgageProduct[]>("/public/mortgage/products");
    productId = products[0]?.id ?? null;
  } catch {
    isApiAvailable = false;
    items = [];
    productId = null;
  }

  const kprByListingId = new Map<string, { monthlyInstallment: number; tenorMonths: number }>();
  if (productId) {
    const tenorMonths = 240;
    const results = await Promise.all(
      items.map(async (item) => {
        const rawPrice = item.price ?? item.startingPrice;
        const propertyPrice = rawPrice ? Number(rawPrice) : 0;
        const downPayment = Math.round(propertyPrice * 0.2);
        if (!propertyPrice) return { id: item.id, monthlyInstallment: null };

        const sim = await apiFetch<MortgageSimulationResult>("/public/mortgage/simulate", {
          method: "POST",
          body: JSON.stringify({
            productId,
            propertyPrice,
            downPayment,
            tenorMonths,
          }),
        });

        return { id: item.id, monthlyInstallment: sim.outputs.monthlyInstallment };
      }),
    );

    for (const r of results) {
      if (typeof r.monthlyInstallment === "number") {
        kprByListingId.set(r.id, { monthlyInstallment: r.monthlyInstallment, tenorMonths });
      }
    }
  }

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Proyek Unggulan</h2>
            <p className="mt-1 text-sm text-slate-600">
              Rekomendasi properti Smart Living terverifikasi dengan presentasi premium.
            </p>
          </div>
          <Link className="text-sm font-medium text-slate-900 hover:underline" href="/properti?sort=featured&page=1">
            Lihat semua →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {items.map((item) => {
            const cover = item.images?.[0]?.url ?? "/properties/livinova-residence-tipe-a.svg";
            const devLogo = getDeveloperLogo(item.project.developer.slug);
            const unitsLeft = item.unit?.availableUnits ?? null;
            const floors = item.specs?.floors ?? null;
            const certificate = item.specs?.certificate ?? null;
            const kt = item.unit?.bedrooms ?? null;
            const km = item.unit?.bathrooms ?? null;
            const lt = item.unit?.landSize ?? null;
            const lb = item.unit?.buildingSize ?? null;
            const kpr = kprByListingId.get(item.id) ?? null;

            const priceText = formatRupiah(item.price ?? item.startingPrice);
            const kecamatan = item.project.location?.area ?? null;
            const kabupaten = item.project.location?.city ?? null;
            const locationText = [kecamatan, kabupaten].filter((v) => typeof v === "string" && v.length > 0).join(", ");

            return (
              <Link key={item.id} href={`/properti/${item.slug}`} className="group">
                <Card className="h-full overflow-hidden shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                  <div className="relative aspect-[16/10] w-full">
                    <Image
                      src={cover}
                      alt={item.title}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover"
                      priority={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-slate-950/0 to-slate-950/0" />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      {unitsLeft !== null ? (
                        <span className={chip3dClass}>Sisa {unitsLeft} unit</span>
                      ) : null}
                      {certificate ? (
                        <span className={chip3dClass}>{certificate}</span>
                      ) : null}
                    </div>
                    {item.featured || item.sponsored ? (
                      <div className="absolute bottom-4 right-4 flex flex-row flex-wrap items-center justify-end gap-2">
                        {item.featured ? <span className={chip3dClass}>Unggulan</span> : null}
                        {item.sponsored ? <span className={chip3dClass}>Sponsor</span> : null}
                      </div>
                    ) : null}
                  </div>

                  <CardContent className="space-y-5 pt-5">
                    <div className="flex items-center gap-3">
                      <Image
                        src={devLogo}
                        alt={item.project.developer.name}
                        width={44}
                        height={44}
                        className="h-11 w-11 shrink-0 rounded-2xl bg-white p-1.5 ring-1 ring-slate-200 shadow-[0_1px_0_rgba(15,23,42,0.10)]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold tracking-tight text-slate-900">
                              {item.project.name}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                            <span className="truncate">{item.project.developer.name}</span>
                            {item.verificationStatus === "approved" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="Terverifikasi" />
                            ) : null}
                          </div>
                          {locationText ? <div className="mt-1 text-xs text-slate-500">{locationText}</div> : null}
                          
                          {item.ratingCount > 0 && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={cn(
                                      "h-3 w-3",
                                      s <= Math.round(item.averageRating)
                                        ? "fill-amber-400 text-amber-400"
                                        : "fill-slate-100 text-slate-200"
                                    )}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] font-bold text-slate-900">{item.averageRating.toFixed(1)}</span>
                              <span className="text-[10px] text-slate-400">({item.ratingCount})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Harga</div>
                        <div className="text-base font-semibold tracking-tight text-slate-900">{priceText}</div>
                      </div>
                      {kpr ? (
                        <div className="mt-2 flex items-start justify-between gap-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">KPR mulai dari</div>
                          <div className="text-right text-sm font-medium text-slate-900">
                            {formatRupiah(kpr.monthlyInstallment)}/bulan
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <SpecTile
                        label="Tipe"
                        value={item.unit?.propertyType ? item.unit.propertyType.toUpperCase() : "PROPERTI"}
                      />
                      {lt ? <SpecTile label="LT" value={`${lt} m²`} /> : null}
                      {lb ? <SpecTile label="LB" value={`${lb} m²`} /> : null}
                      {floors ? <SpecTile label="Lantai" value={`${floors}`} /> : null}
                      {kt ? <SpecTile label="KT" value={`${kt}`} /> : null}
                      {km ? <SpecTile label="KM" value={`${km}`} /> : null}
                    </div>

                    <div className="flex items-center justify-end border-t border-slate-200 pt-3 text-xs text-slate-500">
                      <div className="text-right">
                        <div>Online: {formatDateShort(item.createdAt)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}


          {items.length === 0 ? (
            <Card className="shadow-sm md:col-span-3">
              <CardContent className="py-8 text-sm text-slate-600">
                {isApiAvailable ? "Belum ada data unggulan." : "Sedang memuat data proyek unggulan. Coba refresh sebentar lagi."}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </section>
  );
}

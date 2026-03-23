import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

import { ListingFilters } from "@/components/listings/listing-filters";
import { Card, CardContent } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { apiFetch } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

type SearchParams = Record<string, string | string[] | undefined>;

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
  recommended: boolean;
  verificationStatus?: string;
  price: string | null;
  startingPrice: string | null;
  specs?: ListingSpecs;
  images?: Array<{ id: string; url: string; kind: string }>;
  unit: {
    bedrooms: number | null;
    bathrooms?: number | null;
    buildingSize?: number | null;
    landSize?: number | null;
    availableUnits?: number | null;
    propertyType: string;
  } | null;
  project: {
    name: string;
    slug: string;
    status: string;
    developer: { name: string; slug: string };
    location: { city: string | null; area: string | null; province: string | null } | null;
  };
  createdAt?: string;
  updatedAt?: string;
};

type PublicListingsResponse = {
  items: PublicListingItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

function pickFirst(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0];
  return v;
}

function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  return envUrl && envUrl.trim() ? envUrl.trim().replace(/\/$/, "") : "http://localhost:3000";
}

function buildQuery(searchParams: SearchParams) {
  const qp = new URLSearchParams();
  const keys = ["q", "city", "area", "developerSlug", "propertyType", "bedrooms", "minPrice", "maxPrice", "sort", "page"];
  for (const k of keys) {
    const val = pickFirst(searchParams[k]);
    if (val && val.trim()) qp.set(k, val);
  }
  qp.set("pageSize", "12");
  return qp.toString();
}

function pageLink(searchParams: SearchParams, nextPage: number) {
  const qp = new URLSearchParams(buildQuery(searchParams));
  qp.set("page", String(nextPage));
  return `/properti?${qp.toString()}`;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const sp = await searchParams;
  const qs = buildQuery(sp);
  const qp = new URLSearchParams(qs);
  const page = Number(qp.get("page") ?? "1") || 1;
  const title = page > 1 ? `Properti Smart Living (Halaman ${page}) — Livinova` : "Properti Smart Living — Livinova";
  const description =
    "Jelajahi listing properti Smart Living terverifikasi dari developer terpercaya. Cari berdasarkan kota, area, atau nama developer.";
  const siteUrl = getSiteUrl();
  const canonical = qs ? `/properti?${qs}` : "/properti";

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: "Livinova",
      images: ["/logo.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

function chipClass() {
  return "rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-800 ring-1 ring-white/25 shadow-[0_1px_0_rgba(15,23,42,0.10)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-sky-600 hover:to-cyan-500 hover:text-white hover:shadow-[0_10px_20px_rgba(2,132,199,0.25)]";
}

function formatDateShort(iso: string | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function getDeveloperLogo(slug: string) {
  if (slug === "nusantara-properti") return "/developers/nusantara-properti.svg";
  if (slug === "bali-smart-living") return "/developers/bali-smart-living.svg";
  if (slug === "demo-developer-pending") return "/developers/demo-developer-pending.svg";
  return "/developers/default.svg";
}

function Pagination({
  currentPage,
  totalPages,
  makeLink,
}: {
  currentPage: number;
  totalPages: number;
  makeLink: (p: number) => string;
}) {
  const pages: Array<number | "ellipsis"> = [];
  const add = (p: number | "ellipsis") => pages.push(p);

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) add(i);
  } else {
    add(1);
    if (currentPage > 3) add("ellipsis");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i += 1) add(i);
    if (currentPage < totalPages - 2) add("ellipsis");
    add(totalPages);
  }

  return (
    <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
      <div className="text-sm text-slate-600">
        Halaman <span className="font-semibold text-slate-900">{currentPage}</span> dari{" "}
        <span className="font-semibold text-slate-900">{totalPages}</span>
      </div>
      <div className="flex items-center gap-2">
        <Link
          aria-disabled={currentPage <= 1}
          href={makeLink(Math.max(1, currentPage - 1))}
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50",
            currentPage <= 1 && "pointer-events-none opacity-50",
          )}
        >
          ← Sebelumnya
        </Link>

        <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-3 text-sm font-semibold text-white shadow-sm md:hidden">
          {currentPage}
        </span>

        <div className="hidden items-center gap-2 md:flex">
          {pages.map((p, idx) =>
            p === "ellipsis" ? (
              <span key={`e-${idx}`} className="px-2 text-sm text-slate-400">
                …
              </span>
            ) : (
              <Link
                key={p}
                href={makeLink(p)}
                aria-current={p === currentPage ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold shadow-sm transition",
                  p === currentPage
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                )}
              >
                {p}
              </Link>
            ),
          )}
        </div>

        <Link
          aria-disabled={currentPage >= totalPages}
          href={makeLink(Math.min(totalPages, currentPage + 1))}
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50",
            currentPage >= totalPages && "pointer-events-none opacity-50",
          )}
        >
          Berikutnya →
        </Link>
      </div>
    </div>
  );
}

export default async function PropertyListingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const qs = buildQuery(sp);
  let data: PublicListingsResponse | null = null;
  try {
    data = await apiFetch<PublicListingsResponse>(`/public/listings?${qs}`);
  } catch {
    data = null;
  }

  const siteUrl = getSiteUrl();
  const jsonLd =
    data && data.items.length > 0
      ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Beranda", item: `${siteUrl}/` },
                { "@type": "ListItem", position: 2, name: "Properti", item: `${siteUrl}/properti` },
              ],
            },
            {
              "@type": "ItemList",
              name: "Daftar Properti Livinova",
              itemListElement: data.items.map((item, index) => ({
                "@type": "ListItem",
                position: (data?.page ? (data.page - 1) * data.pageSize : 0) + index + 1,
                url: `${siteUrl}/properti/${item.slug}`,
                name: item.project?.name ?? item.title,
              })),
            },
          ],
        }
      : null;

  return (
    <main className="bg-white">
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}

      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-24 h-[520px] w-[520px] rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute -right-20 -top-16 h-[520px] w-[520px] rounded-full bg-slate-900/12 blur-3xl" />
          <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.08)_1px,transparent_0)] [background-size:24px_24px] opacity-50" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-white" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-8 md:pb-20 md:pt-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
                ← Beranda
              </Link>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                Properti Smart Living
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
                Jelajahi listing terverifikasi dari developer terpercaya. Bandingkan lokasi, harga, dan spesifikasi
                dalam tampilan premium.
              </p>
            </div>
            <div className="text-sm text-slate-600">
              Total:{" "}
              <span className="font-semibold text-slate-900">
                {data ? <CountUp value={data.totalItems} /> : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6">
          <ListingFilters
            className="-mt-8 bg-white/92 shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur"
            initial={{
              q: pickFirst(sp.q),
              city: pickFirst(sp.city),
              area: pickFirst(sp.area),
            }}
          />
          <div className="h-10 md:h-12" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        {!data ? (
          <Card className="shadow-sm">
            <CardContent className="py-8 text-sm text-slate-600">
              Data properti sedang tidak tersedia. Silakan refresh beberapa saat lagi.
            </CardContent>
          </Card>
        ) : data.items.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-8 text-sm text-slate-600">
              Tidak ada listing yang cocok. Coba ubah kata kunci atau lokasi.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                Menampilkan <span className="font-semibold text-slate-900">{data.items.length}</span> dari{" "}
                <span className="font-semibold text-slate-900">
                  <CountUp value={data.totalItems} />
                </span>{" "}
                listing
              </div>
              <div className="text-sm text-slate-500">Halaman {data.page}</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((item) => {
                const cover = item.images?.[0]?.url ?? "/properties/livinova-residence-tipe-a.svg";
                const devLogo = getDeveloperLogo(item.project.developer.slug);
                const priceText = formatRupiah(item.price ?? item.startingPrice);

                const kecamatan = item.project.location?.area ?? null;
                const kabupaten = item.project.location?.city ?? null;
                const locationText = [kecamatan, kabupaten].filter((v) => typeof v === "string" && v.length > 0).join(", ");

                const floors = item.specs?.floors ?? null;
                const certificate = item.specs?.certificate ?? null;
                const kt = item.unit?.bedrooms ?? null;
                const km = item.unit?.bathrooms ?? null;
                const lt = item.unit?.landSize ?? null;
                const lb = item.unit?.buildingSize ?? null;

                return (
                  <Link key={item.id} href={`/properti/${item.slug}`} className="group">
                    <Card className="h-full overflow-hidden shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                      <div className="relative aspect-[16/10] w-full bg-slate-50">
                        <Image src={cover} alt={item.project.name} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-slate-950/0 to-slate-950/0" />
                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                          {item.unit?.availableUnits !== null && item.unit?.availableUnits !== undefined ? (
                            <span className={chipClass()}>Sisa {item.unit.availableUnits} unit</span>
                          ) : null}
                          {certificate ? <span className={chipClass()}>{certificate}</span> : null}
                        </div>
                        {item.featured || item.sponsored ? (
                          <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
                            {item.featured ? <span className={chipClass()}>Unggulan</span> : null}
                            {item.sponsored ? <span className={chipClass()}>Sponsor</span> : null}
                          </div>
                        ) : null}
                      </div>

                      <CardContent className="space-y-4 pt-5">
                        <div className="flex items-center gap-3">
                          <Image
                            src={devLogo}
                            alt={item.project.developer.name}
                            width={44}
                            height={44}
                            className="h-11 w-11 shrink-0 rounded-2xl bg-white p-1.5 ring-1 ring-slate-200 shadow-[0_1px_0_rgba(15,23,42,0.10)]"
                          />
                          <div className="min-w-0 flex-1">
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
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Harga</div>
                            <div className="text-base font-semibold tracking-tight text-slate-900">{priceText}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-200 shadow-[0_1px_0_rgba(15,23,42,0.10)]">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Tipe</div>
                            <div className="mt-0.5 text-sm font-semibold text-slate-900">
                              {item.unit?.propertyType ? item.unit.propertyType.toUpperCase() : "PROPERTI"}
                            </div>
                          </div>
                          {lt ? (
                            <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-200 shadow-[0_1px_0_rgba(15,23,42,0.10)]">
                              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">LT</div>
                              <div className="mt-0.5 text-sm font-semibold text-slate-900">{lt} m²</div>
                            </div>
                          ) : null}
                          {lb ? (
                            <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-200 shadow-[0_1px_0_rgba(15,23,42,0.10)]">
                              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">LB</div>
                              <div className="mt-0.5 text-sm font-semibold text-slate-900">{lb} m²</div>
                            </div>
                          ) : null}
                          {floors ? (
                            <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-200 shadow-[0_1px_0_rgba(15,23,42,0.10)]">
                              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Lantai</div>
                              <div className="mt-0.5 text-sm font-semibold text-slate-900">{floors}</div>
                            </div>
                          ) : null}
                          {kt ? (
                            <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-200 shadow-[0_1px_0_rgba(15,23,42,0.10)]">
                              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">KT</div>
                              <div className="mt-0.5 text-sm font-semibold text-slate-900">{kt}</div>
                            </div>
                          ) : null}
                          {km ? (
                            <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-200 shadow-[0_1px_0_rgba(15,23,42,0.10)]">
                              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">KM</div>
                              <div className="mt-0.5 text-sm font-semibold text-slate-900">{km}</div>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex items-center justify-end border-t border-slate-200 pt-3 text-xs text-slate-500">
                          <div className="text-right">Online: {formatDateShort(item.createdAt)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            <Pagination currentPage={data.page} totalPages={data.totalPages} makeLink={(p) => pageLink(sp, p)} />
          </>
        )}
      </section>
    </main>
  );
}

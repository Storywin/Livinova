import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Bath,
  BedDouble,
  Blocks,
  Building2,
  CalendarClock,
  Camera,
  CheckCircle2,
  Cpu,
  Home,
  LandPlot,
  Lightbulb,
  MapPin,
  MessagesSquare,
  Ruler,
  Shield,
  ShieldCheck,
  Sparkles,
  ThermometerSun,
  Wand2,
  Wifi,
  Zap,
} from "lucide-react";

import { Container } from "@/components/site/container";
import { PropertyMediaGallery } from "@/components/listings/property-media-gallery";
import { Property3DPreview } from "@/components/listings/property-3d-preview";
import { ShareButton } from "@/components/listings/share-button";
import { WishlistButton } from "@/components/listings/wishlist-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionTabs } from "@/components/ui/section-tabs";
import { apiFetch } from "@/lib/api";
import { formatRupiah } from "@/lib/format";

type ListingDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: string | null;
  startingPrice: string | null;
  featured: boolean;
  sponsored: boolean;
  recommended: boolean;
  status: string;
  verificationStatus: string;
  unit: {
    title: string;
    propertyType: string;
    bedrooms: number | null;
    bathrooms: number | null;
    buildingSize: number | null;
    landSize: number | null;
    availableUnits: number | null;
  } | null;
  project: {
    name: string;
    slug: string;
    status: string;
    smartReadiness: string;
    verificationStatus: string;
    location: {
      address: string | null;
      city: string | null;
      area: string | null;
      province: string | null;
      postalCode: string | null;
      latitude: number | null;
      longitude: number | null;
    } | null;
    developer: {
      name: string;
      slug: string;
      verificationStatus: string;
    };
  };
  images: Array<{ id: string; url: string; kind: string; sortOrder: number }>;
  smartFeatures: Array<{ id: string; name: string; slug: string; category: string }>;
  createdAt: string;
  updatedAt: string;
};

async function getListing(slug: string) {
  return apiFetch<ListingDetail | null>(`/public/listings/${slug}`);
}

type DeveloperPublic = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  contactPersonName: string | null;
  contactPersonEmail: string | null;
  contactPersonPhone: string | null;
  verificationStatus: string;
  projects: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    smartReadiness: string;
    verificationStatus: string;
    startingPrice: string | null;
    location: { city: string | null; area: string | null; province: string | null } | null;
  }>;
};

async function getDeveloper(slug: string) {
  return apiFetch<DeveloperPublic | null>(`/public/developers/${slug}`);
}

type PublicListingsResponse = {
  items: Array<{
    id: string;
    slug: string;
    title: string;
    price: string | null;
    startingPrice: string | null;
    featured: boolean;
    sponsored: boolean;
    verificationStatus: string;
    specs?: { floors?: number | null; certificate?: string | null } | null;
    images?: Array<{ id: string; url: string; kind: string }>;
    project: {
      name: string;
      developer: { name: string; slug: string };
      location: { city: string | null; area: string | null; province: string | null } | null;
    };
    unit: {
      propertyType: string;
      bedrooms: number | null;
      bathrooms: number | null;
      buildingSize: number | null;
      landSize: number | null;
      availableUnits?: number | null;
    } | null;
    createdAt: string;
  }>;
};

async function getRelatedListings(developerSlug: string, currentSlug: string) {
  try {
    const res = await apiFetch<PublicListingsResponse>(`/public/listings?developerSlug=${developerSlug}&page=1&pageSize=6&sort=newest`);
    return res.items.filter((x) => x.slug !== currentSlug).slice(0, 3);
  } catch {
    return [];
  }
}

type MortgageProduct = { id: string; name: string; bank: { name: string; isSharia: boolean } };
type MortgageSimulationResult = { outputs: { monthlyInstallment: number } };

async function getKprEstimate(propertyPrice: number) {
  try {
    const products = await apiFetch<MortgageProduct[]>("/public/mortgage/products");
    const productId = products?.[0]?.id ?? null;
    if (!productId) return null;
    const sim = await apiFetch<MortgageSimulationResult>("/public/mortgage/simulate", {
      method: "POST",
      body: JSON.stringify({ productId, propertyPrice, downPayment: Math.round(propertyPrice * 0.2), tenorMonths: 240 }),
    });
    return { monthlyInstallment: sim.outputs.monthlyInstallment, bankName: products[0]!.bank.name, isSharia: products[0]!.bank.isSharia };
  } catch {
    return null;
  }
}

function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  return envUrl && envUrl.trim() ? envUrl.trim().replace(/\/$/, "") : "http://localhost:3000";
}

function formatDateShort(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function addressLine(loc: ListingDetail["project"]["location"]) {
  if (!loc) return "Lokasi belum tersedia";
  const parts = [loc.address, loc.area, loc.city, loc.province, loc.postalCode].filter(
    (v) => typeof v === "string" && v.trim().length > 0,
  );
  return parts.length ? parts.join(", ") : "Lokasi belum tersedia";
}

function cityArea(loc: ListingDetail["project"]["location"]) {
  if (!loc) return "";
  const parts = [loc.area, loc.city].filter((v) => typeof v === "string" && v.trim().length > 0);
  return parts.join(", ");
}

function mapEmbedUrl(loc: ListingDetail["project"]["location"]) {
  if (!loc) return null;
  if (typeof loc.latitude === "number" && typeof loc.longitude === "number") {
    return `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}&z=15&output=embed`;
  }
  const q = addressLine(loc);
  if (!q || q === "Lokasi belum tersedia") return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
}

function constructionStage(projectStatus: string) {
  const s = (projectStatus || "").toLowerCase();
  if (s.includes("plan") || s.includes("pre") || s.includes("draft")) return "planning" as const;
  if (s.includes("build") || s.includes("construct") || s.includes("progress")) return "construction" as const;
  return "handover" as const;
}

function getDeveloperLogo(slug: string) {
  if (slug === "nusantara-properti") return "/developers/nusantara-properti.svg";
  if (slug === "bali-smart-living") return "/developers/bali-smart-living.svg";
  if (slug === "demo-developer-pending") return "/developers/demo-developer-pending.svg";
  return "/developers/default.svg";
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

function hashString(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function svgDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function demoPhotoDataUri(seed: number, index: number) {
  const a = (seed + index * 97) % 360;
  const b = (seed + index * 173 + 40) % 360;
  const label = `Foto ${index + 1}`;
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="hsl(${a} 85% 55%)" stop-opacity="0.28"/>
        <stop offset="1" stop-color="hsl(${b} 85% 55%)" stop-opacity="0.18"/>
      </linearGradient>
      <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.22"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="24" stdDeviation="26" flood-color="#0f172a" flood-opacity="0.18"/>
      </filter>
    </defs>
    <rect width="1600" height="1000" fill="url(#bg)"/>
    <rect width="1600" height="1000" fill="#0f172a" fill-opacity="0.10"/>
    <g opacity="0.95" filter="url(#shadow)">
      <rect x="140" y="120" width="1320" height="760" rx="44" fill="#ffffff" fill-opacity="0.12"/>
      <rect x="180" y="160" width="1240" height="680" rx="38" fill="#ffffff" fill-opacity="0.10"/>
      <path d="M200 720 C420 610, 540 650, 690 560 C820 480, 980 470, 1160 520 C1320 565, 1400 620, 1420 650 L1420 840 L200 840 Z" fill="#0ea5e9" fill-opacity="0.12"/>
      <path d="M200 650 C380 560, 520 580, 680 520 C820 465, 980 430, 1160 460 C1320 482, 1400 520, 1420 550 L1420 620 C1390 590, 1260 530, 1150 520 C980 500, 850 520, 720 600 C560 700, 420 690, 260 770 Z" fill="#22c55e" fill-opacity="0.10"/>
      <rect x="220" y="200" width="520" height="300" rx="28" fill="#0f172a" fill-opacity="0.18"/>
      <rect x="760" y="200" width="640" height="200" rx="28" fill="#0f172a" fill-opacity="0.14"/>
      <rect x="760" y="420" width="640" height="260" rx="28" fill="#0f172a" fill-opacity="0.10"/>
      <rect x="220" y="520" width="520" height="160" rx="28" fill="#0f172a" fill-opacity="0.12"/>
    </g>
    <rect x="160" y="140" width="1280" height="10" rx="5" fill="url(#shine)" opacity="0.9"/>
    <g>
      <rect x="1200" y="78" width="280" height="44" rx="22" fill="#ffffff" fill-opacity="0.70"/>
      <text x="1340" y="107" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="18" font-weight="700" fill="#0f172a" text-anchor="middle">${label}</text>
    </g>
  </svg>`;
  return svgDataUri(svg);
}

function demoFloorplanDataUri(seed: number, index: number) {
  const a = (seed + index * 127) % 360;
  const title = index === 0 ? "Denah Unit" : "Denah Lokasi";
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="1" stop-color="hsl(${a} 90% 92%)"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.14"/>
      </filter>
    </defs>
    <rect width="1600" height="1000" fill="url(#bg)"/>
    <rect x="140" y="120" width="1320" height="760" rx="44" fill="#ffffff" filter="url(#shadow)"/>
    <rect x="220" y="200" width="900" height="580" rx="24" fill="#ffffff" stroke="#0f172a" stroke-opacity="0.18" stroke-width="6"/>
    <rect x="250" y="230" width="360" height="260" rx="18" fill="#f8fafc" stroke="#0f172a" stroke-opacity="0.14" stroke-width="5"/>
    <rect x="620" y="230" width="470" height="180" rx="18" fill="#f8fafc" stroke="#0f172a" stroke-opacity="0.14" stroke-width="5"/>
    <rect x="620" y="420" width="220" height="160" rx="18" fill="#f8fafc" stroke="#0f172a" stroke-opacity="0.14" stroke-width="5"/>
    <rect x="870" y="420" width="220" height="160" rx="18" fill="#f8fafc" stroke="#0f172a" stroke-opacity="0.14" stroke-width="5"/>
    <rect x="250" y="500" width="360" height="250" rx="18" fill="#f8fafc" stroke="#0f172a" stroke-opacity="0.14" stroke-width="5"/>
    <path d="M1160 240 h220 v220 h-220 z" fill="#ffffff" stroke="#0f172a" stroke-opacity="0.14" stroke-width="5"/>
    <path d="M1160 490 h220 v290 h-220 z" fill="#ffffff" stroke="#0f172a" stroke-opacity="0.14" stroke-width="5"/>
    <path d="M1210 360 q60 -70 120 0" fill="none" stroke="hsl(${a} 80% 45%)" stroke-width="10" stroke-linecap="round"/>
    <g font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" fill="#0f172a" fill-opacity="0.70" font-weight="700">
      <text x="400" y="370" font-size="22" text-anchor="middle">KT</text>
      <text x="860" y="340" font-size="22" text-anchor="middle">R. Keluarga</text>
      <text x="730" y="515" font-size="20" text-anchor="middle">KM</text>
      <text x="980" y="515" font-size="20" text-anchor="middle">KM</text>
      <text x="410" y="640" font-size="22" text-anchor="middle">Dapur</text>
      <text x="1270" y="610" font-size="20" text-anchor="middle">Taman</text>
    </g>
    <rect x="1200" y="78" width="280" height="44" rx="22" fill="#0f172a" fill-opacity="0.86"/>
    <text x="1340" y="107" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="18" font-weight="800" fill="#ffffff" text-anchor="middle">${title}</text>
  </svg>`;
  return svgDataUri(svg);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) return { title: "Properti Tidak Ditemukan — Livinova" };

  const siteUrl = getSiteUrl();
  const priceText = formatRupiah(listing.price ?? listing.startingPrice);
  const title = `${listing.project.name} — ${listing.project.developer.name}`;
  const description =
    listing.description ??
    `Listing terverifikasi di Livinova. ${listing.project.name} di ${cityArea(listing.project.location)} dengan harga mulai ${priceText}.`;
  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical: `/properti/${listing.slug}` },
    openGraph: {
      type: "article",
      url: `/properti/${listing.slug}`,
      title,
      description,
      siteName: "Livinova",
      images: listing.images?.[0]?.url ? [listing.images[0].url] : ["/logo.png"],
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();

  const developer = await getDeveloper(listing.project.developer.slug);
  const related = await getRelatedListings(listing.project.developer.slug, listing.slug);
  const priceNumber = Number(listing.price ?? listing.startingPrice ?? "0") || 0;
  const kpr = priceNumber > 0 ? await getKprEstimate(priceNumber) : null;
  const embedUrl = mapEmbedUrl(listing.project.location);
  const stage = constructionStage(listing.project.status);
  const stagePercent = stage === "planning" ? 24 : stage === "construction" ? 62 : 100;
  const seed = hashString(`${listing.slug}:${listing.project.slug}:${listing.project.developer.slug}`);
  const basePhotos = (listing.images ?? [])
    .filter((x) => x.kind !== "floorplan" && !x.url.toLowerCase().includes("denah"))
    .map((x) => ({ id: x.id, url: x.url, sortOrder: x.sortOrder }));
  const photoItems = [...basePhotos];
  while (photoItems.length < 10) {
    const i = photoItems.length;
    photoItems.push({ id: `demo-photo-${i + 1}`, url: demoPhotoDataUri(seed, i), sortOrder: 10 + i });
  }

  const baseFloorplans = (listing.images ?? [])
    .filter((x) => x.kind === "floorplan" || x.url.toLowerCase().includes("denah") || x.url.toLowerCase().includes("floor"))
    .map((x) => ({ id: x.id, url: x.url, sortOrder: x.sortOrder }));
  const planItems =
    baseFloorplans.length > 0
      ? baseFloorplans
      : [
          { id: "demo-plan-unit", url: demoFloorplanDataUri(seed, 0), sortOrder: 0 },
          { id: "demo-plan-site", url: demoFloorplanDataUri(seed, 1), sortOrder: 1 },
        ];

  const virtualTours = [
    {
      id: "demo-tour-matterport",
      title: "Virtual Tour 360 (Demo)",
      embedUrl: "https://my.matterport.com/show/?m=JGPnGQ6hosj&brand=0&play=1&help=0",
    },
  ];

  const videos = [
    {
      id: "demo-video-cc0",
      title: "Video Proyek (Demo)",
      src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    },
  ];

  const smartFeatures = listing.smartFeatures ?? [];
  const address = addressLine(listing.project.location);

  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Beranda", item: `${getSiteUrl()}/` },
                  { "@type": "ListItem", position: 2, name: "Properti", item: `${getSiteUrl()}/properti` },
                  { "@type": "ListItem", position: 3, name: listing.project.name, item: `${getSiteUrl()}/properti/${listing.slug}` },
                ],
              },
              {
                "@type": "Product",
                name: listing.project.name,
                description: listing.description ?? undefined,
                brand: { "@type": "Brand", name: listing.project.developer.name },
                offers: {
                  "@type": "Offer",
                  priceCurrency: "IDR",
                  price: listing.price ?? listing.startingPrice ?? undefined,
                  availability:
                    listing.unit?.availableUnits && listing.unit.availableUnits > 0 ? "https://schema.org/InStock" : "https://schema.org/LimitedAvailability",
                  url: `${getSiteUrl()}/properti/${listing.slug}`,
                },
              },
            ],
          }),
        }}
      />

      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-32 h-[560px] w-[560px] rounded-full bg-sky-500/16 blur-3xl" />
          <div className="absolute -right-24 -top-40 h-[560px] w-[560px] rounded-full bg-slate-900/12 blur-3xl" />
          <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.08)_1px,transparent_0)] [background-size:26px_26px] opacity-45" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-white" />
        </div>

        <Container className="relative max-w-6xl pb-10 pt-8 md:pb-12 md:pt-10">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-900">
              Beranda
            </Link>
            <span className="text-slate-300" aria-hidden="true">
              &gt;
            </span>
            <Link href="/properti" className="hover:text-slate-900">
              Properti
            </Link>
            <span className="text-slate-300" aria-hidden="true">
              &gt;
            </span>
            <span className="text-slate-700">{listing.project.name}</span>
          </div>

          <div className="mt-4">
            <div className="inline-flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
                <Wand2 className="h-4 w-4 text-sky-600" />
                Smart Living
              </span>
              {listing.verificationStatus === "approved" ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm">
                  <ShieldCheck className="h-4 w-4" />
                  Terverifikasi
                </span>
              ) : null}
              {listing.featured ? (
                <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  Unggulan
                </span>
              ) : null}
              {listing.sponsored ? (
                <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 shadow-sm">
                  Sponsor
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              {listing.project.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{listing.project.developer.name}</span>
              {listing.project.developer.verificationStatus === "approved" ? (
                <BadgeCheck className="h-4 w-4 text-emerald-600" aria-label="Developer terverifikasi" />
              ) : null}
              <span>•</span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-500" />
                {cityArea(listing.project.location) || "Lokasi belum tersedia"}
              </span>
            </div>

            <div className="mt-6">
              <PropertyMediaGallery
                title={listing.project.name}
                items={photoItems}
                floorplans={planItems}
                virtualTours={virtualTours}
                videos={videos}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <WishlistButton listingSlug={listing.slug} />
                <ShareButton title={listing.project.name} />
                <Button asChild className="bg-slate-900 text-white hover:bg-slate-800">
                  <Link href={`/kpr?listing=${listing.slug}`}>Simulasi KPR</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-10 md:py-14">
        <Container className="max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Deskripsi</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-slate-700">
                  {listing.description ?? "Deskripsi belum tersedia."}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Spesifikasi Unit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unit</div>
                        <div className="mt-1 text-base font-semibold text-slate-900">{listing.unit?.title ?? "—"}</div>
                        <div className="mt-1 inline-flex items-center gap-2 text-sm text-slate-600">
                          <Home className="h-4 w-4 text-slate-900" />
                          <span className="font-semibold text-slate-900">{listing.unit?.propertyType ?? "—"}</span>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                        <Sparkles className="h-4 w-4 text-sky-600" />
                        Spesifikasi premium
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          key: "bedrooms",
                          label: "Kamar Tidur",
                          value: listing.unit?.bedrooms ?? "—",
                          icon: BedDouble,
                          color: "bg-sky-50 text-sky-700 ring-sky-100",
                        },
                        {
                          key: "bathrooms",
                          label: "Kamar Mandi",
                          value: listing.unit?.bathrooms ?? "—",
                          icon: Bath,
                          color: "bg-violet-50 text-violet-700 ring-violet-100",
                        },
                        {
                          key: "buildingSize",
                          label: "Luas Bangunan",
                          value: listing.unit?.buildingSize ? `${listing.unit.buildingSize} m²` : "—",
                          icon: Ruler,
                          color: "bg-emerald-50 text-emerald-700 ring-emerald-100",
                        },
                        {
                          key: "landSize",
                          label: "Luas Tanah",
                          value: listing.unit?.landSize ? `${listing.unit.landSize} m²` : "—",
                          icon: LandPlot,
                          color: "bg-amber-50 text-amber-700 ring-amber-100",
                        },
                        {
                          key: "availableUnits",
                          label: "Unit Tersedia",
                          value: listing.unit?.availableUnits ?? "—",
                          icon: Blocks,
                          color: "bg-slate-50 text-slate-800 ring-slate-200",
                        },
                        {
                          key: "project",
                          label: "Proyek",
                          value: listing.project.name,
                          icon: Building2,
                          color: "bg-slate-50 text-slate-800 ring-slate-200",
                        },
                      ].map((item) => (
                        <div key={item.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</div>
                              <div className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-900">{item.value}</div>
                            </div>
                            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${item.color}`}>
                              <item.icon className="h-5 w-5" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Fasilitas & Smart Features</CardTitle>
                </CardHeader>
                <CardContent>
                  {smartFeatures.length === 0 ? (
                    <div className="text-sm text-slate-600">Belum ada fitur terdaftar.</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlight</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">Smart Living & fasilitas utama unit</div>
                          </div>
                          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                            <Shield className="h-4 w-4 text-emerald-600" />
                            Terintegrasi
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {smartFeatures.map((f) => {
                            const s = `${f.slug} ${f.name}`.toLowerCase();
                            const Icon = s.includes("wifi") || s.includes("internet") ? Wifi
                              : s.includes("cctv") || s.includes("camera") ? Camera
                              : s.includes("lock") || s.includes("kunci") ? ShieldCheck
                              : s.includes("lamp") || s.includes("light") ? Lightbulb
                              : s.includes("energy") || s.includes("listrik") ? Zap
                              : s.includes("ac") || s.includes("hvac") || s.includes("thermo") ? ThermometerSun
                              : s.includes("iot") || s.includes("smart") ? Cpu
                              : Sparkles;

                            const tint = Icon === Wifi ? "bg-sky-50 text-sky-700 ring-sky-100"
                              : Icon === Camera ? "bg-violet-50 text-violet-700 ring-violet-100"
                              : Icon === ShieldCheck ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                              : Icon === Lightbulb ? "bg-amber-50 text-amber-700 ring-amber-100"
                              : Icon === Zap ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                              : Icon === ThermometerSun ? "bg-orange-50 text-orange-700 ring-orange-100"
                              : Icon === Cpu ? "bg-slate-50 text-slate-800 ring-slate-200"
                              : "bg-slate-50 text-slate-800 ring-slate-200";

                            return (
                              <div key={f.slug} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-slate-900">{f.name}</div>
                                  <div className="mt-0.5 text-xs text-slate-600">Smart Features</div>
                                </div>
                                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${tint}`}>
                                  <Icon className="h-5 w-5" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tag</div>
                        {smartFeatures.map((f) => (
                          <span
                            key={`${f.slug}-chip`}
                            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 shadow-sm"
                          >
                            {f.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Status & 3D Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <SectionTabs
                    defaultTabId="status"
                    tabs={[
                      {
                        id: "status",
                        label: (
                          <span className="inline-flex items-center gap-2">
                            <CalendarClock className="h-4 w-4" />
                            <span>Status Pembangunan</span>
                          </span>
                        ),
                        content: (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <CalendarClock className="h-4 w-4 text-slate-900" />
                              <span className="font-semibold text-slate-900">Status:</span>
                              <span className="text-slate-600">{listing.project.status}</span>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tahap</div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">
                                {stage === "planning" ? "Perencanaan" : stage === "construction" ? "Konstruksi" : "Serah terima"}
                              </div>
                              <div className="mt-1 text-sm text-slate-600">
                                {stage === "handover"
                                  ? "Unit siap / selesai."
                                  : "Timeline detail akan ditampilkan jika tersedia dari developer."}
                              </div>
                            </div>
                          </div>
                        ),
                      },
                      {
                        id: "preview",
                        label: (
                          <span className="inline-flex items-center gap-2">
                            <Wand2 className="h-4 w-4" />
                            <span>3D Preview</span>
                            <span className="ml-1 inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                              {stagePercent}%
                            </span>
                          </span>
                        ),
                        content: <Property3DPreview stage={stage} chromeless hideHeader />,
                      },
                    ]}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Lokasi & Peta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <MapPin className="mt-0.5 h-5 w-5 text-slate-900" />
                    <div className="text-sm text-slate-700">
                      <div className="font-semibold text-slate-900">{cityArea(listing.project.location) || "Lokasi"}</div>
                      <div className="mt-1 text-slate-600">{address}</div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    {embedUrl ? (
                      <iframe
                        title="Peta lokasi"
                        src={embedUrl}
                        className="h-[340px] w-full"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <div className="flex h-[340px] items-center justify-center bg-slate-50 text-sm text-slate-600">
                        Peta belum tersedia.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>FAQ Perumahan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <details className="rounded-2xl border border-slate-200 bg-white p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-900">Apakah proyek sudah terverifikasi?</summary>
                    <div className="mt-2 text-sm text-slate-700">
                      Status verifikasi mengikuti proses review internal Livinova. Listing terverifikasi ditandai badge verifikasi.
                    </div>
                  </details>
                  <details className="rounded-2xl border border-slate-200 bg-white p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-900">Bagaimana cara booking unit?</summary>
                    <div className="mt-2 text-sm text-slate-700">
                      Hubungi marketing/developer, pilih unit yang tersedia, lalu ikuti proses booking sesuai kebijakan developer.
                    </div>
                  </details>
                  <details className="rounded-2xl border border-slate-200 bg-white p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-900">Apakah tersedia opsi KPR syariah?</summary>
                    <div className="mt-2 text-sm text-slate-700">
                      Tergantung produk bank yang aktif di sistem. Gunakan halaman Simulasi KPR untuk melihat opsi produk syariah.
                    </div>
                  </details>
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-4 lg:pt-1">
              <Card className="overflow-hidden border border-slate-200 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur">
                <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50">
                  <CardTitle>Harga & KPR</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Harga</div>
                    <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                      {formatRupiah(listing.price ?? listing.startingPrice)}
                    </div>
                    {kpr ? (
                      <div className="mt-2 text-sm text-slate-600">
                        KPR mulai dari{" "}
                        <span className="font-semibold text-slate-900">{formatRupiah(kpr.monthlyInstallment)}/bulan</span> •{" "}
                        {kpr.bankName} {kpr.isSharia ? "(Syariah)" : ""}
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-slate-600">Estimasi KPR belum tersedia.</div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unit tersedia</div>
                      <div className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                        {listing.unit?.availableUnits ?? "—"}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Online</div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">{formatDateShort(listing.createdAt)}</div>
                      <div className="mt-1 text-xs text-slate-500">Update: {formatDateShort(listing.updatedAt)}</div>
                    </div>
                  </div>

                  <Button asChild className="w-full bg-slate-900 text-white hover:bg-slate-800">
                    <Link href={`/kpr?listing=${listing.slug}`}>Hitung KPR Lebih Lengkap</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Kontak Marketing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="text-sm font-semibold text-slate-900">{developer?.contactPersonName ?? "Marketing 1"}</div>
                    <div className="mt-1 text-sm text-slate-600">Developer • {listing.project.developer.name}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {developer?.contactPersonPhone ? (
                        <a
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
                          href={`https://wa.me/${developer.contactPersonPhone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessagesSquare className="h-4 w-4 text-emerald-600" />
                          WhatsApp
                        </a>
                      ) : null}
                      {developer?.contactPersonEmail ? (
                        <a
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
                          href={`mailto:${developer.contactPersonEmail}`}
                        >
                          Email
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="text-sm font-semibold text-slate-900">Marketing 2</div>
                    <div className="mt-1 text-sm text-slate-600">Agency Partner</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
                        href="https://wa.me/6280000000000"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessagesSquare className="h-4 w-4 text-emerald-600" />
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Developer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/developer/${listing.project.developer.slug}`}
                          className="truncate text-sm font-semibold text-slate-900 hover:underline"
                        >
                          {listing.project.developer.name}
                        </Link>
                        {listing.project.developer.verificationStatus === "approved" ? (
                          <BadgeCheck className="h-4 w-4 text-emerald-600" aria-label="Developer terverifikasi" />
                        ) : null}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {developer?.city && developer?.province ? `${developer.city}, ${developer.province}` : "Profil developer tersedia"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Proyek lain</div>
                    <div className="mt-2 space-y-2">
                      {developer?.projects?.slice(0, 3).map((p) => (
                        <div key={p.id} className="text-sm text-slate-700">
                          <span className="font-semibold text-slate-900">{p.name}</span>{" "}
                          <span className="text-slate-500">•</span>{" "}
                          <span className="text-slate-600">
                            {[p.location?.area, p.location?.city].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )) ?? <div className="text-sm text-slate-600">Belum ada data proyek lain.</div>}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </aside>
          </div>
        </Container>
      </section>

      {related.length ? (
        <section className="border-t border-slate-200 bg-white py-10 md:py-14">
          <Container className="max-w-6xl">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Listing Serupa</h2>
                <p className="mt-1 text-sm text-slate-600">Proyek lain dari developer yang sama.</p>
              </div>
              <Link
                className="text-sm font-medium text-slate-900 hover:underline"
                href={`/properti?developerSlug=${listing.project.developer.slug}&page=1`}
              >
                Lihat semua →
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.slice(0, 3).map((r) => {
                const cover = r.images?.[0]?.url ?? "/properties/livinova-residence-tipe-a.svg";
                const devLogo = getDeveloperLogo(r.project.developer.slug);
                const unitsLeft = r.unit?.availableUnits ?? null;
                const floors = r.specs?.floors ?? null;
                const certificate = r.specs?.certificate ?? null;
                const kt = r.unit?.bedrooms ?? null;
                const km = r.unit?.bathrooms ?? null;
                const lt = r.unit?.landSize ?? null;
                const lb = r.unit?.buildingSize ?? null;

                const priceText = formatRupiah(r.price ?? r.startingPrice);
                const kecamatan = r.project.location?.area ?? null;
                const kabupaten = r.project.location?.city ?? null;
                const locationText = [kecamatan, kabupaten].filter((v) => typeof v === "string" && v.length > 0).join(", ");

                return (
                  <Link key={r.id} href={`/properti/${r.slug}`} className="group">
                    <Card className="h-full overflow-hidden shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                      <div className="relative aspect-[16/10] w-full">
                        <Image
                          src={cover}
                          alt={r.project.name}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-slate-950/0 to-slate-950/0" />
                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                          {unitsLeft !== null ? <span className={chip3dClass}>Sisa {unitsLeft} unit</span> : null}
                          {certificate ? <span className={chip3dClass}>{certificate}</span> : null}
                        </div>
                        {r.featured || r.sponsored ? (
                          <div className="absolute bottom-4 right-4 flex flex-row flex-wrap items-center justify-end gap-2">
                            {r.featured ? <span className={chip3dClass}>Unggulan</span> : null}
                            {r.sponsored ? <span className={chip3dClass}>Sponsor</span> : null}
                          </div>
                        ) : null}
                      </div>

                      <CardContent className="space-y-5 pt-5">
                        <div className="flex items-center gap-3">
                          <Image
                            src={devLogo}
                            alt={r.project.developer.name}
                            width={44}
                            height={44}
                            className="h-11 w-11 shrink-0 rounded-2xl bg-white p-1.5 ring-1 ring-slate-200 shadow-[0_1px_0_rgba(15,23,42,0.10)]"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-base font-semibold tracking-tight text-slate-900">{r.project.name}</div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                              <span className="truncate">{r.project.developer.name}</span>
                              {r.verificationStatus === "approved" ? (
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
                          <SpecTile
                            label="Tipe"
                            value={r.unit?.propertyType ? r.unit.propertyType.toUpperCase() : "PROPERTI"}
                          />
                          {lt ? <SpecTile label="LT" value={`${lt} m²`} /> : null}
                          {lb ? <SpecTile label="LB" value={`${lb} m²`} /> : null}
                          {floors ? <SpecTile label="Lantai" value={`${floors}`} /> : null}
                          {kt ? <SpecTile label="KT" value={`${kt}`} /> : null}
                          {km ? <SpecTile label="KM" value={`${km}`} /> : null}
                        </div>

                        <div className="flex items-center justify-end border-t border-slate-200 pt-3 text-xs text-slate-500">
                          <div className="text-right">
                            <div>Online: {formatDateShort(r.createdAt)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </Container>
        </section>
      ) : null}
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { ArrowRight, BadgeCheck, Cpu, Sparkles } from "lucide-react";

import { FeaturedListings } from "@/components/home/featured-listings";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { KprQuick } from "@/components/home/kpr-quick";
import { PromoStrip } from "@/components/home/promo-strip";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { promos } from "@/lib/promos";
import { cn } from "@/lib/utils";

function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  return envUrl && envUrl.trim() ? envUrl.trim().replace(/\/$/, "") : "http://localhost:3000";
}

export const metadata: Metadata = {
  title: "Livinova — Marketplace Properti Smart Living Terverifikasi",
  description:
    "Temukan properti Smart Living terverifikasi dari developer terpercaya. Filter lengkap, listing premium, dan simulasi KPR Indonesia.",
  applicationName: "Livinova",
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "Livinova — Marketplace Properti Smart Living Terverifikasi",
    description:
      "Temukan properti Smart Living terverifikasi dari developer terpercaya. Filter lengkap, listing premium, dan simulasi KPR Indonesia.",
    siteName: "Livinova",
  },
  twitter: {
    card: "summary_large_image",
    title: "Livinova — Marketplace Properti Smart Living Terverifikasi",
    description:
      "Temukan properti Smart Living terverifikasi dari developer terpercaya. Filter lengkap, listing premium, dan simulasi KPR Indonesia.",
  },
  robots: {
    index: true,
    follow: true,
  },
  keywords: [
    "properti",
    "smart home",
    "smart living",
    "marketplace properti",
    "kpr",
    "rumah",
    "apartemen",
    "developer",
    "listing terverifikasi",
    "Indonesia",
  ],
};

function JsonLd() {
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Livinova",
        url: siteUrl,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Livinova",
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/properti?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

async function readBankLogoFiles() {
  const exts = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);
  const candidates = [
    path.join(process.cwd(), "public", "bank"),
    path.join(process.cwd(), "apps", "web", "public", "bank"),
  ];

  for (const dir of candidates) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      return entries
        .filter((e) => e.isFile() && exts.has(path.extname(e.name).toLowerCase()))
        .map((e) => e.name)
        .sort((a, b) => a.localeCompare(b, "id-ID", { sensitivity: "base" }));
    } catch {
      continue;
    }
  }

  return [];
}

export default async function HomePage() {
  const bankFiles = await readBankLogoFiles();
  const bankItems = bankFiles.map((file) => {
    const name = file.replace(/\.[^.]+$/, "");
    return {
      src: encodeURI(`/bank/${file}`),
      alt: `Logo bank ${name}`,
      name,
    };
  });

  const marqueeItems = bankItems.length > 0 ? [...bankItems, ...bankItems] : [];

  return (
    <main>
      <JsonLd />
      <HeroCarousel />

      <PromoStrip />

      <FeaturedListings />

      <KprQuick />

      <section className="relative overflow-hidden border-y border-slate-200 bg-white py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-[520px] w-[520px] rounded-full bg-sky-500/16 blur-3xl" />
          <div className="absolute -right-24 -top-32 h-[520px] w-[520px] rounded-full bg-slate-900/12 blur-3xl" />
          <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.08)_1px,transparent_0)] [background-size:26px_26px] opacity-50" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4 text-sky-600" />
                Untuk Developer
              </div>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                Tingkatkan Visibilitas Proyek dengan Listing Premium
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 md:text-base">
                Ajukan verifikasi developer, unggah dokumen proyek, dan tampilkan kampanye promo agar lebih cepat ditemukan
                oleh buyer yang mencari Smart Living.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
                  <div className="text-2xl font-semibold tracking-tight text-slate-900">
                    {bankItems.length ? <CountUp value={bankItems.length} /> : "—"}
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Bank Partner</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
                  <div className="text-2xl font-semibold tracking-tight text-slate-900">
                    <CountUp value={promos.length} />
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Promo & Iklan</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
                  <div className="text-2xl font-semibold tracking-tight text-slate-900">
                    <CountUp value={3} />
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Tahap Verifikasi</div>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur">
                  <BadgeCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Verifikasi Developer</div>
                    <div className="mt-1 text-sm text-slate-600">Bangun trust dengan badge verifikasi dan proses review.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur">
                  <Cpu className="mt-0.5 h-5 w-5 text-sky-600" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Smart Living Readiness</div>
                    <div className="mt-1 text-sm text-slate-600">Tampilkan fitur smart home agar buyer mudah membandingkan.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mulai dalam 3 langkah</div>
                  <div className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Onboarding Developer</div>
                  <div className="mt-2 text-sm text-slate-600">Proses singkat untuk publish proyek dan kampanye promo.</div>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    1
                  </span>
                  <div className="text-sm text-slate-700">Ajukan verifikasi developer dan lengkapi profil.</div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    2
                  </span>
                  <div className="text-sm text-slate-700">Submit proyek, unit, dan dokumen pendukung.</div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    3
                  </span>
                  <div className="text-sm text-slate-700">Aktifkan promo untuk meningkatkan traffic dan lead.</div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="w-full bg-slate-900 text-white hover:bg-slate-800">
                  <Link href="/developer/daftar">Ajukan Verifikasi</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/developer/submit-properti">Submit Properti</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-14">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Bank Partner</h2>
              <p className="mt-1 text-sm text-slate-600">Logo bank yang bekerja sama dengan Livinova.</p>
            </div>
          </div>

          <style>{`
            @keyframes lv-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
          `}</style>

          <div
            className={cn(
              "group mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm",
              "relative",
            )}
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />

            <div className="flex gap-8 px-6 py-6">
              {marqueeItems.length === 0 ? (
                <div className="text-sm text-slate-600">Logo bank belum tersedia.</div>
              ) : (
                <div
                  className="flex min-w-max items-center gap-10 group-hover:[animation-play-state:paused] motion-reduce:animate-none"
                  style={{ animation: "lv-marquee 28s linear infinite" }}
                >
                  {marqueeItems.map((b, idx) => (
                    <div
                      key={`${b.src}-${idx}`}
                      className="flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-6 shadow-[0_1px_0_rgba(15,23,42,0.08)]"
                    >
                      <Image
                        src={b.src}
                        alt={b.alt}
                        width={180}
                        height={64}
                        className="h-8 w-auto object-contain opacity-90 transition group-hover:opacity-100"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

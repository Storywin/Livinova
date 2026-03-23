import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Cpu, ShieldCheck } from "lucide-react";

import { Container } from "@/components/site/container";
import { Card, CardContent } from "@/components/ui/card";
import { PromoAccent, promos } from "@/lib/promos";
import { cn } from "@/lib/utils";

function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  return envUrl && envUrl.trim() ? envUrl.trim().replace(/\/$/, "") : "http://localhost:3000";
}

function promoGradient(accent: PromoAccent) {
  if (accent === "sky") return "from-sky-600 to-cyan-500";
  if (accent === "emerald") return "from-emerald-600 to-teal-500";
  if (accent === "violet") return "from-violet-600 to-fuchsia-500";
  if (accent === "amber") return "from-amber-500 to-orange-500";
  return "from-slate-900 to-slate-700";
}

function PromoHeroCover({
  title,
  badge,
  periodText,
  accent,
}: {
  title: string;
  badge: string;
  periodText: string;
  accent: PromoAccent;
}) {
  const Icon = badge === "Promo" ? ShieldCheck : badge === "Iklan" ? Building2 : Cpu;
  return (
    <div className={cn("relative aspect-[16/7] w-full overflow-hidden bg-gradient-to-br", promoGradient(accent))}>
      <div className="absolute inset-0 opacity-55 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.28)_1px,transparent_0)] [background-size:22px_22px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/18 to-transparent" />
      <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-slate-900 ring-1 ring-white/35 backdrop-blur">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/90 text-white">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span>{badge}</span>
      </div>
      <div className="absolute bottom-6 left-6 right-6">
        <div className="text-balance text-2xl font-semibold tracking-tight text-white md:text-3xl">{title}</div>
        <div className="mt-2 text-sm text-white/85">{periodText}</div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const promo = promos.find((p) => p.slug === slug) ?? null;
  const siteUrl = getSiteUrl();
  if (!promo) {
    return {
      title: "Promo tidak ditemukan — Livinova",
      metadataBase: new URL(siteUrl),
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${promo.title} — Promo & Iklan Livinova`,
    description: promo.seoDescription,
    metadataBase: new URL(siteUrl),
    alternates: { canonical: `/promo/${promo.slug}` },
    openGraph: {
      type: "article",
      url: `/promo/${promo.slug}`,
      title: `${promo.title} — Livinova`,
      description: promo.seoDescription,
      siteName: "Livinova",
      images: ["/logo.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${promo.title} — Livinova`,
      description: promo.seoDescription,
    },
    robots: { index: true, follow: true },
  };
}

export default async function PromoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const promo = promos.find((p) => p.slug === slug) ?? null;
  if (!promo) notFound();

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Beranda", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "Promo & Iklan", item: `${siteUrl}/promo` },
          { "@type": "ListItem", position: 3, name: promo.title, item: `${siteUrl}/promo/${promo.slug}` },
        ],
      },
      {
        "@type": "WebPage",
        name: promo.title,
        url: `${siteUrl}/promo/${promo.slug}`,
        description: promo.seoDescription,
        isPartOf: { "@type": "WebSite", name: "Livinova", url: siteUrl },
      },
    ],
  };

  return (
    <main className="py-10">
      <Container className="max-w-5xl">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/promo" className="text-sm text-slate-500 hover:text-slate-900">
              ← Semua promo
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{promo.title}</h1>
            <p className="mt-2 text-sm text-slate-600">{promo.subtitle}</p>
          </div>
          <Link
            href="/properti?sort=featured&page=1"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
          >
            Jelajahi properti →
          </Link>
        </div>

        <Card className="mt-8 overflow-hidden shadow-sm">
          <PromoHeroCover title={promo.title} badge={promo.badge} periodText={promo.periodText} accent={promo.accent} />
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ringkasan</div>
                  <div className="mt-2 text-sm text-slate-700">{promo.seoDescription}</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlight</div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {promo.highlights.map((h) => (
                      <li key={h} className="flex gap-2">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-900" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Detail</div>
                  <dl className="mt-3 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500">Kategori</dt>
                      <dd className="font-semibold text-slate-900">{promo.badge}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500">Periode</dt>
                      <dd className="font-semibold text-slate-900">{promo.periodText}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cara Klaim</div>
                  <ol className="mt-3 space-y-2 text-sm text-slate-700">
                    <li className="flex gap-2">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                        1
                      </span>
                      <span>Klik “Jelajahi properti” untuk membuka daftar properti.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                        2
                      </span>
                      <span>Pilih proyek/listing yang relevan dengan promo ini.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                        3
                      </span>
                      <span>Hubungi developer dari halaman listing untuk konfirmasi promo.</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Syarat & Ketentuan</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {promo.terms.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}

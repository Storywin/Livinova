import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Cpu, ShieldCheck } from "lucide-react";

import { Container } from "@/components/site/container";
import { Card, CardContent } from "@/components/ui/card";
import { PromoAccent, promos } from "@/lib/promos";
import { cn } from "@/lib/utils";

type SearchParams = Record<string, string | string[] | undefined>;

const PAGE_SIZE = 9;

function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  return envUrl && envUrl.trim() ? envUrl.trim().replace(/\/$/, "") : "http://localhost:3000";
}

function pickFirst(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0];
  return v;
}

function parsePage(searchParams: SearchParams) {
  const raw = pickFirst(searchParams.page);
  const n = raw ? Number(raw) : 1;
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.floor(n));
}

function pageLink(page: number) {
  const qp = new URLSearchParams();
  qp.set("page", String(page));
  return `/promo?${qp.toString()}`;
}

function buildPages(currentPage: number, totalPages: number) {
  const pages: Array<number | "ellipsis"> = [];
  const add = (p: number | "ellipsis") => pages.push(p);

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) add(i);
    return pages;
  }

  add(1);
  if (currentPage > 3) add("ellipsis");
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i += 1) add(i);
  if (currentPage < totalPages - 2) add("ellipsis");
  add(totalPages);
  return pages;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const sp = await searchParams;
  const page = parsePage(sp);
  const totalPages = Math.max(1, Math.ceil(promos.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const siteUrl = getSiteUrl();
  const canonicalPath = currentPage > 1 ? `/promo?page=${currentPage}` : "/promo";
  const description = "Promo, iklan, dan kampanye terbaru dari Livinova serta developer terpilih.";
  const title = currentPage > 1 ? `Promo & Iklan (Halaman ${currentPage}) — Livinova` : "Promo & Iklan — Livinova";

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      url: canonicalPath,
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

function promoGradient(accent: PromoAccent) {
  if (accent === "sky") return "from-sky-600 to-cyan-500";
  if (accent === "emerald") return "from-emerald-600 to-teal-500";
  if (accent === "violet") return "from-violet-600 to-fuchsia-500";
  if (accent === "amber") return "from-amber-500 to-orange-500";
  return "from-slate-900 to-slate-700";
}

function PromoCover({ title, badge, periodText, accent }: { title: string; badge: string; periodText: string; accent: PromoAccent }) {
  const Icon = badge === "Promo" ? ShieldCheck : badge === "Iklan" ? Building2 : Cpu;
  return (
    <div className={cn("relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br", promoGradient(accent))}>
      <div className="absolute inset-0 opacity-55 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.28)_1px,transparent_0)] [background-size:22px_22px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />
      <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-slate-900 ring-1 ring-white/35 backdrop-blur">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/90 text-white">
          <Icon className="h-3 w-3" />
        </span>
        <span>{badge}</span>
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="line-clamp-1 text-sm font-semibold tracking-tight text-white">{title}</div>
        <div className="mt-1 line-clamp-1 text-xs text-white/80">{periodText}</div>
      </div>
    </div>
  );
}

export default async function PromoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = parsePage(sp);
  const totalPages = Math.max(1, Math.ceil(promos.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const items = promos.slice(start, end);

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Promo & Iklan Livinova",
    itemListElement: items.map((p, index) => ({
      "@type": "ListItem",
      position: start + index + 1,
      url: `${siteUrl}/promo/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <main className="py-10">
      <Container className="max-w-6xl">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
            ← Beranda
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Promo & Iklan</h1>
          <p className="mt-2 text-sm text-slate-600">Kumpulan promo dan kampanye terbaru di Livinova.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <Link key={p.id} href={`/promo/${p.slug}`} className="group">
              <Card className="h-full overflow-hidden shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                <PromoCover title={p.title} badge={p.badge} periodText={p.periodText} accent={p.accent} />
                <CardContent className="space-y-2 pt-4">
                  <div className="line-clamp-2 text-xs leading-relaxed text-slate-600">{p.subtitle}</div>
                  <div className="pt-1 text-xs font-semibold text-slate-900">{p.ctaLabel} →</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
          <div className="text-sm text-slate-600">
            Halaman <span className="font-semibold text-slate-900">{currentPage}</span> dari{" "}
            <span className="font-semibold text-slate-900">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              aria-disabled={currentPage <= 1}
              href={pageLink(Math.max(1, currentPage - 1))}
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
              {buildPages(currentPage, totalPages).map((p, idx) =>
                p === "ellipsis" ? (
                  <span key={`e-${idx}`} className="px-2 text-sm text-slate-400">
                    …
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={pageLink(p)}
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
              href={pageLink(Math.min(totalPages, currentPage + 1))}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50",
                currentPage >= totalPages && "pointer-events-none opacity-50",
              )}
            >
              Berikutnya →
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type ArticleItem = {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  excerpt: string | null;
  publishedAt: string | null;
  authorName: string | null;
  tags: string[] | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

type Paginated<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

function pickFirst(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0];
  return v;
}

function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  return envUrl && envUrl.trim() ? envUrl.trim().replace(/\/$/, "") : "http://localhost:3000";
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const sp = await searchParams;
  const page = Number(pickFirst(sp.page) ?? "1") || 1;
  const q = (pickFirst(sp.q) ?? "").trim();
  const titleBase = q ? `Artikel: ${q}` : "Artikel Livinova";
  const title = page > 1 ? `${titleBase} (Halaman ${page})` : titleBase;
  const description = q
    ? `Hasil pencarian artikel Livinova untuk “${q}”. Wawasan seputar properti, Smart Living, dan panduan KPR.`
    : "Bacaan tentang properti, Smart Living, dan panduan KPR untuk pengambilan keputusan yang lebih baik.";
  const qp = new URLSearchParams();
  if (q) qp.set("q", q);
  if (page > 1) qp.set("page", String(page));
  const canonical = qp.toString() ? `/artikel?${qp.toString()}` : "/artikel";
  return {
    title,
    description,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title, description },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const page = Number(pickFirst(sp.page) ?? "1") || 1;
  const q = (pickFirst(sp.q) ?? "").trim();
  const qp = new URLSearchParams();
  qp.set("page", String(page));
  qp.set("pageSize", "9");
  if (q) qp.set("q", q);
  let data: Paginated<ArticleItem>;
  try {
    data = await apiFetch<Paginated<ArticleItem>>(`/public/articles?${qp.toString()}`);
  } catch {
    data = { items: [], page, pageSize: 9, totalItems: 0, totalPages: 1 };
  }
  const siteUrl = getSiteUrl();
  const pageLink = (p: number) => {
    const qps = new URLSearchParams();
    qps.set("page", String(p));
    if (q) qps.set("q", q);
    return `/artikel?${qps.toString()}`;
  };

  const jsonLd =
    data && data.items.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Artikel Livinova",
          itemListElement: data.items.map((item, idx) => ({
            "@type": "ListItem",
            position: (data.page - 1) * data.pageSize + idx + 1,
            url: `${siteUrl}/artikel/${item.slug}`,
            name: item.title,
          })),
        }
      : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50">
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}
      <Container className="py-12 md:py-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 shadow-sm backdrop-blur">
          Wawasan Smart Living
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">Artikel</h1>
        <p className="mt-3 text-slate-600">Bacaan terkurasi seputar properti, teknologi rumah pintar, dan keuangan KPR.</p>

        <Card className="mt-6 overflow-hidden border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
          <CardContent className="p-4">
            <form className="flex flex-col gap-3 md:flex-row md:items-center" action="/artikel" method="get">
              <div className="flex-1">
                <Input name="q" defaultValue={q} className="h-11 rounded-xl" placeholder="Cari artikel: KPR, smart home, legalitas..." />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="h-11 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                  Cari
                </Button>
                <Button asChild type="button" variant="outline" className="h-11 rounded-xl">
                  <Link href="/artikel">Reset</Link>
                </Button>
              </div>
            </form>
            {q ? <div className="mt-3 text-sm text-slate-600">Hasil pencarian untuk: <span className="font-semibold text-slate-900">{q}</span></div> : null}
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((a) => (
            <Link key={a.id} href={`/artikel/${a.slug}`} className="group">
              <Card className="h-full overflow-hidden shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                <div className="relative h-44 w-full bg-gradient-to-br from-sky-100 via-violet-100 to-emerald-100">
                  {a.coverImageUrl ? (
                    <Image
                      src={a.coverImageUrl}
                      alt={a.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-slate-950/0 to-slate-950/0" />
                </div>
                <CardContent className="space-y-3 p-5">
                  <div className="text-base font-semibold tracking-tight text-slate-900">{a.title}</div>
                  {a.excerpt ? <div className="line-clamp-2 text-sm text-slate-600">{a.excerpt}</div> : null}
                  <div className="flex flex-wrap items-center gap-2">
                    {a.tags?.slice(0, 3).map((t) => (
                      <span key={t} className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <div className="pt-2 text-xs text-slate-500">
                    {a.authorName ? <span className="font-semibold text-slate-700">{a.authorName}</span> : null}
                    {a.publishedAt ? <span className="ml-2">{new Date(a.publishedAt).toLocaleDateString("id-ID")}</span> : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {data.items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
            Artikel belum tersedia atau koneksi ke server gagal. Coba muat ulang halaman atau hapus filter pencarian.
          </div>
        ) : null}

        <div className="mt-8 flex items-center gap-2">
          <Link
            href={pageLink(Math.max(1, page - 1))}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50",
              page <= 1 && "pointer-events-none opacity-50",
            )}
          >
            ← Sebelumnya
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {Array.from({ length: Math.min(7, data.totalPages) }).map((_, i) => {
              const p = i + Math.max(1, Math.min(page - 3, data.totalPages - 6));
              return (
                <Link
                  key={p}
                  href={pageLink(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold shadow-sm transition",
                    p === page ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                  )}
                >
                  {p}
                </Link>
              );
            })}
          </div>
          <Link
            href={pageLink(Math.min(data.totalPages, page + 1))}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50",
              page >= data.totalPages && "pointer-events-none opacity-50",
            )}
          >
            Berikutnya →
          </Link>
        </div>
      </Container>
    </main>
  );
}

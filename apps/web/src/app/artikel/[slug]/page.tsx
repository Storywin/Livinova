import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { CopyLinkButton } from "@/components/articles/copy-link-button";
import { Container } from "@/components/site/container";
import { apiFetch } from "@/lib/api";

type ArticleDetail = {
  slug: string;
  title: string;
  coverImageUrl: string | null;
  excerpt: string | null;
  content: string | null;
  publishedAt: string | null;
  authorName: string | null;
  tags: string[] | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

type SeoSettings = {
  siteName: string;
  titleTemplate: string;
  defaultMetaDescription: string | null;
  googleSiteVerification: string | null;
};

function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  return envUrl && envUrl.trim() ? envUrl.trim().replace(/\/$/, "") : "http://localhost:3000";
}

async function getArticle(slug: string) {
  return apiFetch<ArticleDetail | null>(`/public/articles/${slug}`);
}

async function getSeoSettings() {
  return apiFetch<SeoSettings>(`/public/seo`);
}

function applyTitleTemplate(template: string, title: string) {
  const t = template?.trim();
  if (!t) return title;
  if (t.includes("%s")) return t.replaceAll("%s", title);
  return `${title} | ${t}`;
}

function isAbsoluteUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function toAbsoluteUrl(siteUrl: string, url: string) {
  if (!url) return url;
  if (isAbsoluteUrl(url)) return url;
  if (url.startsWith("/")) return `${siteUrl}${url}`;
  return `${siteUrl}/${url}`;
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function isInternalHref(href: string) {
  if (!href) return false;
  if (href.startsWith("/")) return true;
  try {
    const u = new URL(href);
    return u.hostname === "localhost";
  } catch {
    return false;
  }
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const label = m[1];
    const href = m[2];
    if (isInternalHref(href)) {
      nodes.push(
        <Link key={`${href}-${m.index}`} href={href} className="font-semibold text-sky-700 hover:text-sky-800 hover:underline">
          {label}
        </Link>,
      );
    } else {
      nodes.push(
        <a
          key={`${href}-${m.index}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-sky-700 hover:text-sky-800 hover:underline"
        >
          {label}
        </a>,
      );
    }
    last = m.index + m[0].length;
  }
  const rest = text.slice(last);
  const urlRe = /(https?:\/\/[^\s]+)/g;
  let last2 = 0;
  let u: RegExpExecArray | null;
  while ((u = urlRe.exec(rest)) !== null) {
    if (u.index > last2) nodes.push(rest.slice(last2, u.index));
    const href = u[1];
    nodes.push(
      <a
        key={`${href}-${u.index}-raw`}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-sky-700 hover:text-sky-800 hover:underline"
      >
        {href}
      </a>,
    );
    last2 = u.index + href.length;
  }
  if (last2 < rest.length) nodes.push(rest.slice(last2));
  return nodes;
}

type ContentNode =
  | { type: "heading"; level: 2 | 3 | 4 | 5 | 6; text: string; id: string }
  | { type: "paragraph"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function parseContent(body: string): { nodes: ContentNode[]; toc: Array<{ id: string; text: string; level: 2 | 3 | 4 }> } {
  const lines = body.split("\n").map((l) => l.replace(/\r/g, ""));
  const nodes: ContentNode[] = [];
  const toc: Array<{ id: string; text: string; level: 2 | 3 | 4 }> = [];

  const usedIds = new Map<string, number>();
  const makeId = (text: string) => {
    const base = slugifyHeading(text) || "bagian";
    const n = usedIds.get(base) ?? 0;
    usedIds.set(base, n + 1);
    return n === 0 ? base : `${base}-${n + 1}`;
  };

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) {
      i += 1;
      continue;
    }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const levelRaw = Math.min(6, Math.max(1, h[1].length));
      const level = (levelRaw === 1 ? 2 : levelRaw) as 2 | 3 | 4 | 5 | 6;
      const text = h[2].trim();
      const id = makeId(text);
      nodes.push({ type: "heading", level, text, id });
      if (level <= 4) toc.push({ id, text, level: level as 2 | 3 | 4 });
      i += 1;
      continue;
    }

    if (/^[-–•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        const l = lines[i].trim();
        const m2 = /^[-–•]\s+(.*)$/.exec(l);
        if (!m2) break;
        items.push(m2[1].trim());
        i += 1;
      }
      nodes.push({ type: "ul", items });
      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        const l = lines[i].trim();
        const m2 = /^\d+[.)]\s+(.*)$/.exec(l);
        if (!m2) break;
        items.push(m2[1].trim());
        i += 1;
      }
      nodes.push({ type: "ol", items });
      continue;
    }

    const para: string[] = [];
    while (i < lines.length) {
      const l = lines[i].trim();
      if (!l) break;
      if (/^(#{1,6})\s+/.test(l)) break;
      if (/^[-–•]\s+/.test(l)) break;
      if (/^\d+[.)]\s+/.test(l)) break;
      para.push(lines[i].trimEnd());
      i += 1;
    }
    nodes.push({ type: "paragraph", text: para.join("\n") });
  }

  return { nodes, toc };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let article: ArticleDetail | null = null;
  let seo: SeoSettings | null = null;
  try {
    article = await getArticle(slug);
  } catch {
    article = null;
  }
  try {
    seo = await getSeoSettings();
  } catch {
    seo = null;
  }
  const baseTitle = article?.metaTitle ?? article?.title ?? "Artikel";
  const title = seo ? applyTitleTemplate(seo.titleTemplate, baseTitle) : baseTitle;
  const description =
    article?.metaDescription ??
    article?.excerpt ??
    seo?.defaultMetaDescription ??
    "Artikel Livinova";
  const canonical = `/artikel/${slug}`;
  return {
    title,
    description,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description,
      images: article?.coverImageUrl ? [article.coverImageUrl] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let article: ArticleDetail | null = null;
  try {
    article = await getArticle(slug);
  } catch {
    article = null;
  }
  if (!article) {
    return (
      <main className="py-12">
        <Container>
          <div className="text-slate-700">Artikel tidak ditemukan.</div>
        </Container>
      </main>
    );
  }
  const siteUrl = getSiteUrl();
  const body = (article.content ?? article.excerpt ?? "").trim();
  const { nodes, toc } = parseContent(body);
  const wordCount = body ? body.replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.round(wordCount / 220));
  const coverAbs = article.coverImageUrl ? toAbsoluteUrl(siteUrl, article.coverImageUrl) : null;
  const shareUrl = `${siteUrl}/artikel/${article.slug}`;
  const shareText = `Baca di Livinova: ${article.title}`;
  const shareWhatsApp = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  const shareTelegram = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
  const tocTree = (() => {
    const root: Array<{ id: string; text: string; children: Array<{ id: string; text: string }> }> = [];
    let current: { id: string; text: string; children: Array<{ id: string; text: string }> } | null = null;
    for (const t of toc) {
      if (t.level === 2) {
        current = { id: t.id, text: t.text, children: [] };
        root.push(current);
        continue;
      }
      if (!current) {
        current = { id: t.id, text: t.text, children: [] };
        root.push(current);
        continue;
      }
      current.children.push({ id: t.id, text: t.text });
    }
    return root;
  })();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Beranda", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "Artikel", item: `${siteUrl}/artikel` },
          { "@type": "ListItem", position: 3, name: article.title, item: `${siteUrl}/artikel/${article.slug}` },
        ],
      },
      {
        "@type": "Article",
        headline: article.title,
        datePublished: article.publishedAt ?? undefined,
        author: article.authorName ? { "@type": "Person", name: article.authorName } : undefined,
        mainEntityOfPage: `${siteUrl}/artikel/${article.slug}`,
        image: coverAbs ? [coverAbs] : undefined,
      },
    ],
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Container className="py-12 md:py-16">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-900">
            Beranda
          </Link>
          <span className="text-slate-300" aria-hidden="true">
            &gt;
          </span>
          <Link href="/artikel" className="hover:text-slate-900">
            Artikel
          </Link>
          <span className="text-slate-300" aria-hidden="true">
            &gt;
          </span>
          <span className="text-slate-700">{article.title}</span>
        </div>

        <div className="mx-auto mt-6 max-w-6xl">
          <h1 className="max-w-4xl text-balance text-[36px] font-semibold leading-[1.06] tracking-tight text-slate-900 md:text-[42px]">
            {article.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            {article.authorName ? <span className="font-semibold text-slate-900">{article.authorName}</span> : null}
            {article.publishedAt ? <span>{new Date(article.publishedAt).toLocaleDateString("id-ID")}</span> : null}
            <span className="text-slate-300" aria-hidden="true">
              •
            </span>
            <span>{readingTime} menit baca</span>
          </div>

          {article.excerpt ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-4 text-base leading-relaxed text-slate-700 shadow-sm backdrop-blur">
              {article.excerpt}
            </div>
          ) : null}

          {article.tags && article.tags.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {article.tags.slice(0, 8).map((t) => (
                <Link
                  key={t}
                  href={`/artikel?q=${encodeURIComponent(t)}`}
                  className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                >
                  #{t}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={shareWhatsApp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              WhatsApp
            </a>
            <a
              href={shareTelegram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-500"
            >
              Telegram
            </a>
            <CopyLinkButton url={shareUrl} className="h-10 rounded-xl border-slate-200 bg-white text-slate-900 hover:bg-slate-50" />
          </div>
        </div>

        {article.coverImageUrl ? (
          <div className="mx-auto mt-7 max-w-6xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
            <div className="relative aspect-[16/9] w-full">
              <Image
                src={article.coverImageUrl}
                alt={article.title}
                fill
                sizes="(min-width: 1024px) 1100px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        ) : null}

        {tocTree.length ? (
          <div className="mx-auto mt-6 max-w-6xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-900">Daftar isi</div>
              <div className="text-xs text-slate-500">{readingTime} menit baca</div>
            </div>
            <nav className="mt-4 text-sm" aria-label="Daftar isi artikel">
              <ol className="columns-1 gap-3 space-y-2 md:columns-2 lg:columns-3" aria-label="Daftar isi">
                {tocTree.map((t, idx) => (
                  <li key={t.id} className="break-inside-avoid">
                    <a
                      href={`#${t.id}`}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
                    >
                      <span className="mt-[1px] inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{t.text}</span>
                    </a>
                    {t.children.length ? (
                      <div className="mt-2 grid gap-1 pl-9 text-xs">
                        {t.children.map((c) => (
                          <a
                            key={c.id}
                            href={`#${c.id}`}
                            className="rounded-lg px-2 py-1 font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            {c.text}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        ) : null}

        <div className="mx-auto mt-6 max-w-6xl">
          <article>
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] md:p-8">
              {(() => {
                let sectionNo = 0;
                let leadShown = false;
                let indent: 0 | 6 | 10 = 0;
                const indentClass = () => (indent === 0 ? "" : indent === 6 ? "md:ml-6" : "md:ml-10");
                const isCallout = (t: string) => /^(ringkasnya|penutup|kesimpulan|catatan|tips)\b/i.test(t.trim());
                const renderDropCap = (t: string) => {
                  const s = t.trim();
                  if (!s) return null;
                  const first = s.slice(0, 1);
                  const rest = s.slice(1);
                  return (
                    <p className="text-justify">
                      <span className="float-left mr-3 mt-1 text-[46px] font-semibold leading-none text-slate-900">
                        {first}
                      </span>
                      {renderInline(rest)}
                    </p>
                  );
                };
                return (
                  <div className="text-[15px] leading-8 text-slate-800">
                    {nodes.map((n, idx) => {
                      if (n.type === "heading") {
                        const text = n.text;
                        const id = n.id;
                        const anchor = (
                          <a href={`#${id}`} className="no-underline">
                            <span className="mr-2 text-slate-300 opacity-0 transition group-hover:opacity-100" aria-hidden="true">
                              #
                            </span>
                            {text}
                          </a>
                        );

                        if (n.level === 2) {
                          sectionNo += 1;
                          indent = 0;
                          return (
                            <div key={`${id}-${idx}`} id={id} className="mt-10 scroll-mt-24">
                              <div className="flex items-start gap-3">
                                <div className="mt-2 h-10 w-1 rounded-full bg-gradient-to-b from-sky-500 via-violet-500 to-emerald-500" />
                                <div className="min-w-0">
                                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                                    Bagian {sectionNo}
                                  </div>
                                  <h2 className="group mt-2 text-balance text-[20px] font-semibold leading-snug text-slate-900 md:text-[22px]">
                                    {anchor}
                                  </h2>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        if (n.level === 3) {
                          indent = 6;
                          return (
                            <div key={`${id}-${idx}`} id={id} className={`mt-7 scroll-mt-24 ${indentClass()}`}>
                              <div className="flex items-start gap-3">
                                <div className="mt-2 h-6 w-1 rounded-full bg-sky-600/70" />
                                <h3 className="group min-w-0 text-[18px] font-semibold leading-snug text-slate-900">
                                  {anchor}
                                </h3>
                              </div>
                            </div>
                          );
                        }

                        if (n.level === 4) {
                          indent = 10;
                          return (
                            <div key={`${id}-${idx}`} id={id} className={`mt-5 scroll-mt-24 ${indentClass()}`}>
                              <div className="flex items-start gap-3">
                                <div className="mt-[9px] h-2 w-2 rounded-full bg-violet-500/80" />
                                <h4 className="group min-w-0 text-[16px] font-semibold leading-snug text-slate-900">
                                  {anchor}
                                </h4>
                              </div>
                            </div>
                          );
                        }

                        if (n.level === 5) {
                          indent = 10;
                          return (
                            <div key={`${id}-${idx}`} id={id} className={`mt-4 scroll-mt-24 ${indentClass()}`}>
                              <h5 className="group text-[15px] font-semibold leading-snug text-slate-900">{anchor}</h5>
                            </div>
                          );
                        }

                        return (
                          <div key={`${id}-${idx}`} id={id} className={`mt-4 scroll-mt-24 ${indentClass()}`}>
                            <h6 className="group text-[14px] font-semibold leading-snug text-slate-900">{anchor}</h6>
                          </div>
                        );
                      }

                      if (n.type === "ul") {
                        return (
                          <ul key={`ul-${idx}`} className={`mt-4 list-disc space-y-2 pl-6 text-justify ${indentClass()}`}>
                            {n.items.map((it, j) => (
                              <li key={`uli-${idx}-${j}`} className="pl-1">
                                {renderInline(it)}
                              </li>
                            ))}
                          </ul>
                        );
                      }

                      if (n.type === "ol") {
                        return (
                          <ol
                            key={`ol-${idx}`}
                            className={`mt-4 list-decimal space-y-2 pl-6 text-justify marker:font-semibold marker:text-slate-500 ${indentClass()}`}
                          >
                            {n.items.map((it, j) => (
                              <li key={`oli-${idx}-${j}`} className="pl-1">
                                {renderInline(it)}
                              </li>
                            ))}
                          </ol>
                        );
                      }

                      const text = n.text.replace(/\n+/g, " ").trim();
                      if (!leadShown && text.length > 0) {
                        leadShown = true;
                        return (
                          <div
                            key={`lead-${idx}`}
                            className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[16px] leading-8 text-slate-800"
                          >
                            {renderDropCap(text)}
                          </div>
                        );
                      }

                      if (isCallout(text)) {
                        return (
                          <div key={`callout-${idx}`} className={`mt-5 ${indentClass()}`}>
                            <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-4 shadow-sm">
                              <div className="text-justify font-medium text-slate-800">{renderInline(text)}</div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <p key={`p-${idx}`} className={`mt-4 text-justify ${indentClass()}`}>
                          {renderInline(text)}
                        </p>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </article>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">Baca juga</div>
              <div className="mt-3 grid gap-2 text-sm">
                <Link href="/properti" className="font-semibold text-sky-700 hover:text-sky-800 hover:underline">
                  Jelajahi listing Smart Living terverifikasi
                </Link>
                <Link href="/kpr" className="font-semibold text-sky-700 hover:text-sky-800 hover:underline">
                  Bandingkan produk bank di Simulasi KPR
                </Link>
                <Link href="/tentang" className="font-semibold text-sky-700 hover:text-sky-800 hover:underline">
                  Kenali Livinova dan ekosistem Smart Living
                </Link>
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">Butuh bantuan?</div>
              <div className="mt-2 text-sm text-slate-600">
                Konsultasi gratis untuk memilih properti Smart Living dan menghitung estimasi cicilan.
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/kontak"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Hubungi Kami
                </Link>
                <Link
                  href="/kpr"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Simulasi KPR
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Referensi eksternal</div>
            <div className="mt-3 grid gap-2 text-sm">
              <a
                href="https://www.ojk.go.id/"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-sky-700 hover:text-sky-800 hover:underline"
              >
                OJK — informasi layanan keuangan
              </a>
              <a
                href="https://www.bi.go.id/"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-sky-700 hover:text-sky-800 hover:underline"
              >
                Bank Indonesia — kebijakan moneter
              </a>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

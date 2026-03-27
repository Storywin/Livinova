import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Container } from "@/components/site/container";
import { apiFetch } from "@/lib/api";

type PageDetail = {
  slug: string;
  title: string;
  content: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  updatedAt: string;
};

type SeoSettings = {
  siteName: string;
  titleTemplate: string;
  defaultMetaDescription: string | null;
};

function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  return envUrl && envUrl.trim() ? envUrl.trim().replace(/\/$/, "") : "http://localhost:3000";
}

async function getPage(slug: string) {
  return apiFetch<PageDetail>(`/public/pages/${slug}`);
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

function parseContent(body: string): ContentNode[] {
  const lines = body.split("\n").map((l) => l.replace(/\r/g, ""));
  const nodes: ContentNode[] = [];
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
  return nodes;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let page: PageDetail | null = null;
  let seo: SeoSettings | null = null;
  try {
    page = await getPage(slug);
  } catch {
    page = null;
  }
  try {
    seo = await getSeoSettings();
  } catch {
    seo = null;
  }
  const baseTitle = page?.metaTitle ?? page?.title ?? "Halaman";
  const title = seo ? applyTitleTemplate(seo.titleTemplate, baseTitle) : baseTitle;
  const description = page?.metaDescription ?? seo?.defaultMetaDescription ?? "Halaman Livinova";
  const canonical = page?.canonicalUrl ?? `/halaman/${slug}`;
  return {
    title,
    description,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      images: page?.ogImageUrl ? [page.ogImageUrl] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let page: PageDetail | null = null;
  try {
    page = await getPage(slug);
  } catch {
    page = null;
  }
  if (!page) {
    return (
      <main className="py-12">
        <Container>
          <div className="text-slate-700">Halaman tidak ditemukan.</div>
        </Container>
      </main>
    );
  }

  const nodes = parseContent(page.content ?? "");

  return (
    <main className="py-12">
      <Container>
        <div className="mx-auto max-w-4xl">
          <div className="text-xs text-slate-500">
            <Link href="/halaman" className="font-semibold text-slate-700 hover:text-slate-900 hover:underline">
              Halaman
            </Link>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{page.title}</h1>
          <div className="mt-2 text-sm text-slate-500">Diperbarui {new Date(page.updatedAt).toLocaleDateString("id-ID")}</div>

          <article className="prose prose-slate mt-8 max-w-none">
            {nodes.map((n, idx) => {
              if (n.type === "heading") {
                const Tag = (`h${n.level}` as unknown) as "h2";
                return (
                  <Tag key={idx} id={n.id} className="scroll-mt-24">
                    {n.text}
                  </Tag>
                );
              }
              if (n.type === "ul") {
                return (
                  <ul key={idx}>
                    {n.items.map((it, j) => (
                      <li key={j}>{renderInline(it)}</li>
                    ))}
                  </ul>
                );
              }
              if (n.type === "ol") {
                return (
                  <ol key={idx}>
                    {n.items.map((it, j) => (
                      <li key={j}>{renderInline(it)}</li>
                    ))}
                  </ol>
                );
              }
              return (
                <p key={idx} className="whitespace-pre-line">
                  {renderInline(n.text)}
                </p>
              );
            })}
          </article>
        </div>
      </Container>
    </main>
  );
}

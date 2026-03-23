import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeveloperProfileTemplate, type DeveloperPublic, type PublicListingCard } from "@/components/developers/developer-profile-templates";
import { apiFetch } from "@/lib/api";

type Paginated<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  return envUrl && envUrl.trim() ? envUrl.trim().replace(/\/$/, "") : "http://localhost:3000";
}

async function getDeveloper(slug: string) {
  return apiFetch<DeveloperPublic | null>(`/public/developers/${slug}`);
}

async function getDeveloperListings(slug: string) {
  return apiFetch<Paginated<PublicListingCard>>(`/public/listings?developerSlug=${encodeURIComponent(slug)}&page=1&pageSize=9&sort=featured`);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const siteUrl = getSiteUrl();
  let developer: DeveloperPublic | null = null;
  try {
    developer = await getDeveloper(slug);
  } catch {
    developer = null;
  }
  if (!developer) {
    return {
      title: "Profil Developer | Livinova",
      description: "Profil developer Smart Living terverifikasi di Livinova.",
      metadataBase: new URL(siteUrl),
      alternates: { canonical: `/developer/${slug}` },
      robots: { index: false, follow: false },
    };
  }

  const title = `${developer.name} — Profil Developer | Livinova`;
  const description =
    developer.description ??
    `Profil developer ${developer.name}. Lihat proyek, listing properti, dan kontak untuk Smart Living terverifikasi di Livinova.`;

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical: `/developer/${developer.slug}` },
    openGraph: {
      type: "website",
      url: `/developer/${developer.slug}`,
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function DeveloperProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const siteUrl = getSiteUrl();
  const developer = await getDeveloper(slug);
  if (!developer) notFound();

  let listings: PublicListingCard[] = [];
  try {
    const res = await getDeveloperListings(developer.slug);
    listings = res.items ?? [];
  } catch {
    listings = [];
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Beranda", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "Developer", item: `${siteUrl}/properti` },
          { "@type": "ListItem", position: 3, name: developer.name, item: `${siteUrl}/developer/${developer.slug}` },
        ],
      },
      {
        "@type": "Organization",
        name: developer.name,
        url: `${siteUrl}/developer/${developer.slug}`,
        ...(developer.website ? { sameAs: [developer.website] } : {}),
        ...(developer.address || developer.city || developer.province
          ? {
              address: {
                "@type": "PostalAddress",
                streetAddress: developer.address ?? undefined,
                addressLocality: developer.city ?? undefined,
                addressRegion: developer.province ?? undefined,
                addressCountry: "ID",
              },
            }
          : {}),
        ...(developer.email ? { email: developer.email } : {}),
        ...(developer.phone ? { telephone: developer.phone } : {}),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DeveloperProfileTemplate developer={developer} listings={listings} />
    </>
  );
}


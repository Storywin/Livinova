import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  return envUrl && envUrl.trim() ? envUrl.trim().replace(/\/$/, "") : "http://localhost:3000";
}

export const metadata: Metadata = {
  title: "Tentang Livinova — Marketplace Properti Smart Living",
  description:
    "Livinova adalah marketplace properti premium untuk proyek Smart Living terverifikasi. Jelajahi listing, bandingkan KPR, dan kenali teknologi Smart Home.",
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: "/tentang" },
  openGraph: {
    type: "website",
    url: "/tentang",
    title: "Tentang Livinova — Marketplace Properti Smart Living",
    description:
      "Livinova adalah marketplace properti premium untuk proyek Smart Living terverifikasi. Jelajahi listing, bandingkan KPR, dan kenali teknologi Smart Home.",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tentang Livinova — Marketplace Properti Smart Living",
    description:
      "Livinova adalah marketplace properti premium untuk proyek Smart Living terverifikasi. Jelajahi listing, bandingkan KPR, dan kenali teknologi Smart Home.",
  },
  robots: { index: true, follow: true },
  keywords: ["tentang", "livinova", "smart living", "smart home", "marketplace properti", "developer", "indonesia"],
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Livinova",
    url: `${getSiteUrl()}/tentang`,
    logo: `${getSiteUrl()}/logo.png`,
    description:
      "Marketplace properti premium untuk proyek Smart Living terverifikasi. Jelajahi listing, bandingkan KPR, dan pelajari ekosistem Smart Home.",
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-28 h-[560px] w-[560px] rounded-full bg-violet-500/16 blur-3xl" />
        <div className="absolute -right-28 -top-20 h-[620px] w-[620px] rounded-full bg-sky-500/18 blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-emerald-500/12 blur-3xl" />
      </div>

      <Container className="py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 shadow-sm backdrop-blur">
              Smart Living • Terverifikasi
            </div>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              Marketplace Properti untuk Masa Depan Smart Living
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Livinova membantu keluarga Indonesia menemukan hunian modern yang terintegrasi Smart Home. Kami memilih proyek
              terverifikasi, menyediakan detail yang jelas, dan simulasi KPR yang transparan.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="h-11 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-500 to-blue-600 text-white">
                <Link href="/properti">Jelajahi Properti</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-xl">
                <Link href="/kpr">Bandingkan KPR</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-sky-500/18 via-violet-500/14 to-emerald-500/12" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="shadow-sm">
                  <CardContent className="p-5">
                    <div className="text-3xl font-semibold tracking-tight text-slate-900">+50</div>
                    <div className="mt-1 text-sm text-slate-600">Proyek Smart Living</div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-5">
                    <div className="text-3xl font-semibold tracking-tight text-slate-900">+20</div>
                    <div className="mt-1 text-sm text-slate-600">Developer Terverifikasi</div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-5">
                    <div className="text-3xl font-semibold tracking-tight text-slate-900">+1.000</div>
                    <div className="mt-1 text-sm text-slate-600">Pengunjung per bulan</div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-5">
                    <div className="text-3xl font-semibold tracking-tight text-slate-900">24/7</div>
                    <div className="mt-1 text-sm text-slate-600">Dukungan & Konsultasi</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="text-base font-semibold text-slate-900">Kurasi Proyek</div>
              <p className="mt-2 text-sm text-slate-600">
                Setiap proyek diperiksa status, legalitas, kesiapan Smart Living, dan reputasi developer.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="text-base font-semibold text-slate-900">Teknologi Smart Home</div>
              <p className="mt-2 text-sm text-slate-600">
                Visualisasi fitur IoT, keamanan, energi, dan kenyamanan yang terintegrasi dalam hunian.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="text-base font-semibold text-slate-900">Simulasi KPR Transparan</div>
              <p className="mt-2 text-sm text-slate-600">
                Bandingkan produk bank, bunga/margin, estimasi cicilan, dan biaya-biaya utama lainnya.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="p-8">
              <div className="text-xl font-semibold text-slate-900">Untuk Developer</div>
              <p className="mt-2 text-slate-600">
                Tingkatkan visibilitas proyek, tampilkan kesiapan Smart Living, dan terima prospek berkualitas.
              </p>
              <div className="mt-5">
                <Button asChild className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                  <Link href="/developer/daftar">Daftar Developer</Link>
                </Button>
              </div>
            </div>
            <div className="relative hidden md:block">
              <Image src="/properties/livinova-residence-tipe-a.svg" alt="Ilustrasi Smart Living" fill className="object-cover" />
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

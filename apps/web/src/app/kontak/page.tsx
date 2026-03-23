import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  return envUrl && envUrl.trim() ? envUrl.trim().replace(/\/$/, "") : "http://localhost:3000";
}

export const metadata: Metadata = {
  title: "Kontak Livinova — Konsultasi Properti & Smart Living",
  description:
    "Hubungi Livinova untuk pertanyaan listing, kerjasama developer, dan konsultasi Smart Living. Kami siap membantu.",
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: "/kontak" },
  openGraph: {
    type: "website",
    url: "/kontak",
    title: "Kontak Livinova — Konsultasi Properti & Smart Living",
    description:
      "Hubungi Livinova untuk pertanyaan listing, kerjasama developer, dan konsultasi Smart Living. Kami siap membantu.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kontak Livinova — Konsultasi Properti & Smart Living",
    description:
      "Hubungi Livinova untuk pertanyaan listing, kerjasama developer, dan konsultasi Smart Living. Kami siap membantu.",
  },
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  const waUrl =
    "https://wa.me/625882449242?text=Halo%20Livinova%2C%20saya%20tertarik%20dengan%20salah%20satu%20rumah%2C%20boleh%20saya%20tanya%20lebih%20detail%3F";
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-28 h-[560px] w-[560px] rounded-full bg-violet-500/16 blur-3xl" />
        <div className="absolute -right-28 -top-20 h-[620px] w-[620px] rounded-full bg-sky-500/18 blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-emerald-500/12 blur-3xl" />
      </div>

      <Container className="py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 shadow-sm backdrop-blur">
                Hubungi Kami
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">Kontak Livinova</h1>
              <p className="mt-3 text-slate-600">
                Tim kami siap membantu pertanyaan tentang listing, simulasi KPR, dan kerjasama developer.
              </p>
            </div>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Email</div>
                    <div className="mt-1 text-sm text-slate-600">hello@livinova.id</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Lokasi</div>
                    <div className="mt-1 text-sm text-slate-600">Jakarta • Indonesia</div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button asChild className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-500">
                    <Link href={waUrl} target="_blank" rel="noreferrer">
                      Chat WhatsApp
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="grid gap-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nama</Label>
                      <Input placeholder="Nama lengkap" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input placeholder="email@contoh.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Pesan</Label>
                    <textarea
                      rows={5}
                      placeholder="Tulis pertanyaan atau informasi yang ingin kamu ketahui"
                      className="h-32 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">Kirim</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
            <div className="relative aspect-[4/3] w-full rounded-t-[28px]">
              <iframe
                title="Livinova Map"
                src="https://www.google.com/maps?q=Jakarta%2C%20Indonesia&output=embed"
                className="h-full w-full rounded-t-[28px] border-0"
                loading="lazy"
              />
            </div>
            <div className="p-6 text-sm text-slate-600">
              Jika ingin bertemu atau presentasi produk Smart Living, hubungi kami untuk menjadwalkan.
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Home, MapPin, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-28 h-[560px] w-[560px] rounded-full bg-violet-500/16 blur-3xl" />
        <div className="absolute -right-28 -top-20 h-[620px] w-[620px] rounded-full bg-sky-500/18 blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-emerald-500/12 blur-3xl" />
        <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] [background-size:28px_28px] opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/20 to-white/70" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12">
        <div className="grid w-full gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-violet-600" />
              Smart Living Navigation
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.15)]">
                <Image src="/logo.png" alt="Livinova" fill sizes="48px" className="object-contain p-2" />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Livinova</div>
                <div className="text-lg font-semibold tracking-tight text-slate-900">Properti • Smart Living</div>
              </div>
            </div>

            <div className="mt-8 text-6xl font-semibold tracking-tight text-slate-900 md:text-7xl">404</div>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Halaman tidak ditemukan
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
              Sepertinya tautan yang kamu buka sudah berubah atau tidak tersedia. Gunakan menu di bawah untuk kembali ke pencarian
              properti dan fitur Smart Living lainnya.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                asChild
                className="h-11 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-500 to-blue-600 text-white shadow-[0_20px_60px_rgba(2,132,199,0.28)] ring-1 ring-white/40 transition hover:from-sky-500 hover:via-cyan-400 hover:to-blue-500 hover:shadow-[0_30px_80px_rgba(2,132,199,0.36)]"
              >
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Kembali ke Beranda
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-xl border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
              >
                <Link href="/properti">
                  <Search className="mr-2 h-4 w-4" />
                  Cari Properti
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white/75 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-sky-500/18 via-violet-500/14 to-emerald-500/12" />
              <div className="relative">
                <div className="text-sm font-semibold text-slate-900">Tujuan populer</div>
                <div className="mt-1 text-sm text-slate-600">Akses cepat ke halaman yang sering dicari.</div>

                <div className="mt-6 grid gap-3">
                  <Link
                    href="/properti"
                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 ring-1 ring-sky-200">
                        <MapPin className="h-5 w-5 text-sky-700" />
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Listing Properti</div>
                        <div className="text-xs text-slate-600">Jelajahi proyek unggulan dan terbaru.</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-900" />
                  </Link>

                  <Link
                    href="/kpr"
                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-200">
                        <Search className="h-5 w-5 text-emerald-700" />
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Simulasi KPR</div>
                        <div className="text-xs text-slate-600">Bandingkan produk bank dan estimasi cicilan.</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-900" />
                  </Link>

                  <Link
                    href="/promo"
                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 ring-1 ring-violet-200">
                        <Sparkles className="h-5 w-5 text-violet-700" />
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Promo & Iklan</div>
                        <div className="text-xs text-slate-600">Lihat kampanye dan penawaran terbaru.</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-900" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

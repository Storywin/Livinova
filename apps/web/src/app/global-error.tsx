"use client";

import Image from "next/image";
import Link from "next/link";
import { RotateCcw, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="id">
      <body className="bg-slate-50">
        <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 -top-28 h-[560px] w-[560px] rounded-full bg-violet-500/16 blur-3xl" />
            <div className="absolute -right-28 -top-20 h-[620px] w-[620px] rounded-full bg-sky-500/18 blur-3xl" />
            <div className="absolute -bottom-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-emerald-500/12 blur-3xl" />
            <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] [background-size:28px_28px] opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/20 to-white/70" />
          </div>

          <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
            <div className="w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white/75 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur">
              <div className="pointer-events-none relative h-24 bg-gradient-to-r from-sky-500/18 via-violet-500/14 to-emerald-500/12" />
              <div className="grid gap-8 p-6 md:grid-cols-[1fr_220px] md:items-center md:p-10">
                <div>
                  <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                    Terjadi kesalahan sistem
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Coba muat ulang halaman ini. Jika masih terjadi, kembali ke beranda dan lanjutkan pencarian properti.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      onClick={() => reset()}
                      className="h-11 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-500 to-blue-600 text-white shadow-[0_20px_60px_rgba(2,132,199,0.28)] ring-1 ring-white/40 transition hover:from-sky-500 hover:via-cyan-400 hover:to-blue-500 hover:shadow-[0_30px_80px_rgba(2,132,199,0.36)]"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Muat ulang
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="h-11 rounded-xl border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                    >
                      <Link href="/">Kembali ke Beranda</Link>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="relative h-36 w-36 rounded-[28px] bg-white ring-1 ring-slate-200 shadow-[0_25px_70px_rgba(15,23,42,0.12)]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldAlert className="h-12 w-12 text-slate-900/85" />
                    </div>
                    <div className="absolute -bottom-3 left-1/2 h-10 w-40 -translate-x-1/2 rounded-full bg-sky-500/16 blur-xl" />
                    <Image src="/logo.png" alt="" fill sizes="144px" className="object-contain p-10 opacity-15" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}

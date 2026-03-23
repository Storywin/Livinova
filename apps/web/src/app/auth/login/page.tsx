"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Building2, Cpu, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      schema.parse(values);
      const result = await apiFetch<{
        user: { id: string; email: string; roles: string[] };
        tokens: { accessToken: string; refreshToken: string };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });

      localStorage.setItem("livinova_access_token", result.tokens.accessToken);
      localStorage.setItem("livinova_refresh_token", result.tokens.refreshToken);
      router.push("/");
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.issues[0]?.message ?? "Data tidak valid");
        return;
      }
      if (e instanceof ApiError) {
        setError(e.message);
        return;
      }
      setError("Terjadi kesalahan. Coba lagi.");
    }
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-28 h-[560px] w-[560px] rounded-full bg-violet-500/18 blur-3xl" />
        <div className="absolute -right-28 -top-20 h-[620px] w-[620px] rounded-full bg-sky-500/18 blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [background-size:28px_28px] opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
        <div className="grid w-full gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/75 hover:text-white">
              ← Kembali ke Beranda
            </Link>

            <div className="mt-8 flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/15 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
                <Image src="/logo.png" alt="Livinova" fill sizes="48px" className="object-contain p-2" />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide text-white/70">Livinova</div>
                <div className="text-lg font-semibold tracking-tight text-white">Smart Living Property Platform</div>
              </div>
            </div>

            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Masuk ke Portal Smart Living
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75">
              Kelola inquiry, favorit, dan akses portal sesuai peran. Semua pengalaman dibuat untuk ekosistem perumahan modern yang
              terintegrasi Smart Home.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/15">
                <Sparkles className="h-4 w-4 text-violet-200" />
                Premium UI
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/15">
                <Cpu className="h-4 w-4 text-sky-200" />
                Smart Home Ready
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/15">
                <ShieldCheck className="h-4 w-4 text-emerald-200" />
                Keamanan Akun
              </span>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Building2 className="h-4 w-4 text-white/80" />
                  Proyek Terverifikasi
                </div>
                <div className="mt-2 text-sm text-white/70">Detail properti lengkap, galeri, denah, video, dan virtual tour.</div>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Cpu className="h-4 w-4 text-white/80" />
                  Smart Living Insight
                </div>
                <div className="mt-2 text-sm text-white/70">Pantau kesiapan smart home, progress pembangunan, dan estimasi KPR.</div>
              </div>
            </div>
          </div>

          <Card className="relative overflow-hidden border border-white/15 bg-white/10 shadow-[0_30px_90px_rgba(15,23,42,0.55)] backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-[0_50px_120px_rgba(2,132,199,0.25)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-sky-500/25 via-violet-500/20 to-emerald-500/20" />
            <CardHeader className="relative">
              <CardTitle className="text-white">Masuk</CardTitle>
              <div className="mt-1 text-sm text-white/70">Gunakan akun kamu untuk mengakses fitur portal.</div>
            </CardHeader>
            <CardContent className="relative">
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="h-11 rounded-xl border-white/15 bg-white/90 text-slate-900 placeholder:text-slate-400"
                    {...register("email")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80">
                    Kata Sandi
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="h-11 rounded-xl border-white/15 bg-white/90 text-slate-900 placeholder:text-slate-400"
                    {...register("password")}
                  />
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-200/60 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                    {error}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-sky-600 via-cyan-500 to-blue-600 text-white shadow-[0_20px_60px_rgba(2,132,199,0.35)] ring-1 ring-white/10 transition hover:from-sky-500 hover:via-cyan-400 hover:to-blue-500 hover:shadow-[0_30px_80px_rgba(2,132,199,0.45)]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Memproses..." : "Masuk"}
                </Button>
              </form>

              <div className="mt-6 text-sm text-white/75">
                Belum punya akun?{" "}
                <Link href="/auth/register" className="font-semibold text-white hover:underline">
                  Daftar
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

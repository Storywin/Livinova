"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Banknote, Building2, Cpu, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

import { HomeSearch } from "./home-search";

type Slide = {
  eyebrow: string;
  title: string;
  subtitle: string;
  accent: "sky" | "emerald" | "violet" | "amber" | "navy";
  Icon: typeof ShieldCheck;
};

function AccentLayer({ accent }: { accent: Slide["accent"] }) {
  const bg =
    accent === "sky"
      ? "from-sky-600/22 via-cyan-500/14 to-white"
      : accent === "emerald"
        ? "from-emerald-600/22 via-teal-500/14 to-white"
        : accent === "violet"
          ? "from-violet-600/22 via-fuchsia-500/14 to-white"
          : accent === "amber"
            ? "from-amber-500/22 via-orange-500/14 to-white"
            : "from-slate-900/18 via-slate-900/10 to-white";

  const glowA =
    accent === "sky"
      ? "bg-sky-500/25"
      : accent === "emerald"
        ? "bg-emerald-500/22"
        : accent === "violet"
          ? "bg-violet-500/22"
          : accent === "amber"
            ? "bg-amber-500/22"
            : "bg-slate-900/16";

  const glowB =
    accent === "sky"
      ? "bg-cyan-500/18"
      : accent === "emerald"
        ? "bg-teal-500/18"
        : accent === "violet"
          ? "bg-fuchsia-500/18"
          : accent === "amber"
            ? "bg-orange-500/18"
            : "bg-slate-900/10";

  return (
    <div className="pointer-events-none absolute inset-0">
      <div className={cn("absolute inset-0 bg-gradient-to-b", bg)} />
      <div className={cn("absolute -left-24 -top-28 h-[520px] w-[520px] rounded-full blur-3xl", glowA)} />
      <div className={cn("absolute -right-24 -top-16 h-[520px] w-[520px] rounded-full blur-3xl", glowB)} />
      <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.10)_1px,transparent_0)] [background-size:24px_24px] opacity-50" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-white" />
    </div>
  );
}

function SmartLivingScene({ accent }: { accent: Slide["accent"] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const ry = (px - 0.5) * 12;
      const rx = -(py - 0.5) * 10;
      setTilt({ rx, ry });
    };

    const onLeave = () => setTilt({ rx: 0, ry: 0 });

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const stroke =
    accent === "sky"
      ? "rgba(14,165,233,0.62)"
      : accent === "emerald"
        ? "rgba(16,185,129,0.62)"
        : accent === "violet"
          ? "rgba(139,92,246,0.62)"
          : accent === "amber"
            ? "rgba(245,158,11,0.62)"
            : "rgba(15,23,42,0.40)";

  const accentFill =
    accent === "sky"
      ? "rgba(14,165,233,0.14)"
      : accent === "emerald"
        ? "rgba(16,185,129,0.14)"
        : accent === "violet"
          ? "rgba(139,92,246,0.14)"
          : accent === "amber"
            ? "rgba(245,158,11,0.14)"
            : "rgba(15,23,42,0.10)";

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <style>{`
        @keyframes lv-float { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-8px) } }
        @keyframes lv-float2 { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(10px) } }
        @keyframes lv-pulse { 0%,100% { opacity: .45 } 50% { opacity: 1 } }
        @keyframes lv-dash { 0% { stroke-dashoffset: 220 } 100% { stroke-dashoffset: 0 } }
        @keyframes lv-stage0 { 0%, 26% { opacity: 1 } 33%, 100% { opacity: 0 } }
        @keyframes lv-stage1 { 0%, 30% { opacity: 0 } 38%, 60% { opacity: 1 } 68%, 100% { opacity: 0 } }
        @keyframes lv-stage2 { 0%, 64% { opacity: 0 } 72%, 100% { opacity: 1 } }
      `}</style>

      <div
        ref={ref}
        className="relative overflow-hidden rounded-3xl border border-white/25 bg-white/55 shadow-[0_30px_80px_rgba(15,23,42,0.18)] backdrop-blur motion-reduce:transform-none"
        style={{
          transform: `perspective(1200px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformOrigin: "center",
          transition: "transform 120ms ease",
        }}
      >
        <div className="absolute inset-0">
          <div className="absolute -left-16 -top-20 h-[420px] w-[420px] rounded-full blur-3xl" style={{ background: accentFill }} />
          <div className="absolute -bottom-24 -right-16 h-[420px] w-[420px] rounded-full bg-slate-900/10 blur-3xl" />
          <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.10)_1px,transparent_0)] [background-size:26px_26px] opacity-40" />
        </div>

        <div className="relative aspect-[16/12]">
          <svg viewBox="0 0 560 420" className="h-full w-full" role="img" aria-label="Smart Living 3D Scene">
            <defs>
              <linearGradient id="lv-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor={stroke} stopOpacity="0.9" />
                <stop offset="1" stopColor="rgba(15,23,42,0.12)" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="lv-g2" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="rgba(255,255,255,0.55)" />
                <stop offset="1" stopColor={stroke} stopOpacity="0.35" />
              </linearGradient>
              <filter id="lv-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="#0f172a" floodOpacity="0.18" />
              </filter>
            </defs>

            <g opacity="0.95">
              <rect x="26" y="26" width="508" height="326" rx="28" fill="rgba(255,255,255,0.25)" stroke="url(#lv-g)" strokeWidth="2" />
              <rect x="56" y="62" width="448" height="18" rx="9" fill="rgba(15,23,42,0.06)" />
              <rect x="56" y="88" width="260" height="10" rx="5" fill="rgba(15,23,42,0.05)" />
            </g>

            <g filter="url(#lv-shadow)">
              <path d="M120 258 L280 160 L440 258 L280 346 Z" fill="rgba(255,255,255,0.18)" stroke="rgba(15,23,42,0.08)" strokeWidth="2" />
              <path d="M120 258 L280 160 L280 304 L120 346 Z" fill="rgba(15,23,42,0.06)" />
              <path d="M280 160 L440 258 L440 346 L280 304 Z" fill={accentFill} />
              <path d="M158 256 L280 184 L402 256 L280 328 Z" fill="rgba(255,255,255,0.12)" stroke="rgba(15,23,42,0.08)" strokeWidth="2" />
              <rect x="170" y="244" width="82" height="58" rx="12" fill="rgba(255,255,255,0.18)" />
              <rect x="308" y="244" width="82" height="58" rx="12" fill="rgba(255,255,255,0.18)" />
              <rect x="262" y="270" width="36" height="76" rx="10" fill="rgba(15,23,42,0.08)" />
            </g>

            <g opacity="0.9">
              <circle cx="120" cy="116" r="7" fill={stroke} />
              <circle cx="200" cy="94" r="6" fill="rgba(15,23,42,0.20)" />
              <circle cx="280" cy="82" r="7" fill={stroke} />
              <circle cx="360" cy="96" r="6" fill="rgba(15,23,42,0.20)" />
              <circle cx="440" cy="120" r="7" fill={stroke} />
              <path
                d="M120 116 C170 84, 230 84, 280 82 C336 80, 392 96, 440 120"
                fill="none"
                stroke="rgba(15,23,42,0.16)"
                strokeWidth="2"
              />
            </g>

            <g style={{ animation: "lv-stage0 9.6s ease-in-out infinite" }}>
              <text x="58" y="146" fontSize="12" fill="rgba(15,23,42,0.55)" fontWeight="600">
                Tahap 1: Perumahan Standar
              </text>
              <path d="M64 168 H228" stroke="rgba(15,23,42,0.18)" strokeWidth="3" strokeLinecap="round" />
              <circle cx="76" cy="168" r="4" fill="rgba(15,23,42,0.30)" />
              <circle cx="110" cy="168" r="4" fill="rgba(15,23,42,0.22)" />
              <circle cx="144" cy="168" r="4" fill="rgba(15,23,42,0.18)" />
            </g>

            <g style={{ animation: "lv-stage1 9.6s ease-in-out infinite" }}>
              <text x="58" y="146" fontSize="12" fill="rgba(15,23,42,0.55)" fontWeight="600">
                Tahap 2: Integrasi Perangkat
              </text>
              <path d="M64 168 H292" stroke="rgba(15,23,42,0.18)" strokeWidth="3" strokeLinecap="round" />
              <path
                d="M280 210 C250 200, 220 206, 210 230"
                fill="none"
                stroke={stroke}
                strokeWidth="3"
                strokeLinecap="round"
                style={{ strokeDasharray: 220, animation: "lv-dash 2.2s ease-out infinite" }}
              />
              <circle cx="300" cy="196" r="10" fill="rgba(255,255,255,0.28)" stroke={stroke} strokeWidth="2" />
              <path
                d="M296 196c4-8 12-8 16 0"
                fill="none"
                stroke={stroke}
                strokeWidth="2"
                strokeLinecap="round"
                style={{ animation: "lv-pulse 1.8s ease-in-out infinite" }}
              />
              <path
                d="M298 199c3-5 9-5 12 0"
                fill="none"
                stroke={stroke}
                strokeWidth="2"
                strokeLinecap="round"
                style={{ animation: "lv-pulse 1.8s ease-in-out infinite" }}
              />
              <circle cx="280" cy="328" r="5" fill={stroke} style={{ animation: "lv-pulse 1.6s ease-in-out infinite" }} />
              <circle cx="350" cy="274" r="5" fill={stroke} style={{ animation: "lv-pulse 1.6s ease-in-out infinite" }} />
            </g>

            <g style={{ animation: "lv-stage2 9.6s ease-in-out infinite" }}>
              <text x="58" y="146" fontSize="12" fill="rgba(15,23,42,0.55)" fontWeight="600">
                Tahap 3: Smart Living Aktif
              </text>
              <path d="M64 168 H350" stroke="rgba(15,23,42,0.18)" strokeWidth="3" strokeLinecap="round" />
              <circle cx="402" cy="214" r="14" fill="url(#lv-g2)" />
              <path d="M398 216l6 6 12-14" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M280 210 C310 180, 370 180, 400 214"
                fill="none"
                stroke={stroke}
                strokeWidth="3"
                strokeLinecap="round"
                style={{ strokeDasharray: 220, animation: "lv-dash 1.8s ease-out infinite" }}
              />
              <circle cx="212" cy="274" r="8" fill="rgba(255,255,255,0.30)" stroke={stroke} strokeWidth="2" />
              <circle cx="352" cy="274" r="8" fill="rgba(255,255,255,0.30)" stroke={stroke} strokeWidth="2" />
              <circle cx="280" cy="334" r="9" fill="rgba(255,255,255,0.30)" stroke={stroke} strokeWidth="2" />
              <path
                d="M212 274 C240 300, 260 314, 280 334 C300 314, 320 300, 352 274"
                fill="none"
                stroke="rgba(15,23,42,0.16)"
                strokeWidth="2"
              />
              <circle cx="212" cy="274" r="3" fill={stroke} style={{ animation: "lv-pulse 1.2s ease-in-out infinite" }} />
              <circle cx="352" cy="274" r="3" fill={stroke} style={{ animation: "lv-pulse 1.2s ease-in-out infinite" }} />
              <circle cx="280" cy="334" r="3" fill={stroke} style={{ animation: "lv-pulse 1.2s ease-in-out infinite" }} />
            </g>

            <g opacity="0.9">
              <rect x="62" y="372" width="436" height="12" rx="6" fill="rgba(15,23,42,0.10)" />
              <rect x="112" y="392" width="336" height="10" rx="5" fill="rgba(15,23,42,0.08)" />
            </g>
          </svg>

          <div
            className="absolute left-6 top-10 hidden rounded-2xl border border-white/25 bg-white/65 px-4 py-3 shadow-sm backdrop-blur md:block motion-reduce:animate-none"
            style={{ animation: "lv-float 7s ease-in-out infinite" }}
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Smart Device</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">Sensor & Otomasi</div>
            <div className="mt-1 text-xs text-slate-600">Lampu, CCTV, smart lock, energi.</div>
          </div>

          <div
            className="absolute bottom-6 right-6 hidden rounded-2xl border border-white/25 bg-white/65 px-4 py-3 shadow-sm backdrop-blur md:block motion-reduce:animate-none"
            style={{ animation: "lv-float2 6.5s ease-in-out infinite" }}
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">Smart Living Aktif</div>
            <div className="mt-1 text-xs text-slate-600">Terhubung • Terpantau • Aman</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroCarousel() {
  const slides: Slide[] = useMemo(
    () => [
      {
        eyebrow: "Marketplace Properti • Terverifikasi",
        title: "Cari Properti Smart Living yang Aman & Terpercaya",
        subtitle: "Cari berdasarkan kota, area, nama properti, atau nama developer — cukup 1 kolom.",
        accent: "sky",
        Icon: ShieldCheck,
      },
      {
        eyebrow: "Smart Living • Tech-forward",
        title: "Dibuat untuk Proyek dengan Fitur Smart Home Terstruktur",
        subtitle: "Bandingkan fitur, spesifikasi, dan status verifikasi dalam tampilan premium.",
        accent: "emerald",
        Icon: Cpu,
      },
      {
        eyebrow: "Simulasi KPR • Cepat",
        title: "Dapatkan Estimasi Cicilan KPR dengan Sekali Hitung",
        subtitle: "Produk bank terkonfigurasi dari sistem untuk hasil yang konsisten.",
        accent: "violet",
        Icon: Banknote,
      },
      {
        eyebrow: "Untuk Developer • Growth",
        title: "Tampilkan Proyek Anda di Livinova",
        subtitle: "Ajukan verifikasi developer dan listing proyek untuk menjangkau buyer berkualitas.",
        accent: "amber",
        Icon: Building2,
      },
      {
        eyebrow: "Premium Listing • UI Mewah",
        title: "Kartu Properti yang Rapi, Lengkap, dan Mudah Dipahami",
        subtitle: "Mulai dari harga, info KPR, spesifikasi, sertifikat, hingga tanggal online.",
        accent: "navy",
        Icon: ShieldCheck,
      },
    ],
    [],
  );

  const [active, setActive] = useState(0);
  const count = slides.length;

  useEffect(() => {
    const id = window.setInterval(() => setActive((p) => (p + 1) % count), 6500);
    return () => window.clearInterval(id);
  }, [count]);

  const slide = slides[active];
  const Icon = slide.Icon;

  return (
    <section className="relative border-b border-slate-200 bg-white">
      <div className="relative overflow-hidden">
        <AccentLayer accent={slide.accent} />

        <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-10 md:pb-24 md:pt-14">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/60 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/90 text-white">
                  <Icon className="h-3 w-3" />
                </span>
                <span>{slide.eyebrow}</span>
              </div>

              <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-slate-900 md:text-5xl">
                {slide.title}
              </h1>
              <p className="text-pretty text-base leading-relaxed text-slate-700 md:text-lg">{slide.subtitle}</p>

              <div className="flex items-center gap-2 pt-1">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Banner ${i + 1}`}
                    onClick={() => setActive(i)}
                    className={cn(
                      "h-2.5 w-2.5 rounded-full ring-1 ring-slate-900/20 transition",
                      i === active ? "bg-slate-900 ring-slate-900" : "bg-white hover:bg-slate-100",
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="hidden md:block">
              <SmartLivingScene accent={slide.accent} />
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6">
          <HomeSearch className="-mt-12 w-full border-white/20 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]" />
          <div className="h-8 md:h-10" />
        </div>
      </div>
    </section>
  );
}

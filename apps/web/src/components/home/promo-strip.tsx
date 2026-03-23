"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, ChevronLeft, ChevronRight, Cpu, ShieldCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PromoAccent, promos } from "@/lib/promos";

const AUTO_SCROLL_PX_PER_SEC = 16;

function promoGradient(accent: PromoAccent) {
  if (accent === "sky") return "from-sky-600 to-cyan-500";
  if (accent === "emerald") return "from-emerald-600 to-teal-500";
  if (accent === "violet") return "from-violet-600 to-fuchsia-500";
  if (accent === "amber") return "from-amber-500 to-orange-500";
  return "from-slate-900 to-slate-700";
}

function PromoCover({ title, badge, periodText, accent }: { title: string; badge: string; periodText: string; accent: PromoAccent }) {
  const Icon = badge === "Promo" ? ShieldCheck : badge === "Iklan" ? Building2 : Cpu;
  return (
    <div className={cn("relative h-[140px] w-full overflow-hidden bg-gradient-to-br", promoGradient(accent))}>
      <div className="absolute inset-0 opacity-55 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.28)_1px,transparent_0)] [background-size:22px_22px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent" />
      <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-slate-900 ring-1 ring-white/35 backdrop-blur">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/90 text-white">
          <Icon className="h-3 w-3" />
        </span>
        <span>{badge}</span>
      </div>
      <div className="absolute bottom-3 left-3 right-3">
        <div className="line-clamp-1 text-sm font-semibold tracking-tight text-white">{title}</div>
        <div className="mt-1 line-clamp-1 text-xs text-white/80">{periodText}</div>
      </div>
    </div>
  );
}

export function PromoStrip() {
  const items = useMemo(() => [...promos, ...promos], []);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);
  const resumeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    if (paused) return;

    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      const half = el.scrollWidth / 2;
      const next = el.scrollLeft + (AUTO_SCROLL_PX_PER_SEC * dt) / 1000;
      el.scrollLeft = next >= half ? next - half : next;
      raf = window.requestAnimationFrame(loop);
    };

    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [paused]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const pauseTemporarily = (ms: number) => {
    setPaused(true);
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => setPaused(false), ms);
  };

  const scrollByCards = (dir: "left" | "right") => {
    const el = viewportRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>("[data-promo-card]");
    const cardWidth = first ? first.offsetWidth : 320;
    const gap = 16;
    const delta = dir === "left" ? -(cardWidth + gap) : cardWidth + gap;
    pauseTemporarily(1200);
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section className="py-10 md:py-12">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Promo & Iklan</h2>
            <p className="mt-1 text-sm text-slate-600">Penawaran terbaru dari developer dan kampanye Livinova.</p>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => scrollByCards("left")}
              aria-label="Geser ke kiri"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCards("right")}
              aria-label="Geser ke kanan"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={viewportRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerCancel={() => setPaused(false)}
          className={cn(
            "mt-5 flex w-full gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "snap-x snap-mandatory",
          )}
        >
          {items.map((p, idx) => (
            <Link
              key={`${p.id}-${idx}`}
              href={`/promo/${p.slug}`}
              className="shrink-0 snap-start"
              aria-label={`${p.title} — ${p.ctaLabel}`}
            >
              <Card
                data-promo-card
                className="h-full w-[280px] shrink-0 overflow-hidden shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md md:w-[320px]"
              >
                <PromoCover title={p.title} badge={p.badge} periodText={p.periodText} accent={p.accent} />
                <CardContent className="space-y-2 pt-4">
                  <div className="line-clamp-2 text-xs leading-relaxed text-slate-600">{p.subtitle}</div>
                  <div className="pt-1 text-xs font-semibold text-slate-900">{p.ctaLabel} →</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

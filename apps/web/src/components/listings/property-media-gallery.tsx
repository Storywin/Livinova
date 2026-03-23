"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Film, Images, LayoutGrid, Map, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type ListingMediaItem = {
  id: string;
  url: string;
  kind?: string;
  sortOrder?: number;
};

type TabKey = "foto" | "denah" | "virtual" | "video";

export type VirtualTourItem = {
  id: string;
  title: string;
  embedUrl: string;
};

export type VideoItem = {
  id: string;
  title: string;
  src: string;
  poster?: string;
};

type Props = {
  title: string;
  items: ListingMediaItem[];
  floorplans?: ListingMediaItem[];
  virtualTours?: VirtualTourItem[];
  videos?: VideoItem[];
  className?: string;
};

function isFloorplan(url: string) {
  const u = url.toLowerCase();
  return u.includes("denah") || u.includes("floor") || u.includes("plan");
}

function tabButton(active: boolean) {
  return cn(
    "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
    active
      ? "bg-slate-900 text-white shadow-sm"
      : "bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50",
  );
}

export function PropertyMediaGallery({ title, items, floorplans, virtualTours, videos, className }: Props) {
  const [tab, setTab] = useState<TabKey>("foto");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeVirtual, setActiveVirtual] = useState(0);
  const [activeVideo, setActiveVideo] = useState(0);

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const sa = a.sortOrder ?? 0;
        const sb = b.sortOrder ?? 0;
        if (sa !== sb) return sa - sb;
        return a.url.localeCompare(b.url);
      }),
    [items],
  );

  const photos = useMemo(() => sorted.filter((x) => !isFloorplan(x.url)), [sorted]);
  const derivedFloorplans = useMemo(() => sorted.filter((x) => isFloorplan(x.url)), [sorted]);
  const planItems = floorplans && floorplans.length ? floorplans : derivedFloorplans;
  const tourItems = virtualTours ?? [];
  const videoItems = videos ?? [];

  const hero = photos[0]?.url ?? "/properties/livinova-residence-tipe-a.svg";
  const rightTiles = photos.slice(1, 5);
  const remaining = Math.max(0, photos.length - 5);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
      if (tab === "foto") {
        if (e.key === "ArrowLeft") setActiveIndex((p) => Math.max(0, p - 1));
        if (e.key === "ArrowRight") setActiveIndex((p) => Math.min(photos.length - 1, p + 1));
      }
      if (tab === "denah") {
        if (e.key === "ArrowLeft") setActiveIndex((p) => Math.max(0, p - 1));
        if (e.key === "ArrowRight") setActiveIndex((p) => Math.min(planItems.length - 1, p + 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, photos.length, planItems.length, tab]);

  useEffect(() => {
    if (!open) return;
    const max = tab === "denah" ? planItems.length : photos.length;
    if (activeIndex >= max) setActiveIndex(Math.max(0, max - 1));
  }, [activeIndex, open, photos.length, planItems.length, tab]);

  const openAll = (index: number) => {
    setActiveIndex(index);
    setTab("foto");
    setOpen(true);
  };

  const openVirtual = (index: number) => {
    setActiveVirtual(index);
    setTab("virtual");
    setOpen(true);
  };

  const openVideo = (index: number) => {
    setActiveVideo(index);
    setTab("video");
    setOpen(true);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid gap-3 md:grid-cols-[1.6fr_1fr]">
        <button
          type="button"
          onClick={() => openAll(0)}
          className="group relative overflow-hidden rounded-3xl bg-slate-50 ring-1 ring-slate-200"
          aria-label="Buka galeri foto"
        >
          <div className="relative aspect-[16/10] w-full">
            <Image src={hero} alt={title} fill sizes="(min-width: 768px) 60vw, 100vw" className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-slate-950/0 to-transparent" />
          </div>
          <div className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-900 ring-1 ring-white/35 backdrop-blur">
            <Images className="h-4 w-4" />
            {photos.length} foto
          </div>
        </button>

        <div className="grid gap-3 md:grid-cols-2">
          {rightTiles.map((it, idx) => {
            const absoluteIndex = idx + 1;
            const isLast = idx === rightTiles.length - 1;
            const showMore = remaining > 0 && isLast;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => openAll(absoluteIndex)}
                className="group relative overflow-hidden rounded-3xl bg-slate-50 ring-1 ring-slate-200"
                aria-label="Buka galeri foto"
              >
                <div className="relative aspect-[16/10] w-full">
                  <Image src={it.url} alt={title} fill sizes="(min-width: 768px) 20vw, 50vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-slate-950/0 to-transparent" />
                  {showMore ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-white/35 backdrop-blur">
                        +{remaining}
                      </div>
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}

          {rightTiles.length < 4
            ? Array.from({ length: 4 - rightTiles.length }).map((_, i) => (
                <div key={`empty-${i}`} className="hidden rounded-3xl bg-slate-50 ring-1 ring-slate-200 md:block" />
              ))
            : null}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        <button type="button" onClick={() => setTab("foto")} className={tabButton(tab === "foto")}>
          <Images className="h-4 w-4" />
          foto
        </button>
        <button type="button" onClick={() => setTab("denah")} className={tabButton(tab === "denah")}>
          <LayoutGrid className="h-4 w-4" />
          denah
        </button>
        <button type="button" onClick={() => setTab("virtual")} className={tabButton(tab === "virtual")}>
          <Map className="h-4 w-4" />
          virtual tour
        </button>
        <button type="button" onClick={() => setTab("video")} className={tabButton(tab === "video")}>
          <Film className="h-4 w-4" />
          video
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        {tab === "foto" ? (
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-600">Klik foto untuk melihat galeri.</div>
            <button
              type="button"
              onClick={() => openAll(0)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              Lihat semua
            </button>
          </div>
        ) : tab === "denah" ? (
          planItems.length ? (
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-slate-600">Denah tersedia: {planItems.length} file.</div>
              <button
                type="button"
                onClick={() => {
                  setActiveIndex(0);
                  setTab("denah");
                  setOpen(true);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
              >
                Lihat denah
              </button>
            </div>
          ) : (
            <div className="text-sm text-slate-600">Denah belum tersedia.</div>
          )
        ) : tab === "virtual" ? (
          tourItems.length ? (
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-slate-600">Virtual tour tersedia: {tourItems.length}.</div>
              <button
                type="button"
                onClick={() => openVirtual(0)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
              >
                Buka virtual tour
              </button>
            </div>
          ) : (
            <div className="text-sm text-slate-600">Virtual tour belum tersedia.</div>
          )
        ) : (
          videoItems.length ? (
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-slate-600">Video tersedia: {videoItems.length}.</div>
              <button
                type="button"
                onClick={() => openVideo(0)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
              >
                Putar video
              </button>
            </div>
          ) : (
            <div className="text-sm text-slate-600">Video belum tersedia.</div>
          )
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-950/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-0 overflow-y-auto">
            <div className="mx-auto w-full max-w-6xl px-6 py-8">
              <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Galeri</div>
                    <div className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-900">{title}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50"
                    aria-label="Tutup"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid gap-4 p-5 lg:grid-cols-[1.6fr_1fr]">
                  <div className="space-y-3">
                    {tab === "foto" || tab === "denah" ? (
                      <div className="relative overflow-hidden rounded-3xl bg-slate-50 ring-1 ring-slate-200">
                        <div className="relative aspect-[16/10] w-full">
                          <Image
                            src={(tab === "denah" ? planItems : photos)[activeIndex]?.url ?? hero}
                            alt={title}
                            fill
                            sizes="(min-width: 1024px) 70vw, 100vw"
                            className="object-cover"
                          />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-slate-950/55 via-slate-950/0 to-transparent p-4">
                          <div className="text-sm font-semibold text-white">
                            {activeIndex + 1} / {(tab === "denah" ? planItems.length : photos.length) || 1}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveIndex((p) => Math.max(0, p - 1))}
                              disabled={activeIndex <= 0}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-slate-900 shadow-sm transition disabled:opacity-60"
                              aria-label="Sebelumnya"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveIndex((p) =>
                                  Math.min(((tab === "denah" ? planItems.length : photos.length) || 1) - 1, p + 1),
                                )
                              }
                              disabled={activeIndex >= ((tab === "denah" ? planItems.length : photos.length) || 1) - 1}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-slate-900 shadow-sm transition disabled:opacity-60"
                              aria-label="Berikutnya"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : tab === "virtual" ? (
                      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <iframe
                          title={tourItems[activeVirtual]?.title ?? "Virtual Tour"}
                          src={tourItems[activeVirtual]?.embedUrl ?? "about:blank"}
                          className="h-[420px] w-full"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          allow="fullscreen; autoplay; vr"
                        />
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <video
                          key={videoItems[activeVideo]?.id}
                          className="h-[420px] w-full bg-black object-contain"
                          controls
                          playsInline
                          preload="metadata"
                          poster={videoItems[activeVideo]?.poster}
                        >
                          {videoItems[activeVideo]?.src ? <source src={videoItems[activeVideo]!.src} /> : null}
                        </video>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setTab("foto")} className={tabButton(tab === "foto")}>
                        <Images className="h-4 w-4" />
                        foto
                      </button>
                      <button type="button" onClick={() => setTab("denah")} className={tabButton(tab === "denah")}>
                        <LayoutGrid className="h-4 w-4" />
                        denah
                      </button>
                      <button type="button" onClick={() => setTab("virtual")} className={tabButton(tab === "virtual")}>
                        <Map className="h-4 w-4" />
                        virtual tour
                      </button>
                      <button type="button" onClick={() => setTab("video")} className={tabButton(tab === "video")}>
                        <Film className="h-4 w-4" />
                        video
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {tab === "foto" || tab === "denah" ? (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">
                        {(tab === "denah" ? planItems : photos).map((it, idx) => (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => setActiveIndex(idx)}
                            className={cn(
                              "relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200 transition",
                              idx === activeIndex && "ring-2 ring-slate-900",
                            )}
                            aria-label="Pilih media"
                          >
                            <Image src={it.url} alt={title} fill sizes="180px" className="object-cover" />
                          </button>
                        ))}
                      </div>
                    ) : tab === "virtual" ? (
                      <div className="space-y-2">
                        {tourItems.length ? (
                          tourItems.map((t, idx) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setActiveVirtual(idx)}
                              className={cn(
                                "w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold shadow-sm transition",
                                idx === activeVirtual
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                              )}
                            >
                              {t.title}
                            </button>
                          ))
                        ) : (
                          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                            Virtual tour belum tersedia.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {videoItems.length ? (
                          videoItems.map((v, idx) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setActiveVideo(idx)}
                              className={cn(
                                "w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold shadow-sm transition",
                                idx === activeVideo
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                              )}
                            >
                              {v.title}
                            </button>
                          ))
                        ) : (
                          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                            Video belum tersedia.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

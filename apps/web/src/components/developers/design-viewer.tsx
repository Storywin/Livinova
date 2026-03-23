"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minus, Plus, RotateCcw, X } from "lucide-react";
import Image from "next/image";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type Variant = "light" | "dark";

export function DesignViewerTrigger({
  src,
  alt,
  variant,
  className,
  children,
}: {
  src: string;
  alt: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  const v = variant ?? "light";
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} aria-label={`Buka viewer desain: ${alt}`}>
        {children}
      </button>
      {open ? (
        <Portal>
          <DesignViewerModal src={src} alt={alt} variant={v} onClose={() => setOpen(false)} />
        </Portal>
      ) : null}
    </>
  );
}

function Portal({ children }: { children: React.ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const node = document.createElement("div");
    node.setAttribute("data-design-viewer-portal", "true");
    document.body.appendChild(node);
    setEl(node);
    return () => {
      document.body.removeChild(node);
    };
  }, []);
  if (!el) return null;
  return createPortal(children, el);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function DesignViewerModal({
  src,
  alt,
  variant,
  onClose,
}: {
  src: string;
  alt: string;
  variant: Variant;
  onClose: () => void;
}) {
  const v = variant;
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [mode, setMode] = useState<"rotate" | "pan">("rotate");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rot, setRot] = useState({ x: -10, y: 18 });
  const [drag, setDrag] = useState<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });

  const style = useMemo(() => {
    const t = `translate3d(${pan.x}px, ${pan.y}px, 0) rotateX(${rot.x}deg) rotateY(${rot.y}deg) scale(${zoom})`;
    return { transform: t };
  }, [pan.x, pan.y, rot.x, rot.y, zoom]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!drag.active) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      setDrag({ active: true, x: e.clientX, y: e.clientY });
      if (mode === "pan") {
        setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      } else {
        setRot((r) => ({
          x: clamp(r.x - dy * 0.18, -70, 70),
          y: r.y + dx * 0.22,
        }));
      }
    };
    const onPointerUp = () => setDrag((d) => ({ ...d, active: false }));
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [drag.active, drag.x, drag.y, mode]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((z) => clamp(Number((z + delta).toFixed(2)), 0.8, 2.8));
  };

  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRot({ x: -10, y: 18 });
    setMode("rotate");
  };

  const headerBase =
    v === "dark"
      ? "border-white/15 bg-white/10 text-white"
      : "border-slate-200 bg-white text-slate-900";

  const btnBase =
    v === "dark"
      ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50";

  return (
    <div
      ref={overlayRef}
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center p-4",
        v === "dark" ? "bg-slate-950/75" : "bg-slate-950/55",
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Viewer desain"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className={cn("w-full max-w-6xl overflow-hidden rounded-[28px] border shadow-2xl", headerBase)}>
        <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3", headerBase)}>
          <div className="min-w-0">
            <div className={cn("text-xs font-semibold uppercase tracking-wide", v === "dark" ? "text-white/60" : "text-slate-500")}>
              3D Viewer
            </div>
            <div className={cn("truncate text-sm font-semibold", v === "dark" ? "text-white" : "text-slate-900")}>{alt}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={cn("inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold", btnBase)}
              onClick={() => setMode((m) => (m === "rotate" ? "pan" : "rotate"))}
            >
              <Maximize2 className="h-4 w-4" />
              {mode === "rotate" ? "Rotate" : "Pan"}
            </button>

            <button
              type="button"
              className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl border", btnBase)}
              onClick={() => setZoom((z) => clamp(Number((z - 0.1).toFixed(2)), 0.8, 2.8))}
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl border", btnBase)}
              onClick={() => setZoom((z) => clamp(Number((z + 0.1).toFixed(2)), 0.8, 2.8))}
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn("inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold", btnBase)}
              onClick={reset}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              type="button"
              className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl border", btnBase)}
              onClick={onClose}
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className={cn("relative bg-black/5", v === "dark" ? "bg-slate-950" : "bg-white")} onWheel={onWheel}>
          <div className="absolute inset-x-0 top-0 z-10 p-4">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur",
                v === "dark" ? "border-white/15 bg-white/10 text-white/80" : "border-slate-200 bg-white/80 text-slate-700",
              )}
            >
              Drag untuk {mode === "rotate" ? "rotate (pseudo 3D)" : "pan"} • Scroll untuk zoom
            </div>
          </div>

          <div
            ref={containerRef}
            className="relative mx-auto flex aspect-[16/9] w-full items-center justify-center overflow-hidden"
            style={{ perspective: 1000 }}
            onPointerDown={(e) => {
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              setDrag({ active: true, x: e.clientX, y: e.clientY });
            }}
          >
            <div
              className={cn(
                "relative h-full w-full will-change-transform",
                v === "dark" ? "bg-slate-950" : "bg-white",
              )}
              style={style}
            >
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(min-width: 1024px) 1100px, 100vw"
                className="select-none object-contain pointer-events-none"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  stage: "planning" | "construction" | "handover";
  className?: string;
  chromeless?: boolean;
  hideHeader?: boolean;
  showLegend?: boolean;
};

function stagePercent(stage: Props["stage"]) {
  if (stage === "planning") return 24;
  if (stage === "construction") return 62;
  return 100;
}

export function Property3DPreview({ stage, className, chromeless = false, hideHeader = false, showLegend }: Props) {
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

  const percent = stagePercent(stage);
  const stageLabel = stage === "planning" ? "Perencanaan" : stage === "construction" ? "Pembangunan" : "Serah Terima";
  const legend = showLegend ?? hideHeader;

  return (
    <div
      className={cn(
        "rounded-3xl",
        chromeless ? "border-0 bg-transparent shadow-none" : "border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      <style>{`
        @keyframes lv-float3d { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        @keyframes lv-scan { 0% { transform: translateX(-40%) } 100% { transform: translateX(140%) } }
        @keyframes lv-blueprint { 0%,100% { opacity: .65 } 50% { opacity: .95 } }
        @keyframes lv-build { 0% { transform: translateY(8px); opacity: .55 } 100% { transform: translateY(0); opacity: .95 } }
        @keyframes lv-glow { 0%,100% { opacity: .35 } 50% { opacity: .6 } }
      `}</style>
      {hideHeader ? null : (
        <div className={cn("flex items-center justify-between px-5 py-4", chromeless ? "" : "border-b border-slate-200")}>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">3D Preview</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{stageLabel}</div>
          </div>
          <div className="w-28">
            <div className="h-2 rounded-full bg-slate-100 ring-1 ring-slate-200">
              <div className="h-2 rounded-full bg-gradient-to-r from-sky-600 to-cyan-500" style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-1 text-right text-[11px] font-semibold text-slate-600">{percent}%</div>
          </div>
        </div>
      )}

      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 px-5 py-6",
          hideHeader ? "rounded-3xl" : "rounded-b-3xl",
        )}
        style={{
          transform: `perspective(1200px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformOrigin: "center",
          transition: "transform 120ms ease",
        }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-20 h-[340px] w-[340px] rounded-full bg-sky-500/14 blur-3xl" />
          <div className="absolute -right-14 -top-14 h-[320px] w-[320px] rounded-full bg-slate-900/10 blur-3xl" />
          <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.07)_1px,transparent_0)] [background-size:24px_24px] opacity-45" />
        </div>

        <div className="relative mx-auto aspect-[16/10] w-full max-w-[640px]" style={{ transformStyle: "preserve-3d" }}>
          <div
            className="absolute left-1/2 top-1/2 h-56 w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[34px] bg-slate-200/55 shadow-[0_30px_70px_rgba(15,23,42,0.12)] ring-1 ring-slate-200"
            style={{ transform: "translateZ(6px)" }}
          />

          <div
            className="absolute left-1/2 top-1/2 h-48 w-[380px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[34px] bg-white shadow-[0_40px_90px_rgba(15,23,42,0.16)] ring-1 ring-slate-200"
            style={{ transform: "translateZ(22px) rotateX(6deg) rotateY(-10deg)" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50" />

            {stage === "planning" ? (
              <>
                <div className="absolute inset-0 [background-image:linear-gradient(rgba(2,132,199,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(2,132,199,0.18)_1px,transparent_1px)] [background-size:22px_22px] opacity-80" style={{ animation: "lv-blueprint 4.6s ease-in-out infinite" }} />
                <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(2,132,199,0.20)_1px,transparent_0)] [background-size:18px_18px] opacity-50" />
                <div className="absolute left-10 top-10 h-24 w-36 rounded-2xl border border-sky-300/60 bg-sky-50/70" />
                <div className="absolute right-10 top-10 h-24 w-36 rounded-2xl border border-sky-300/60 bg-sky-50/70" />
                <div className="absolute left-1/2 top-1/2 h-28 w-20 -translate-x-1/2 -translate-y-3 rounded-2xl border border-sky-300/60 bg-sky-50/70" />
                <div className="absolute left-8 bottom-8 h-6 w-44 rounded-full bg-sky-600/15" />
                <div className="absolute left-8 bottom-8 h-6 w-[105px] rounded-full bg-gradient-to-r from-sky-600/50 to-cyan-500/50" />
              </>
            ) : stage === "construction" ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50" />
                <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.12)_1px,transparent_0)] [background-size:18px_18px]" />

                <div className="absolute left-10 top-10 h-24 w-36 rounded-2xl bg-slate-100 ring-1 ring-slate-200" />
                <div className="absolute right-10 top-10 h-24 w-36 rounded-2xl bg-slate-100 ring-1 ring-slate-200" />
                <div className="absolute left-1/2 top-1/2 h-28 w-20 -translate-x-1/2 -translate-y-3 rounded-2xl bg-slate-900/10 ring-1 ring-slate-200" />

                <div className="absolute inset-x-8 top-6 h-3 rounded-full bg-amber-500/20" />
                <div className="absolute inset-x-10 top-14 h-2 rounded-full bg-slate-900/10" />

                <div className="absolute left-6 top-6 h-[170px] w-3 rounded-2xl bg-slate-900/10" />
                <div className="absolute right-6 top-6 h-[170px] w-3 rounded-2xl bg-slate-900/10" />
                <div className="absolute left-6 top-[86px] h-2 w-[calc(100%-48px)] rounded-full bg-slate-900/10" />

                <div
                  className="absolute left-0 top-0 h-full w-full"
                  style={{ clipPath: `inset(${100 - percent}% 0 0 0)`, animation: "lv-build 1.1s ease-out both" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-500/10 to-emerald-500/10" />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,132,199,0.12)_1px,transparent_1px)] [background-size:26px_26px] opacity-35" />
                </div>

                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-500/22 to-transparent" style={{ animation: "lv-scan 2.8s linear infinite" }} />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-emerald-50" />
                <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.10)_1px,transparent_0)] [background-size:18px_18px]" />

                <div className="absolute left-10 top-10 h-24 w-36 rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm" />
                <div className="absolute right-10 top-10 h-24 w-36 rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm" />
                <div className="absolute left-1/2 top-1/2 h-28 w-20 -translate-x-1/2 -translate-y-3 rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm" />

                <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/16 blur-3xl" style={{ animation: "lv-glow 5.6s ease-in-out infinite" }} />
                <div className="absolute -right-24 -top-16 h-72 w-72 rounded-full bg-sky-500/16 blur-3xl" style={{ animation: "lv-glow 6.2s ease-in-out infinite" }} />

                <div className="absolute left-12 bottom-10 h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 shadow-[0_25px_60px_rgba(16,185,129,0.25)]" style={{ transform: "translateZ(14px)", animation: "lv-float3d 7s ease-in-out infinite" }} />
                <div className="absolute right-14 bottom-10 h-9 w-9 rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 shadow-[0_25px_60px_rgba(2,132,199,0.25)]" style={{ transform: "translateZ(12px)", animation: "lv-float3d 6.2s ease-in-out infinite" }} />

                <div className="absolute inset-x-10 bottom-7 h-2 rounded-full bg-emerald-600/20" />
                <div className="absolute inset-x-10 bottom-7 h-2 rounded-full bg-gradient-to-r from-emerald-600 to-cyan-500" style={{ width: `${percent}%` }} />
              </>
            )}
          </div>

          {legend ? (
            <div className="absolute left-6 bottom-5 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-700 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tahap</div>
                  <div className="mt-1 font-semibold text-slate-900">
                    {stage === "planning" ? "Blueprint" : stage === "construction" ? "Konstruksi" : "Finishing"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Progress</div>
                  <div className="mt-1 font-semibold text-slate-900">{percent}%</div>
                </div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100 ring-1 ring-slate-200">
                <div className="h-2 rounded-full bg-gradient-to-r from-sky-600 to-cyan-500" style={{ width: `${percent}%` }} />
              </div>
              <div className="mt-2 text-[11px] text-slate-500">Gerakkan mouse untuk tilt 3D • {stageLabel}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

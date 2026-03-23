"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value: number;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
  locale?: string;
  maximumFractionDigits?: number;
  className?: string;
};

function formatNumber(value: number, locale: string, maximumFractionDigits: number) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
}

export function CountUp({
  value,
  durationMs = 900,
  prefix = "",
  suffix = "",
  locale = "id-ID",
  maximumFractionDigits = 0,
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);

  const formatted = useMemo(
    () => `${prefix}${formatNumber(current, locale, maximumFractionDigits)}${suffix}`,
    [current, locale, maximumFractionDigits, prefix, suffix],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setVisible(true);
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    const from = 0;
    const to = Number.isFinite(value) ? value : 0;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const v = from + (to - from) * easeOutCubic(t);
      setCurrent(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, value, visible]);

  return (
    <span ref={ref} className={className}>
      {formatted}
    </span>
  );
}


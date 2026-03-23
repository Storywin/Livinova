"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";

const STORAGE_KEY = "livinova:wishlist:listings";

function readWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v) => typeof v === "string") as string[];
  } catch {
    return [];
  }
}

function writeWishlist(items: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    return;
  }
}

export function WishlistButton({ listingSlug, className }: { listingSlug: string; className?: string }) {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    setItems(readWishlist());
    setReady(true);
  }, []);

  const isActive = useMemo(() => items.includes(listingSlug), [items, listingSlug]);

  const toggle = () => {
    const next = isActive ? items.filter((s) => s !== listingSlug) : Array.from(new Set([listingSlug, ...items]));
    setItems(next);
    writeWishlist(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isActive}
      disabled={!ready}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition",
        "hover:bg-slate-50 disabled:opacity-60",
        isActive && "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", isActive ? "fill-rose-600 text-rose-600" : "text-slate-700")} />
      {isActive ? "Tersimpan" : "Favorit"}
    </button>
  );
}


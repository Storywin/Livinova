"use client";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function ShareButton({ title, className }: { title: string; className?: string }) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const onShare = async () => {
    if (!url) return;
    const nav = navigator as unknown as { share?: (data: { title: string; url: string }) => Promise<void> };
    if (nav.share) {
      await nav.share({ title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
  };

  return (
    <button
      type="button"
      onClick={() => void onShare()}
      disabled={!url}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition",
        "hover:bg-slate-50 disabled:opacity-60",
        className,
      )}
    >
      <Share2 className="h-4 w-4 text-slate-700" />
      Bagikan
    </button>
  );
}


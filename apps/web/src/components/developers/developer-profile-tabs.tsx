"use client";

import { ReactNode, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export type DeveloperProfileTab = {
  id: string;
  label: string;
  content: ReactNode;
};

export function DeveloperProfileTabs({
  tabs,
  defaultTabId,
  variant,
  className,
}: {
  tabs: DeveloperProfileTab[];
  defaultTabId?: string;
  variant?: "light" | "dark";
  className?: string;
}) {
  const v = variant ?? "light";
  const first = tabs[0]?.id ?? "";
  const initial = defaultTabId && tabs.some((t) => t.id === defaultTabId) ? defaultTabId : first;
  const [active, setActive] = useState(initial);

  const activeTab = useMemo(() => tabs.find((t) => t.id === active) ?? tabs[0], [active, tabs]);

  return (
    <div className={className}>
      <div
        className={cn(
          "inline-flex w-full items-center gap-1 rounded-2xl border p-1",
          v === "dark" ? "border-white/15 bg-white/5" : "border-slate-200 bg-slate-50",
        )}
        role="tablist"
        aria-label="Tab profil developer"
      >
        {tabs.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(t.id)}
              className={cn(
                "h-10 flex-1 rounded-xl px-3 text-sm font-semibold transition",
                selected
                  ? v === "dark"
                    ? "bg-white text-slate-950"
                    : "bg-white text-slate-900 shadow-sm"
                  : v === "dark"
                    ? "text-white/75 hover:bg-white/10 hover:text-white"
                    : "text-slate-700 hover:bg-white hover:text-slate-900",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4" role="tabpanel">
        {activeTab?.content}
      </div>
    </div>
  );
}


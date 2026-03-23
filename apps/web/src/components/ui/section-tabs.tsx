"use client";

import { ReactNode, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export type SectionTab = {
  id: string;
  label: ReactNode;
  content: ReactNode;
};

export function SectionTabs({
  tabs,
  defaultTabId,
  className,
}: {
  tabs: SectionTab[];
  defaultTabId?: string;
  className?: string;
}) {
  const first = tabs[0]?.id ?? "";
  const initial = defaultTabId && tabs.some((t) => t.id === defaultTabId) ? defaultTabId : first;
  const [active, setActive] = useState(initial);

  const activeTab = useMemo(() => tabs.find((t) => t.id === active) ?? tabs[0], [active, tabs]);

  return (
    <div className={className}>
      <div className="inline-flex w-full items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1" role="tablist">
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
                "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition",
                selected ? "bg-white text-slate-900 shadow-sm" : "text-slate-700 hover:bg-white hover:text-slate-900",
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

"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function HomeSearch({ className }: { className?: string }) {
  const router = useRouter();

  const [keyword, setKeyword] = useState("");

  const queryString = useMemo(() => {
    const qp = new URLSearchParams();
    const q = keyword.trim();
    if (q) qp.set("q", q);

    qp.set("sort", "featured");
    qp.set("page", "1");
    return qp.toString();
  }, [keyword]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push(`/properti?${queryString}`);
  };

  return (
    <Card className={cn("shadow-sm", className)}>
      <form onSubmit={onSubmit} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pencarian</div>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Ketik kota, area, nama properti, atau nama developer"
            className="mt-2"
          />
          <div className="mt-2 text-xs text-slate-500">
            Contoh: Sudirman, Jakarta Selatan, Nusantara Properti, Livinova Residence
          </div>
        </div>

        <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800 md:mt-6">
          Cari
        </Button>
      </form>
    </Card>
  );
}

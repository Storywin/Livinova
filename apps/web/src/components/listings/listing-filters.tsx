"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  initial?: {
    q?: string;
    city?: string;
    area?: string;
  };
  className?: string;
};

export function ListingFilters({ initial, className }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialValues = useMemo(() => {
    return {
      q: initial?.q ?? searchParams.get("q") ?? "",
      city: initial?.city ?? searchParams.get("city") ?? "",
      area: initial?.area ?? searchParams.get("area") ?? "",
    };
  }, [initial?.area, initial?.city, initial?.q, searchParams]);

  const [q, setQ] = useState(initialValues.q);
  const [city, setCity] = useState(initialValues.city);
  const [area, setArea] = useState(initialValues.area);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", "1");

    const setOrDelete = (key: string, value: string) => {
      const v = value.trim();
      if (v) next.set(key, v);
      else next.delete(key);
    };

    setOrDelete("q", q);
    setOrDelete("city", city);
    setOrDelete("area", area);

    router.push(`/properti?${next.toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
        "md:grid-cols-[1.4fr_1fr_1fr_auto]",
        className,
      )}
    >
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari proyek, developer, atau area" />
      <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Kota (contoh: Jakarta Selatan)" />
      <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area (contoh: Sudirman)" />
      <Button type="submit">Cari</Button>
    </form>
  );
}

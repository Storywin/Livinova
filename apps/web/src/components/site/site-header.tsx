"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Container } from "./container";

const nav = [
  { href: "/properti", label: "Properti" },
  { href: "/kpr", label: "Simulasi KPR" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur transition-colors",
        scrolled
          ? "border-white/10 bg-gradient-to-r from-sky-600/18 via-cyan-500/14 to-slate-900/10"
          : "border-slate-200 bg-white/80",
      )}
    >
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Livinova"
              width={260}
              height={72}
              priority
              className="h-10 w-auto md:h-11"
            />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    isActive && "text-slate-900",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/auth/login">Masuk</Link>
          </Button>
          <Button asChild className="bg-slate-900 text-white hover:bg-slate-800">
            <Link href="/developer/daftar">Untuk Developer</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}

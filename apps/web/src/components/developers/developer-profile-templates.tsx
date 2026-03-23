import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, Cpu, Globe, Mail, MapPin, Phone, ShieldCheck, Sparkles, User } from "lucide-react";

import { DeveloperProfileTabs } from "@/components/developers/developer-profile-tabs";
import { DesignViewerTrigger } from "@/components/developers/design-viewer";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

export type DeveloperPublic = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  contactPersonName: string | null;
  contactPersonEmail: string | null;
  contactPersonPhone: string | null;
  verificationStatus: string;
  profileTemplate?: string | null;
  projects: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    smartReadiness: string;
    verificationStatus: string;
    startingPrice: string | null;
    location: { city: string | null; area: string | null; province: string | null } | null;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type PublicListingCard = {
  id: string;
  slug: string;
  title: string;
  startingPrice: string | null;
  price: string | null;
  images?: Array<{ id: string; url: string; kind: string }>;
  project: {
    name: string;
    slug: string;
    location: { city: string | null; area: string | null; province: string | null } | null;
  };
};

function formatLocation(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(", ");
}

function developerLogo(slug: string) {
  if (slug === "nusantara-properti") return "/developers/nusantara-properti.svg";
  if (slug === "bali-smart-living") return "/developers/bali-smart-living.svg";
  if (slug === "demo-developer-pending") return "/developers/demo-developer-pending.svg";
  return "/developers/default.svg";
}

function primaryImage(listings: PublicListingCard[]) {
  for (const l of listings) {
    const img = l.images?.[0]?.url;
    if (img) return img;
  }
  return null;
}

function formatMoney(input: string | null) {
  if (!input) return null;
  const digits = input.replace(/[^\d]/g, "");
  if (digits && digits.length >= 6 && digits.length <= 16) {
    const n = Number(digits);
    if (Number.isFinite(n)) return formatRupiah(n);
  }
  return input;
}

function normalizePhone(input: string) {
  const digits = input.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  return digits;
}

function ContactActions({ d, variant }: { d: DeveloperPublic; variant?: "light" | "dark" }) {
  const v = variant ?? "light";
  const email = d.contactPersonEmail || d.email;
  const phone = d.contactPersonPhone || d.phone;
  const waNumber = (d.contactPersonPhone || d.phone || "").replace(/[^\d]/g, "");
  const waUrl = waNumber ? `https://wa.me/${normalizePhone(waNumber)}` : null;
  const baseOutline =
    v === "dark"
      ? "border-white/20 bg-white/5 text-white hover:bg-white/10"
      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50";

  return (
    <div className="flex flex-wrap gap-2">
      {d.website ? (
        <Button asChild variant="outline" className={cn("h-10 rounded-xl", baseOutline)}>
          <a href={d.website} target="_blank" rel="noreferrer">
            <span className="inline-flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website
            </span>
          </a>
        </Button>
      ) : null}
      {email ? (
        <Button asChild variant="outline" className={cn("h-10 rounded-xl", baseOutline)}>
          <a href={`mailto:${email}`}>
            <span className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </span>
          </a>
        </Button>
      ) : null}
      {phone ? (
        <Button asChild variant="outline" className={cn("h-10 rounded-xl", baseOutline)}>
          <a href={`tel:${phone}`}>
            <span className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telepon
            </span>
          </a>
        </Button>
      ) : null}
      {waUrl ? (
        <Button asChild className="h-10 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500">
          <a href={waUrl} target="_blank" rel="noreferrer">
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4" />
              WhatsApp
            </span>
          </a>
        </Button>
      ) : null}
      <Button asChild className="h-10 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-500 to-blue-600 text-white">
        <Link href={`/properti?developerSlug=${d.slug}&page=1`}>Lihat Properti</Link>
      </Button>
    </div>
  );
}

function ListingGrid({ listings, variant }: { listings: PublicListingCard[]; variant?: "light" | "dark" }) {
  const v = variant ?? "light";
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => {
        const img = l.images?.[0]?.url ?? null;
        const location = formatLocation([l.project.location?.area, l.project.location?.city, l.project.location?.province]) || "—";
        const price = formatMoney(l.startingPrice ?? l.price);
        return (
          <Link key={l.id} href={`/properti/${l.slug}`} className="group">
            <Card
              className={cn(
                "h-full overflow-hidden rounded-[26px] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
                v === "dark" ? "border-white/15 bg-white/5 text-white" : "border-slate-200 bg-white",
              )}
            >
              <div
                className={cn(
                  "relative aspect-[16/10] w-full overflow-hidden",
                  v === "dark"
                    ? "bg-gradient-to-br from-white/10 via-white/5 to-white/10"
                    : "bg-gradient-to-br from-sky-100 via-violet-100 to-emerald-100",
                )}
              >
                {img ? (
                  <Image
                    src={img}
                    alt={l.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <Image
                    src="/properties/livinova-residence-tipe-a.svg"
                    alt="Ilustrasi desain rumah"
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover opacity-90"
                  />
                )}
                <div className={cn("absolute inset-0", v === "dark" ? "bg-gradient-to-t from-slate-950/55 via-slate-950/15 to-transparent" : "bg-gradient-to-t from-slate-950/25 via-transparent to-transparent")} />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 backdrop-blur",
                      v === "dark"
                        ? "bg-white/10 text-white ring-white/20"
                        : "bg-white/80 text-slate-700 ring-slate-200 shadow-sm",
                    )}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    {l.project.name}
                  </span>
                </div>
              </div>
              <CardContent className="space-y-3 p-5">
                <div className={cn("line-clamp-2 text-base font-semibold tracking-tight", v === "dark" ? "text-white" : "text-slate-900")}>
                  {l.title}
                </div>
                <div className={cn("inline-flex items-center gap-2 text-xs", v === "dark" ? "text-white/70" : "text-slate-600")}>
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{location}</span>
                </div>

                <div
                  className={cn(
                    "rounded-2xl border p-4 shadow-sm",
                    v === "dark" ? "border-white/15 bg-white/5" : "border-slate-200 bg-white",
                  )}
                >
                  <div className={cn("text-[11px] font-semibold uppercase tracking-wide", v === "dark" ? "text-white/60" : "text-slate-500")}>
                    Mulai dari
                  </div>
                  <div className={cn("mt-1 text-lg font-semibold tracking-tight", v === "dark" ? "text-white" : "text-slate-900")}>
                    {price ?? "—"}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className={cn("text-xs", v === "dark" ? "text-white/60" : "text-slate-500")}>Detail unit & fitur</div>
                  <div className={cn("inline-flex items-center gap-2 text-sm font-semibold", v === "dark" ? "text-white" : "text-sky-700")}>
                    Lihat
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function DesignShowcase({ developerName, variant }: { developerName: string; variant?: "light" | "dark" }) {
  const v = variant ?? "light";
  const cardBase =
    v === "dark"
      ? "border-white/15 bg-white/10 text-white shadow-[0_30px_90px_rgba(15,23,42,0.55)] backdrop-blur"
      : "border-slate-200 bg-white text-slate-900 shadow-[0_30px_90px_rgba(15,23,42,0.12)]";
  const label = v === "dark" ? "text-white/70" : "text-slate-600";
  return (
    <div className={cn("rounded-[28px] border p-6 md:p-8", cardBase)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className={cn("text-xs font-semibold uppercase tracking-wide", v === "dark" ? "text-white/60" : "text-slate-500")}>
            Design Portfolio
          </div>
          <div className={cn("mt-1 text-base font-semibold", v === "dark" ? "text-white" : "text-slate-900")}>
            Desain 3D & Konsep Hunian
          </div>
          <div className={cn("mt-1 text-sm leading-relaxed", label)}>
            Kumpulan visual konsep dari {developerName} untuk menampilkan kualitas desain dan karakter proyek.
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { title: "Fasad Modern", subtitle: "Tampilan eksterior premium", src: "/design.png" },
          { title: "Layout & Ruang", subtitle: "Komposisi ruang fungsional", src: "/design.png" },
          { title: "Smart Living Ready", subtitle: "Siap integrasi perangkat", src: "/design.png" },
        ].map((x) => (
          <div
            key={x.title}
            className={cn(
              "overflow-hidden rounded-[22px] border shadow-sm",
              v === "dark" ? "border-white/15 bg-white/5" : "border-slate-200 bg-white",
            )}
          >
            <div className={cn("relative aspect-[4/3] w-full", v === "dark" ? "bg-white/10" : "bg-slate-50")}>
              <Image src={x.src} alt={`${developerName} - ${x.title}`} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
              <div className={cn("absolute inset-0", v === "dark" ? "bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" : "bg-gradient-to-t from-slate-950/20 via-transparent to-transparent")} />
            </div>
            <div className="p-4">
              <div className={cn("text-sm font-semibold", v === "dark" ? "text-white" : "text-slate-900")}>{x.title}</div>
              <div className={cn("mt-1 text-xs", v === "dark" ? "text-white/70" : "text-slate-600")}>{x.subtitle}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DesignGrid({ developerName, variant }: { developerName: string; variant?: "light" | "dark" }) {
  const v = variant ?? "light";
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[
        { title: "Fasad Modern", subtitle: "Tampilan eksterior premium", src: "/design.png" },
        { title: "Layout & Ruang", subtitle: "Komposisi ruang fungsional", src: "/design.png" },
        { title: "Smart Living Ready", subtitle: "Siap integrasi perangkat", src: "/design.png" },
      ].map((x) => (
        <DesignViewerTrigger
          key={x.title}
          src={x.src}
          alt={`${developerName} - ${x.title}`}
          variant={v}
          className={cn(
            "overflow-hidden rounded-[22px] border text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
            v === "dark" ? "border-white/15 bg-white/5" : "border-slate-200 bg-white",
          )}
        >
          <div className={cn("relative aspect-[4/3] w-full", v === "dark" ? "bg-white/10" : "bg-slate-50")}>
            <Image
              src={x.src}
              alt={`${developerName} - ${x.title}`}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover"
            />
            <div
              className={cn(
                "absolute inset-0",
                v === "dark"
                  ? "bg-gradient-to-t from-slate-950/55 via-transparent to-transparent"
                  : "bg-gradient-to-t from-slate-950/20 via-transparent to-transparent",
              )}
            />
            <div className="absolute right-3 top-3 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200">
              3D
            </div>
          </div>
          <div className="p-4">
            <div className={cn("text-sm font-semibold", v === "dark" ? "text-white" : "text-slate-900")}>{x.title}</div>
            <div className={cn("mt-1 text-xs", v === "dark" ? "text-white/70" : "text-slate-600")}>{x.subtitle}</div>
          </div>
        </DesignViewerTrigger>
      ))}
    </div>
  );
}

function ProjectsPanel({ d }: { d: DeveloperPublic }) {
  return (
    <div className="grid gap-2">
      {d.projects.slice(0, 10).map((p) => (
        <div key={p.id} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
          <div className="text-sm font-semibold text-white">{p.name}</div>
          <div className="mt-1 text-xs text-white/70">{formatLocation([p.location?.area, p.location?.city, p.location?.province]) || "—"}</div>
        </div>
      ))}
      <div className="pt-2 text-xs text-white/60">Klik salah satu properti untuk melihat detail unit dan fitur Smart Living.</div>
    </div>
  );
}

function MapSection({
  title,
  query,
  variant,
}: {
  title: string;
  query: string;
  variant?: "light" | "dark";
}) {
  const v = variant ?? "light";
  const cardBase =
    v === "dark"
      ? "border-white/15 bg-white/10 text-white shadow-[0_30px_90px_rgba(15,23,42,0.55)] backdrop-blur"
      : "border-slate-200 bg-white text-slate-900 shadow-[0_30px_90px_rgba(15,23,42,0.12)]";
  const label = v === "dark" ? "text-white/70" : "text-slate-600";
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  return (
    <div className={cn("rounded-[28px] border p-6 md:p-8", cardBase)}>
      <div className="flex items-center gap-2">
        <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-2xl ring-1", v === "dark" ? "bg-white/10 text-white ring-white/15" : "bg-slate-50 text-slate-900 ring-slate-200")}>
          <MapPin className="h-4 w-4" />
        </div>
        <div>
          <div className={cn("text-xs font-semibold uppercase tracking-wide", v === "dark" ? "text-white/60" : "text-slate-500")}>
            Lokasi
          </div>
          <div className={cn("text-base font-semibold", v === "dark" ? "text-white" : "text-slate-900")}>{title}</div>
          <div className={cn("mt-1 text-sm leading-relaxed", label)}>{query}</div>
        </div>
      </div>
      <div className={cn("mt-5 overflow-hidden rounded-[22px] border", v === "dark" ? "border-white/15" : "border-slate-200")}>
        <div className="relative aspect-[16/9] w-full">
          <iframe title={`Peta ${title}`} src={src} className="h-full w-full border-0" loading="lazy" />
        </div>
      </div>
    </div>
  );
}

function ProjectsSection({ d }: { d: DeveloperPublic }) {
  const approvedProjects = d.projects.filter((p) => p.verificationStatus === "approved");
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Project & Experience</CardTitle>
      </CardHeader>
      <CardContent>
        {approvedProjects.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {approvedProjects.map((p) => (
              <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                <div className="mt-1 text-xs text-slate-600">
                  {formatLocation([p.location?.area, p.location?.city, p.location?.province]) || "—"}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    {p.status}
                  </span>
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    Smart: {p.smartReadiness}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-600">Belum ada proyek yang dipublikasikan.</div>
        )}
      </CardContent>
    </Card>
  );
}

function TemplateClassic({ d, listings }: { d: DeveloperPublic; listings: PublicListingCard[] }) {
  const hero = primaryImage(listings);
  const email = d.contactPersonEmail || d.email;
  const phone = d.contactPersonPhone || d.phone;
  const address = d.address || formatLocation([d.city, d.province]);
  const verified = d.verificationStatus === "approved";
  const joinedYear = (() => {
    const dt = new Date(d.createdAt);
    return Number.isFinite(dt.getTime()) ? dt.getFullYear() : null;
  })();

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-28 h-[560px] w-[560px] rounded-full bg-violet-500/14 blur-3xl" />
        <div className="absolute -right-28 -top-20 h-[620px] w-[620px] rounded-full bg-sky-500/16 blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <Container className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-900">
              Beranda
            </Link>
            <span className="text-slate-300" aria-hidden="true">
              &gt;
            </span>
            <Link href="/properti" className="hover:text-slate-900">
              Properti
            </Link>
            <span className="text-slate-300" aria-hidden="true">
              &gt;
            </span>
            <span className="text-slate-700">{d.name}</span>
          </div>

          <div className="mt-7 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm">
                  <Image src={developerLogo(d.slug)} alt={d.name} fill sizes="56px" className="object-contain p-2" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 shadow-sm backdrop-blur">
                    <Building2 className="h-4 w-4" />
                    Developer
                  </span>
                  {verified ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      <BadgeCheck className="h-4 w-4" />
                      Terverifikasi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                      <ShieldCheck className="h-4 w-4" />
                      Dalam Verifikasi
                    </span>
                  )}
                  {formatLocation([d.city, d.province]) ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 shadow-sm backdrop-blur">
                      <MapPin className="h-4 w-4" />
                      {formatLocation([d.city, d.province])}
                    </span>
                  ) : null}
                </div>
              </div>

              <h1 className="mt-6 text-balance text-[40px] font-semibold leading-[1.05] tracking-tight text-slate-900 md:text-[54px]">
                {d.name}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
                {d.description ||
                  "Developer dengan fokus hunian modern dan kesiapan Smart Living. Jelajahi portofolio proyek, properti unggulan, dan hubungi tim untuk konsultasi."}
              </p>

              <div className="mt-6">
                <ContactActions d={d} />
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Proyek</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{d.projects.length}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Listing</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{listings.length}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bergabung</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{joinedYear ?? "—"}</div>
                </div>
              </div>

              <div className="mt-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
                <div className="relative aspect-[16/8] w-full bg-gradient-to-br from-sky-100 via-violet-100 to-emerald-100">
                  {hero ? (
                    <Image src={hero} alt={d.name} fill sizes="(min-width: 1024px) 70vw, 100vw" className="object-cover" />
                  ) : (
                    <Image
                      src="/properties/livinova-residence-tipe-a.svg"
                      alt="Ilustrasi desain rumah"
                      fill
                      sizes="(min-width: 1024px) 70vw, 100vw"
                      className="object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" />
                </div>
              </div>

              <div className="mt-8">
                <DesignShowcase developerName={d.name} />
              </div>

              <div className="mt-6">
                <MapSection title="Kantor Developer" query={d.address || formatLocation([d.city, d.province]) || "Indonesia"} />
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Keunggulan</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm text-slate-700">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                        <Cpu className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Kesiapan Smart Living</div>
                        <div className="text-slate-600">Desain, infrastruktur, dan integrasi Smart Home yang terukur.</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Standar Kualitas</div>
                        <div className="text-slate-600">Konsistensi spesifikasi, serah terima, dan layanan purna jual.</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Desain Modern</div>
                        <div className="text-slate-600">Arsitektur, layout, dan finishing yang nyaman untuk keluarga.</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Profil Perusahaan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-700">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-50 text-slate-800 ring-1 ring-slate-200">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">PIC</div>
                        <div className="mt-1 font-semibold text-slate-900">{d.contactPersonName ?? "—"}</div>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      {email ? (
                        <a href={`mailto:${email}`} className="inline-flex items-center gap-2 font-semibold text-sky-700 hover:text-sky-800 hover:underline">
                          <Mail className="h-4 w-4" />
                          {email}
                        </a>
                      ) : null}
                      {phone ? (
                        <a href={`tel:${phone}`} className="inline-flex items-center gap-2 font-semibold text-sky-700 hover:text-sky-800 hover:underline">
                          <Phone className="h-4 w-4" />
                          {phone}
                        </a>
                      ) : null}
                      {address ? (
                        <a
                          href={`https://www.google.com/maps?q=${encodeURIComponent(address)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:underline"
                        >
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-2">{address}</span>
                          <ArrowRight className="h-4 w-4 text-slate-400" />
                        </a>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-10">
                <div className="text-sm font-semibold text-slate-900">Portofolio Proyek</div>
                <div className="mt-4">
                  <ProjectsSection d={d} />
                </div>
              </div>

              <div className="mt-10">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900">Properti dari {d.name}</div>
                  <Link
                    href={`/properti?developerSlug=${d.slug}&page=1`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-800 hover:underline"
                  >
                    Lihat semua
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-4">
                  <ListingGrid listings={listings} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Ringkasan</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm text-slate-700">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fokus</div>
                    <div className="mt-1 font-semibold text-slate-900">Hunian modern + Smart Living</div>
                    <div className="mt-1 text-slate-600">Rancang bangun dengan perhatian pada kualitas, keamanan, dan kenyamanan.</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kota</div>
                    <div className="mt-1 font-semibold text-slate-900">{formatLocation([d.city, d.province]) || "Indonesia"}</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Konsultasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  <div className="text-slate-600">
                    Butuh rekomendasi unit dan estimasi cicilan? Hubungi tim developer atau gunakan Simulasi KPR.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild className="h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                      <Link href="/kpr">Simulasi KPR</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-10 rounded-xl">
                      <Link href="/kontak">Kontak Livinova</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

function TemplateAurora({ d, listings }: { d: DeveloperPublic; listings: PublicListingCard[] }) {
  const hero = primaryImage(listings);
  const mapQuery = d.address || formatLocation([d.city, d.province]) || "Indonesia";
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-28 h-[560px] w-[560px] rounded-full bg-violet-500/18 blur-3xl" />
        <div className="absolute -right-28 -top-20 h-[620px] w-[620px] rounded-full bg-sky-500/18 blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-emerald-500/12 blur-3xl" />
        <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [background-size:28px_28px] opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950" />
      </div>

      <Container className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
            <Link href="/" className="hover:text-white">
              Beranda
            </Link>
            <span className="text-white/30" aria-hidden="true">
              &gt;
            </span>
            <Link href="/properti" className="hover:text-white">
              Properti
            </Link>
            <span className="text-white/30" aria-hidden="true">
              &gt;
            </span>
            <span className="text-white">{d.name}</span>
          </div>

          <div className="mt-7">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/15 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
                <Image src={developerLogo(d.slug)} alt={d.name} fill sizes="48px" className="object-contain p-2" />
              </div>
              <div className="text-sm text-white/70">{formatLocation([d.city, d.province]) || "Indonesia"}</div>
            </div>

            <div className="mt-5">
              <h1 className="text-balance text-[36px] font-semibold leading-[1.06] tracking-tight text-white md:text-[42px]">
                {d.name}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/75">
                {d.description || "Profil developer untuk proyek Smart Living terverifikasi di Livinova."}
              </p>

              <div className="mt-6">
                <ContactActions d={d} variant="dark" />
              </div>

              <div className="mt-8 overflow-hidden rounded-[28px] border border-white/15 bg-white/10 shadow-[0_30px_90px_rgba(15,23,42,0.55)] backdrop-blur">
                <div className="relative aspect-[16/9] w-full">
                  {hero ? (
                    <Image src={hero} alt={d.name} fill sizes="(min-width: 1024px) 1100px, 100vw" className="object-cover" />
                  ) : (
                    <Image src="/design.png" alt={`${d.name} - desain`} fill sizes="(min-width: 1024px) 1100px, 100vw" className="object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.55)] backdrop-blur md:p-8">
                <div className="text-sm font-semibold text-white">Portofolio</div>
                <div className="mt-4">
                  <DeveloperProfileTabs
                    variant="dark"
                    defaultTabId="projects"
                    tabs={[
                      {
                        id: "projects",
                        label: "Project & Experience",
                        content: <ProjectsPanel d={d} />,
                      },
                      {
                        id: "design",
                        label: "Design Portofolio",
                        content: <DesignGrid developerName={d.name} variant="dark" />,
                      },
                    ]}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <MapSection title="Kantor Developer" query={mapQuery} variant="dark" />
            </div>

            <div className="mt-10 rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.55)] backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Properti unggulan</div>
                <Link
                  href={`/properti?developerSlug=${d.slug}&page=1`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white hover:underline"
                >
                  Lihat semua
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-4">
                <ListingGrid listings={listings.slice(0, 9)} variant="dark" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

function TemplateSkyline({ d, listings }: { d: DeveloperPublic; listings: PublicListingCard[] }) {
  const hero = primaryImage(listings);
  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] [background-size:28px_28px] opacity-60" />
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-sky-50 via-white to-transparent" />
      </div>

      <Container className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-900">
              Beranda
            </Link>
            <span className="text-slate-300" aria-hidden="true">
              &gt;
            </span>
            <Link href="/properti" className="hover:text-slate-900">
              Properti
            </Link>
            <span className="text-slate-300" aria-hidden="true">
              &gt;
            </span>
            <span className="text-slate-700">{d.name}</span>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr] lg:items-start">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm">
                  <Image src={developerLogo(d.slug)} alt={d.name} fill sizes="48px" className="object-contain p-2" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{d.name}</div>
                  <div className="text-xs text-slate-600">{formatLocation([d.city, d.province]) || "Indonesia"}</div>
                </div>
              </div>

              <div className="mt-4 text-sm leading-relaxed text-slate-600">
                {d.description || "Profil developer untuk proyek Smart Living terverifikasi di Livinova."}
              </div>

              <div className="mt-5">
                <ContactActions d={d} />
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project</div>
                <div className="mt-2 space-y-2">
                  {d.projects.slice(0, 4).map((p) => (
                    <div key={p.id} className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">{p.name}</span>{" "}
                      <span className="text-slate-500">•</span>{" "}
                      <span className="text-slate-600">{formatLocation([p.location?.area, p.location?.city])}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
                <div className="relative aspect-[21/9] w-full bg-gradient-to-br from-sky-100 via-violet-100 to-emerald-100">
                  {hero ? <Image src={hero} alt={d.name} fill sizes="(min-width: 1024px) 70vw, 100vw" className="object-cover" /> : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" />
                </div>
              </div>

              <div className="mt-6">
                <DesignShowcase developerName={d.name} />
              </div>

              <div className="mt-6">
                <MapSection title="Kantor Developer" query={d.address || formatLocation([d.city, d.province]) || "Indonesia"} />
              </div>

              <div className="mt-6">
                <div className="text-sm font-semibold text-slate-900">Properti</div>
                <div className="mt-4">
                  <ListingGrid listings={listings} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

export function DeveloperProfileTemplate({
  developer,
  listings,
}: {
  developer: DeveloperPublic;
  listings: PublicListingCard[];
}) {
  const template = (developer.profileTemplate || "").toLowerCase();
  const fallback = (() => {
    if (developer.slug === "bali-smart-living") return "aurora";
    if (developer.slug === "nusantara-properti") return "skyline";
    return "classic";
  })();

  const selected = template || fallback;

  return (
    <div className={cn(selected === "aurora" ? "bg-slate-950" : "bg-white")}>
      {selected === "aurora" ? (
        <TemplateAurora d={developer} listings={listings} />
      ) : selected === "skyline" ? (
        <TemplateSkyline d={developer} listings={listings} />
      ) : (
        <TemplateClassic d={developer} listings={listings} />
      )}
    </div>
  );
}

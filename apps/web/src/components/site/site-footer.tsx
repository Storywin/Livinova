import Link from "next/link";
import Image from "next/image";

import { Container } from "./container";
import { apiFetch } from "@/lib/api";

type SocialLink = { platform: string; url: string; label?: string };

function IconInstagram(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={props.className} fill="none">
      <path
        d="M16 3H8C5.239 3 3 5.239 3 8v8c0 2.761 2.239 5 5 5h8c2.761 0 5-2.239 5-5V8c0-2.761-2.239-5-5-5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M17.5 6.7h.01" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function IconTikTok(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={props.className} fill="none">
      <path
        d="M14.3 5.2c.9 1.6 2.2 2.6 3.9 2.8v2.2c-1.6-.1-2.9-.7-3.9-1.6v6.1a5.1 5.1 0 1 1-4.6-5.1v2.4a2.8 2.8 0 1 0 2.3 2.7V3h2.3v2.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconTelegram(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={props.className} fill="none">
      <path
        d="M20.7 5.3 18 19.3c-.2 1-1.3 1.4-2.1.9l-4.8-3.5-2.3 2.2c-.3.3-.9.2-1-.2l-.4-4.9 10.1-9.1c.3-.3 0-.8-.4-.6L4.2 10.1c-.8.4-.7 1.5.2 1.8l3.2 1 7.6-4.9c.4-.3.9.2.6.6l-5.7 6.3 5.4 4c.4.3 1 .1 1.1-.4l2.2-12.1c.1-.6-.5-1.1-1.1-.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconWhatsApp(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={props.className} fill="none">
      <path
        d="M12 3.4A8.6 8.6 0 0 0 4.6 16.6L4 20.6l4.1-.6A8.6 8.6 0 1 0 12 3.4Zm0 15.7c-1.5 0-3-.4-4.2-1.1l-.3-.2-2.4.3.3-2.3-.2-.3A6.9 6.9 0 1 1 12 19.1Z"
        fill="currentColor"
      />
      <path
        d="M16.1 13.7c-.2-.1-1.2-.6-1.4-.7-.2-.1-.4-.1-.6.1l-.6.8c-.2.2-.3.2-.5.1-.2-.1-.9-.3-1.7-1.1-.6-.6-1.1-1.4-1.2-1.6-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3.2-.5 0-.2 0-.3-.1-.5-.1-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-1 1-1 2.4s1 2.7 1.2 2.9c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.7.1.5-.1 1.2-.5 1.3-1 .2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconFacebook(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={props.className} fill="none">
      <path
        d="M13.6 21v-7h2.3l.3-2.7h-2.6V9.6c0-.8.2-1.3 1.3-1.3h1.4V5.9c-.2 0-1.1-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v1.7H8.2V14h2.2v7h3.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const p = platform.toLowerCase();
  if (p === "instagram") return <IconInstagram className={className} />;
  if (p === "tiktok") return <IconTikTok className={className} />;
  if (p === "telegram") return <IconTelegram className={className} />;
  if (p === "whatsapp") return <IconWhatsApp className={className} />;
  if (p === "facebook") return <IconFacebook className={className} />;
  return (
    <span className={className} aria-hidden="true">
      ●
    </span>
  );
}

async function getSiteSocialLinks(): Promise<SocialLink[]> {
  try {
    const data = await apiFetch<{ socialLinks: SocialLink[] }>("/public/site-settings");
    return Array.isArray(data.socialLinks) ? data.socialLinks : [];
  } catch {
    return [];
  }
}

const footerLinks = [
  { href: "/tentang", label: "Tentang" },
  { href: "/kontak", label: "Kontak" },
  { href: "/artikel", label: "Artikel" },
  { href: "/promo", label: "Promo" },
  { href: "/kebijakan-privasi", label: "Kebijakan Privasi" },
  { href: "/syarat-ketentuan", label: "Syarat & Ketentuan" },
];

const defaultSocialLinks: SocialLink[] = [
  { platform: "instagram", url: "https://instagram.com/livinova.id", label: "Instagram" },
  { platform: "tiktok", url: "https://tiktok.com/@livinova", label: "TikTok" },
  { platform: "telegram", url: "https://t.me/livinova", label: "Telegram" },
  {
    platform: "whatsapp",
    url: "https://wa.me/625882449242?text=Halo%20Livinova%2C%20saya%20tertarik%20dengan%20salah%20satu%20rumah%2C%20boleh%20saya%20tanya%20lebih%20detail%3F",
    label: "WhatsApp",
  },
  { platform: "facebook", url: "https://facebook.com/livinova", label: "Facebook" },
];

function socialHoverClass(platform: string) {
  const p = platform.toLowerCase();
  if (p === "instagram") return "hover:bg-fuchsia-50 hover:text-fuchsia-700 hover:border-fuchsia-200";
  if (p === "tiktok") return "hover:bg-slate-900 hover:text-white hover:border-slate-900";
  if (p === "telegram") return "hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200";
  if (p === "whatsapp") return "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200";
  if (p === "facebook") return "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200";
  return "hover:bg-slate-50 hover:text-slate-900";
}

export async function SiteFooter() {
  const fetched = await getSiteSocialLinks();
  const byPlatform = new Map<string, SocialLink>();
  for (const s of fetched) byPlatform.set(s.platform.toLowerCase(), s);
  const defaults = defaultSocialLinks.map((d) => byPlatform.get(d.platform.toLowerCase()) ?? d);
  const extra = fetched.filter((s) => !defaultSocialLinks.some((d) => d.platform.toLowerCase() === s.platform.toLowerCase()));
  const socialLinks = [...defaults, ...extra];
  return (
    <footer className="border-t border-slate-200 bg-white">
      <Container className="py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Image src="/logo.png" alt="Livinova" width={190} height={52} className="h-11 w-auto md:h-12" />
            <div className="mt-2 text-sm leading-relaxed text-slate-600">
              Marketplace properti premium untuk listing Smart Living terverifikasi dari developer terpercaya.
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Jelajahi</div>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <Link className="text-slate-600 hover:text-slate-900" href="/properti">
                    Properti
                  </Link>
                  <Link className="text-slate-600 hover:text-slate-900" href="/kpr">
                    Simulasi KPR
                  </Link>
                  <Link className="text-slate-600 hover:text-slate-900" href="/developer/daftar">
                    Developer
                  </Link>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Perusahaan</div>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  {footerLinks.map((l) => (
                    <Link key={l.href} className="text-slate-600 hover:text-slate-900" href={l.href}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kontak</div>
                <div className="mt-3 text-sm text-slate-600">
                  <div>hello@livinova.id</div>
                  <div className="mt-1">Jakarta • Indonesia</div>
                </div>
                <div className="mt-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Media Sosial</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(socialLinks ?? []).map((s) => {
                      const label = s.label || s.platform;
                      const hasUrl = typeof s.url === "string" && s.url.length > 0;
                      if (!hasUrl) return null;
                      const icon = <SocialIcon platform={s.platform} className="h-5 w-5" />;
                      const baseClass =
                        "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition";
                      return (
                        <a
                          key={`${s.platform}-${label}`}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`${baseClass} ${socialHoverClass(s.platform)}`}
                          aria-label={label}
                          title={label}
                        >
                          {icon}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} Livinova. All rights reserved.</div>
          <div className="flex flex-wrap gap-4">
            <Link className="hover:text-slate-900" href="/kebijakan-privasi">
              Kebijakan Privasi
            </Link>
            <Link className="hover:text-slate-900" href="/syarat-ketentuan">
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

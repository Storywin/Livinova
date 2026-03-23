import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReactNode } from "react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Livinova — Marketplace Properti Smart Living Terverifikasi",
    template: "%s — Livinova",
  },
  description:
    "Livinova adalah marketplace properti dari developer dengan fitur Smart Living/Smart Home yang terverifikasi.",
  metadataBase: new URL("http://localhost:3000"),
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    shortcut: [{ url: "/logo.png", type: "image/png" }],
    apple: [{ url: "/logo.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-dvh bg-slate-50 text-slate-950">
        <Providers>
          <SiteHeader />
          {children}
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}

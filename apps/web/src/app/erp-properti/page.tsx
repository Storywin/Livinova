import { Metadata } from "next";
import { 
  BarChart3, 
  Building2, 
  ClipboardCheck, 
  Coins, 
  FileText, 
  LayoutDashboard, 
  LineChart, 
  MonitorSmartphone, 
  ShieldCheck, 
  Users2,
  CheckCircle2,
  Zap,
  ArrowRight,
  Sparkles,
  Trophy,
  PieChart,
  HardHat,
  GanttChartSquare,
  BadgeCheck,
  Globe2
} from "lucide-react";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ERP Properti Livinova - Solusi Enterprise Terintegrasi Developer Properti",
  description: "Kelola seluruh proses bisnis developer perumahan mulai dari inventory, sales, keuangan, hingga konstruksi dengan ERP Properti Livinova. Efisien, Akurat, dan Terpercaya.",
  keywords: "ERP Properti, Software Developer Perumahan, Sistem Informasi Manajemen Properti, Software Real Estate Indonesia, Livinova ERP",
};

const FEATURES = [
  {
    icon: <Users2 className="h-8 w-8" />,
    title: "CRM & Sales Management",
    desc: "Kelola database prospek, rekam jejak follow-up, hingga booking online secara real-time untuk tim in-house maupun agen.",
    color: "bg-blue-500"
  },
  {
    icon: <LayoutDashboard className="h-8 w-8" />,
    title: "Digital Siteplan & Inventory",
    desc: "Visualisasi stok unit secara interaktif. Update ketersediaan unit (Master Stock) otomatis saat terjadi transaksi.",
    color: "bg-emerald-500"
  },
  {
    icon: <Coins className="h-8 w-8" />,
    title: "Finance & Accounting",
    desc: "Sistem akuntansi otomatis mulai dari Jurnal, Buku Besar, Neraca, hingga Laporan Laba Rugi yang akurat.",
    color: "bg-amber-500"
  },
  {
    icon: <HardHat className="h-8 w-8" />,
    title: "Project & Construction",
    desc: "Pantau progres pembangunan dengan dokumentasi foto, kontrol RAB, dan manajemen termin kontraktor.",
    color: "bg-rose-500"
  },
  {
    icon: <FileText className="h-8 w-8" />,
    title: "Legal & Documentation",
    desc: "Otomatisasi pembuatan SPR, PPJB, SPK, hingga BAST dengan template yang profesional dan sesuai regulasi.",
    color: "bg-purple-500"
  },
  {
    icon: <PieChart className="h-8 w-8" />,
    title: "Owner Dashboard",
    desc: "Analisis performa bisnis melalui grafik interaktif untuk pengambilan keputusan yang cepat dan tepat.",
    color: "bg-sky-500"
  }
];

const PRICING = [
  {
    name: "Starter (Monthly)",
    price: "1.490.000",
    period: "/ bulan",
    desc: "Ideal untuk pengembang perumahan skala kecil yang baru memulai digitalisasi.",
    features: ["1 Entitas Perusahaan", "Unlimited Projects", "Full Features ERP", "Mobile App Access", "Online Learning Access"],
    popular: false
  },
  {
    name: "Business (Annual)",
    price: "14.900.000",
    period: "/ tahun",
    desc: "Pilihan terbaik untuk optimasi biaya dengan dukungan penuh selama setahun.",
    features: ["Hingga 4 Entitas Perusahaan", "Unlimited Projects", "Prioritas Support", "Dedicated Training", "Free Technology Update"],
    popular: true
  },
  {
    name: "Enterprise (Lifetime)",
    price: "79.900.000",
    period: "Sekali Bayar",
    desc: "Investasi jangka panjang untuk grup perusahaan developer besar.",
    features: ["Unlimited Entities & Projects", "Full Source Customization", "On-Premise / Cloud Options", "Life-time Support", "Corporate Compliance Audit"],
    popular: false
  }
];

export default function ErpPropertiPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 py-24 text-white lg:py-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-blue-600/10 blur-[120px]"></div>
          <div className="absolute -right-1/4 -bottom-1/4 h-[800px] w-[800px] rounded-full bg-indigo-600/10 blur-[120px]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        </div>

        <Container className="relative z-10">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
                <Sparkles className="h-4 w-4" />
                Sistem ERP Properti Enterprise #1
              </div>
              <h1 className="mb-6 text-5xl font-black leading-tight tracking-tight md:text-6xl lg:text-7xl">
                Transformasi Digital <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Developer Properti</span> Anda
              </h1>
              <p className="mb-10 text-lg leading-relaxed text-slate-400 md:text-xl">
                Livinova ERP dirancang khusus untuk pengembang perumahan guna menciptakan tata kelola (GCG) yang sehat, transparan, dan menguntungkan. Kendalikan seluruh proyek dalam satu dashboard.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="h-14 rounded-2xl bg-blue-600 px-8 text-lg font-bold hover:bg-blue-700" asChild>
                  <Link href="/erp/login">Coba Trial Gratis</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 rounded-2xl border-slate-700 bg-white/5 px-8 text-lg font-bold backdrop-blur-sm hover:bg-white/10" asChild>
                  <a href="#features">Pelajari Fitur</a>
                </Button>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative z-10 animate-in fade-in zoom-in duration-1000">
                {/* 3D-like Dashboard Mockup */}
                <div className="relative rounded-3xl border border-white/10 bg-slate-900/50 p-4 shadow-2xl backdrop-blur-md transition-transform duration-500 hover:scale-[1.02] hover:rotate-x-2 hover:rotate-y-2" style={{ perspective: '1000px' }}>
                  <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                      <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                      <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="text-xs font-medium text-slate-500">Livinova ERP - Dashboard Owner</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 rounded-2xl bg-blue-500/20 p-4">
                      <div className="mb-2 text-xs text-blue-400">Total Penjualan</div>
                      <div className="text-2xl font-bold">Rp 45.2 M</div>
                      <div className="mt-2 h-1 w-full rounded bg-blue-500/30">
                        <div className="h-full w-3/4 rounded bg-blue-400"></div>
                      </div>
                    </div>
                    <div className="h-32 rounded-2xl bg-emerald-500/20 p-4">
                      <div className="mb-2 text-xs text-emerald-400">Unit Terjual</div>
                      <div className="text-2xl font-bold">128 / 150</div>
                      <div className="mt-2 h-1 w-full rounded bg-emerald-500/30">
                        <div className="h-full w-[85%] rounded bg-emerald-400"></div>
                      </div>
                    </div>
                    <div className="col-span-2 h-40 rounded-2xl bg-white/5 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-xs text-slate-400">Grafik Cashflow</div>
                        <LineChart className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex h-20 items-end gap-2">
                        {[40, 70, 45, 90, 65, 80, 55, 100].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-blue-600 to-indigo-400" style={{ height: `${h}%` }}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-50 py-16">
        <Container>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: "Developer Aktif", val: "500+" },
              { label: "Unit Terkelola", val: "25.000+" },
              { label: "Transaksi Tahunan", val: "Rp 12T+" },
              { label: "Kepuasan User", val: "99.9%" }
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="mb-1 text-3xl font-black text-slate-900 md:text-4xl">{s.val}</div>
                <div className="text-sm font-medium text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32">
        <Container>
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-5xl">Fitur Enterprise Terintegrasi</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Satu sistem untuk seluruh tim Anda. Tinggalkan cara manual dan beralihlah ke ekosistem ERP yang terpadu.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="group relative rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-2xl hover:shadow-blue-500/5">
                <div className={cn("mb-6 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg transition-transform group-hover:-translate-y-2 group-hover:scale-110", f.color)}>
                  {f.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Why Livinova ERP */}
      <section className="bg-slate-950 py-24 text-white">
        <Container>
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-blue-500/20 blur-2xl"></div>
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
                <h3 className="mb-8 text-2xl font-bold">Keuntungan Menggunakan Livinova ERP</h3>
                <div className="space-y-6">
                  {[
                    { icon: <ShieldCheck className="text-emerald-400" />, title: "Mitigasi Risiko", desc: "Minimalisir kesalahan operasional dan kecurangan staf dengan sistem approval berjenjang." },
                    { icon: <Zap className="text-amber-400" />, title: "Efisiensi 300%", desc: "Otomatisasi laporan dan dokumen hukum yang menghemat ribuan jam kerja tim Anda." },
                    { icon: <MonitorSmartphone className="text-sky-400" />, title: "Akses Kapan Saja", desc: "Pantau bisnis Anda dari mana saja melalui aplikasi mobile yang responsif." },
                    { icon: <Globe2 className="text-indigo-400" />, title: "Data Terpusat", desc: "Satu sumber data yang akurat untuk semua departemen tanpa duplikasi." }
                  ].map((b, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="mt-1 h-6 w-6 shrink-0">{b.icon}</div>
                      <div>
                        <div className="font-bold">{b.title}</div>
                        <div className="text-sm text-slate-400">{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-6 text-3xl font-bold md:text-5xl">Solusi Tepat untuk GCG Bisnis Properti</h2>
              <p className="mb-8 text-lg text-slate-400">
                Livinova ERP bukan sekadar perangkat lunak, melainkan instrumen kepatuhan perusahaan (Corporate Compliance) yang komprehensif. Kami membantu developer menciptakan organisasi yang sehat, transparan, dan akuntabel.
              </p>
              <ul className="mb-10 space-y-4">
                {["Berpengalaman menangani puluhan launching proyek.", "Keamanan data standar perbankan.", "Implementasi cepat dalam 60 hari.", "Dukungan teknis 24/7."].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-medium">
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button size="lg" className="h-14 rounded-2xl bg-white text-lg font-bold text-slate-950 hover:bg-slate-200" asChild>
                <Link href="/erp/login">Mulai Konsultasi Gratis</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Pricing Section */}
      <section className="py-24 lg:py-32">
        <Container>
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-5xl">Investasi Bisnis Masa Depan</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Pilih paket yang sesuai dengan skala bisnis developer Anda saat ini.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {PRICING.map((p, i) => (
              <Card key={i} className={cn(
                "relative flex flex-col rounded-[32px] border-slate-100 p-8 shadow-xl transition-all hover:scale-[1.03]",
                p.popular ? "border-blue-200 bg-blue-50/30 ring-2 ring-blue-500 shadow-blue-500/10" : "bg-white"
              )}>
                {p.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-sm font-bold text-white">
                    Paling Populer
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900">{p.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">{p.desc}</p>
                </div>
                <div className="mb-8 flex items-baseline gap-1">
                  <span className="text-sm font-bold text-slate-400">Rp</span>
                  <span className="text-4xl font-black text-slate-900">{p.price}</span>
                  <span className="text-sm font-medium text-slate-500">{p.period}</span>
                </div>
                <ul className="mb-10 flex-1 space-y-4">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <BadgeCheck className="h-5 w-5 text-blue-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className={cn(
                  "h-14 rounded-2xl text-lg font-bold",
                  p.popular ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-900 hover:bg-slate-800"
                )}>
                  Pilih Paket {p.name.split(' ')[0]}
                </Button>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="pb-24">
        <Container>
          <div className="relative overflow-hidden rounded-[40px] bg-blue-600 px-8 py-20 text-center text-white md:px-16">
            <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <div className="relative z-10">
              <Trophy className="mx-auto mb-6 h-16 w-16 text-amber-300" />
              <h2 className="mb-6 text-3xl font-black md:text-5xl">Siap Menjadi Developer Properti Kelas Enterprise?</h2>
              <p className="mx-auto mb-10 max-w-2xl text-lg opacity-80">
                Gunakan Livinova ERP hari ini dan rasakan kemudahan mengelola bisnis properti dengan standar teknologi masa depan.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="h-16 rounded-2xl bg-white px-10 text-xl font-black text-blue-600 hover:bg-slate-100" asChild>
                  <Link href="/erp/login">
                    Coba Trial Sekarang <ArrowRight className="ml-2 h-6 w-6" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

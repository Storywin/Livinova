"use client";

import { useState, useMemo } from "react";
import { 
  ShieldCheck, 
  Info, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  History, 
  CreditCard, 
  Smartphone, 
  HelpCircle,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  BarChart3,
  Search,
  Lock
} from "lucide-react";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type KolStatus = 1 | 2 | 3 | 4 | 5;

const KOL_DATA: Record<KolStatus, { label: string; color: string; description: string; impact: string }> = {
  1: { 
    label: "Lancar", 
    color: "text-emerald-600 bg-emerald-50 border-emerald-200", 
    description: "Pembayaran selalu tepat waktu tanpa ada tunggakan.",
    impact: "Sangat baik! Peluang persetujuan kredit sangat tinggi dengan bunga rendah."
  },
  2: { 
    label: "Dalam Perhatian Khusus", 
    color: "text-amber-600 bg-amber-50 border-amber-200", 
    description: "Terdapat tunggakan pembayaran antara 1-90 hari.",
    impact: "Masih dipertimbangkan, namun bank akan lebih berhati-hati dan mungkin memberikan limit lebih kecil."
  },
  3: { 
    label: "Kurang Lancar", 
    color: "text-orange-600 bg-orange-50 border-orange-200", 
    description: "Terdapat tunggakan pembayaran antara 91-120 hari.",
    impact: "Risiko Tinggi! Pengajuan kredit kemungkinan besar akan ditangguhkan atau ditolak."
  },
  4: { 
    label: "Diragukan", 
    color: "text-red-600 bg-red-50 border-red-200", 
    description: "Terdapat tunggakan pembayaran antara 121-180 hari.",
    impact: "Sangat Sulit! Hampir tidak mungkin mendapatkan persetujuan kredit baru."
  },
  5: { 
    label: "Macet", 
    color: "text-rose-700 bg-rose-50 border-rose-200", 
    description: "Terdapat tunggakan pembayaran lebih dari 180 hari.",
    impact: "Blacklist! Pengajuan kredit akan langsung ditolak oleh lembaga keuangan."
  }
};

export default function ClikCreditScorePage() {
  const [formData, setFormData] = useState({
    onTimePayment: true,
    hasArrears: false,
    arrearsDays: 0,
    creditUtilization: 30,
    creditHistoryLength: 2,
    totalAccounts: 2,
    recentInquiries: 0
  });

  const [showResult, setShowResult] = useState(false);

  const calculatedScore = useMemo(() => {
    let score = 850; // Base perfect score (FICO style representation for simulation)
    
    // Payment History (35%)
    if (!formData.onTimePayment) score -= 150;
    if (formData.hasArrears) {
      if (formData.arrearsDays > 180) score -= 400;
      else if (formData.arrearsDays > 120) score -= 300;
      else if (formData.arrearsDays > 90) score -= 200;
      else if (formData.arrearsDays > 0) score -= 100;
    }

    // Utilization (30%)
    if (formData.creditUtilization > 70) score -= 100;
    else if (formData.creditUtilization > 50) score -= 50;
    else if (formData.creditUtilization < 30) score += 20;

    // History Length (15%)
    if (formData.creditHistoryLength < 1) score -= 50;
    else if (formData.creditHistoryLength > 5) score += 50;

    // Recent Inquiries (10%)
    if (formData.recentInquiries > 3) score -= 50;

    return Math.max(300, Math.min(850, score));
  }, [formData]);

  const kolStatus: KolStatus = useMemo(() => {
    if (!formData.hasArrears || formData.arrearsDays === 0) return 1;
    if (formData.arrearsDays <= 90) return 2;
    if (formData.arrearsDays <= 120) return 3;
    if (formData.arrearsDays <= 180) return 4;
    return 5;
  }, [formData.hasArrears, formData.arrearsDays]);

  const scoreLevel = useMemo(() => {
    if (calculatedScore >= 750) return { label: "Excellent", color: "text-emerald-600", bg: "bg-emerald-500" };
    if (calculatedScore >= 650) return { label: "Good", color: "text-blue-600", bg: "bg-blue-500" };
    if (calculatedScore >= 550) return { label: "Fair", color: "text-amber-600", bg: "bg-amber-500" };
    return { label: "Poor", color: "text-rose-600", bg: "bg-rose-500" };
  }, [calculatedScore]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 py-20 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-sky-500 blur-3xl"></div>
          <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-indigo-500 blur-3xl"></div>
        </div>
        
        <Container className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-4 py-1.5 text-sm font-medium text-sky-400 ring-1 ring-inset ring-sky-500/20">
              <Sparkles className="h-4 w-4" />
              Simulasi Credit Score Profesional
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Pahami <span className="text-sky-400">Credit Score</span> Anda Layaknya Perbankan
            </h1>
            <p className="mb-10 text-lg text-slate-400 md:text-xl">
              Simulasikan kelayakan kredit Anda berdasarkan standar SLIK OJK dan algoritma Biro Kredit CLIK. Bantu rencana kepemilikan properti Anda jadi lebih nyata.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="rounded-full bg-sky-500 px-8 hover:bg-sky-600" onClick={() => document.getElementById('simulation-tool')?.scrollIntoView({ behavior: 'smooth' })}>
                Mulai Simulasi Gratis
              </Button>
              <Button size="lg" variant="outline" className="rounded-full border-slate-700 bg-slate-800/50 px-8 hover:bg-slate-800" asChild>
                <a href="https://cbclik.com/id/" target="_blank" rel="noopener noreferrer">Pelajari CLIK Resmi</a>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Main Simulation Tool */}
          <div id="simulation-tool" className="lg:col-span-7">
            <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-xl shadow-slate-200/50">
              <div className="bg-white p-8">
                <div className="mb-8 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Formulir Simulasi</h2>
                    <p className="text-slate-500">Isi data di bawah sesuai kondisi finansial Anda saat ini</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Payment Habits */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Riwayat Pembayaran & Tunggakan</Label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className={cn(
                        "cursor-pointer rounded-2xl border-2 p-4 transition-all",
                        formData.onTimePayment ? "border-sky-500 bg-sky-50/50" : "border-slate-100 bg-white"
                      )} onClick={() => setFormData(prev => ({ ...prev, onTimePayment: true }))}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-medium">Selalu Tepat Waktu</span>
                          {formData.onTimePayment && <CheckCircle2 className="h-5 w-5 text-sky-500" />}
                        </div>
                        <p className="text-xs text-slate-500">Tidak pernah terlambat membayar cicilan apapun.</p>
                      </div>
                      <div className={cn(
                        "cursor-pointer rounded-2xl border-2 p-4 transition-all",
                        !formData.onTimePayment ? "border-rose-500 bg-rose-50/50" : "border-slate-100 bg-white"
                      )} onClick={() => setFormData(prev => ({ ...prev, onTimePayment: false }))}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-medium">Pernah Terlambat</span>
                          {!formData.onTimePayment && <AlertCircle className="h-5 w-5 text-rose-500" />}
                        </div>
                        <p className="text-xs text-slate-500">Pernah memiliki keterlambatan bayar di masa lalu.</p>
                      </div>
                    </div>
                  </div>

                  {/* Arrears */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Status Tunggakan Saat Ini (Hari)</Label>
                      <span className="text-sm font-medium text-sky-600">{formData.arrearsDays} Hari</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="210" 
                      step="30"
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-sky-500"
                      value={formData.arrearsDays}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setFormData(prev => ({ ...prev, arrearsDays: val, hasArrears: val > 0 }));
                      }}
                    />
                    <div className="flex justify-between text-[10px] font-medium text-slate-400">
                      <span>0 (Lancar)</span>
                      <span>90 (Kol 2)</span>
                      <span>120 (Kol 3)</span>
                      <span>180 (Kol 4)</span>
                      <span>&gt;180 (Kol 5)</span>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Utilization */}
                    <div className="space-y-2">
                      <Label htmlFor="utilization">Utilisasi Kredit (%)</Label>
                      <div className="relative">
                        <Input 
                          id="utilization"
                          type="number"
                          value={formData.creditUtilization}
                          onChange={(e) => setFormData(prev => ({ ...prev, creditUtilization: parseInt(e.target.value) }))}
                          className="rounded-xl pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Persentase limit kartu kredit/pinjaman yang digunakan.</p>
                    </div>

                    {/* Length */}
                    <div className="space-y-2">
                      <Label htmlFor="length">Lama Riwayat Kredit (Tahun)</Label>
                      <div className="relative">
                        <Input 
                          id="length"
                          type="number"
                          value={formData.creditHistoryLength}
                          onChange={(e) => setFormData(prev => ({ ...prev, creditHistoryLength: parseInt(e.target.value) }))}
                          className="rounded-xl pr-14"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">Tahun</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Berapa lama Anda sudah menggunakan fasilitas kredit.</p>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Inquiries */}
                    <div className="space-y-2">
                      <Label htmlFor="inquiries">Pengajuan Baru (6 Bulan Terakhir)</Label>
                      <Input 
                        id="inquiries"
                        type="number"
                        value={formData.recentInquiries}
                        onChange={(e) => setFormData(prev => ({ ...prev, recentInquiries: parseInt(e.target.value) }))}
                        className="rounded-xl"
                      />
                      <p className="text-[10px] text-slate-500">Jumlah aplikasi kredit baru yang Anda ajukan baru-baru ini.</p>
                    </div>

                    {/* Total Accounts */}
                    <div className="space-y-2">
                      <Label htmlFor="accounts">Total Akun Kredit</Label>
                      <Input 
                        id="accounts"
                        type="number"
                        value={formData.totalAccounts}
                        onChange={(e) => setFormData(prev => ({ ...prev, totalAccounts: parseInt(e.target.value) }))}
                        className="rounded-xl"
                      />
                      <p className="text-[10px] text-slate-500">Jumlah total fasilitas kredit yang aktif saat ini.</p>
                    </div>
                  </div>

                  <Button className="w-full rounded-2xl bg-slate-900 py-6 text-lg font-bold text-white hover:bg-slate-800" onClick={() => setShowResult(true)}>
                    Hitung Skor Kredit Saya
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Result & Info Sidebar */}
          <div className="lg:col-span-5">
            {!showResult ? (
              <div className="space-y-6">
                <Card className="rounded-3xl border-sky-100 bg-sky-50/50 p-8">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-slate-900">Mengapa Credit Score Penting?</h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Bank menggunakan skor ini untuk menentukan apakah mereka akan meminjamkan uang kepada Anda, berapa limitnya, dan berapa besar bunga yang harus Anda bayar. Skor yang baik dapat menghemat ratusan juta rupiah selama masa KPR.
                  </p>
                </Card>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900">Komponen Penilaian CLIK:</h4>
                  {[
                    { icon: <History className="h-4 w-4" />, label: "Riwayat Pembayaran", weight: "35%", color: "bg-emerald-500" },
                    { icon: <TrendingUp className="h-4 w-4" />, label: "Utilisasi Kredit", weight: "30%", color: "bg-sky-500" },
                    { icon: <Clock className="h-4 w-4" />, label: "Usia Kredit", weight: "15%", color: "bg-indigo-500" },
                    { icon: <CreditCard className="h-4 w-4" />, label: "Jenis Kredit", weight: "10%", color: "bg-purple-500" },
                    { icon: <Smartphone className="h-4 w-4" />, label: "Kredit Baru", weight: "10%", color: "bg-amber-500" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-white", item.color)}>
                          {item.icon}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{item.weight}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                {/* Score Result Card */}
                <Card className="overflow-hidden rounded-3xl border-none shadow-2xl">
                  <div className={cn("p-8 text-center text-white", scoreLevel.bg)}>
                    <p className="mb-2 text-sm font-medium opacity-80 uppercase tracking-widest">Estimasi Skor Kredit</p>
                    <div className="mb-4 text-7xl font-black">{calculatedScore}</div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-sm font-bold backdrop-blur-md">
                      {scoreLevel.label}
                    </div>
                  </div>
                  <div className="bg-white p-8">
                    <div className="mb-6">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">Status Kolektibilitas OJK:</span>
                        <span className={cn("rounded-lg border px-3 py-1 text-xs font-bold", KOL_DATA[kolStatus].color)}>
                          Kol {kolStatus}: {KOL_DATA[kolStatus].label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{KOL_DATA[kolStatus].description}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-5">
                      <h5 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
                        <TrendingUp className="h-4 w-4 text-sky-600" />
                        Analisis Dampak:
                      </h5>
                      <p className="text-sm text-slate-600">{KOL_DATA[kolStatus].impact}</p>
                    </div>

                    <Button variant="ghost" className="mt-6 w-full text-slate-500 hover:text-slate-900" onClick={() => setShowResult(false)}>
                      Ulangi Simulasi
                    </Button>
                  </div>
                </Card>

                {/* Recommendations */}
                <Card className="rounded-3xl border-slate-200 bg-white p-8">
                  <h4 className="mb-4 text-lg font-bold text-slate-900">Rekomendasi Untuk Anda:</h4>
                  <ul className="space-y-4">
                    {[
                      { text: "Pertahankan pembayaran tepat waktu di semua fasilitas kredit.", status: "ok" },
                      { text: "Jaga utilisasi kartu kredit di bawah 30% dari limit.", status: "info" },
                      { text: "Hindari mengajukan pinjaman baru dalam 6 bulan ke depan.", status: "warning" },
                    ].map((tip, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-600">
                        <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                        {tip.text}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* Info Section - CLIK Knowledge */}
      <section className="bg-white py-20">
        <Container>
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">Mengenal Biro Kredit CLIK</h2>
            <p className="mx-auto max-w-2xl text-slate-500">
              PT CLIK (CRIF LINTAS INDONESIA KARYA) adalah Biro Kredit Swasta yang berizin dan diawasi oleh OJK.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="group rounded-3xl border border-slate-100 bg-slate-50 p-8 transition-all hover:border-sky-200 hover:bg-white hover:shadow-xl hover:shadow-sky-500/5">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm transition-colors group-hover:bg-sky-500 group-hover:text-white">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">Apa Itu CLIK?</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                CLIK menghimpun data dari berbagai lembaga keuangan untuk memberikan skor kredit yang lebih akurat dan komprehensif dibanding hanya menggunakan data internal bank saja.
              </p>
            </div>

            <div className="group rounded-3xl border border-slate-100 bg-slate-50 p-8 transition-all hover:border-sky-200 hover:bg-white hover:shadow-xl hover:shadow-sky-500/5">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm transition-colors group-hover:bg-sky-500 group-hover:text-white">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">Laporan iDebku</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Laporan Informasi Debitur (iDeb) berisi riwayat kredit Anda dari seluruh bank, leasing, dan fintech yang terdaftar di OJK. Ini adalah rapor finansial resmi Anda.
              </p>
            </div>

            <div className="group rounded-3xl border border-slate-100 bg-slate-50 p-8 transition-all hover:border-sky-200 hover:bg-white hover:shadow-xl hover:shadow-sky-500/5">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm transition-colors group-hover:bg-sky-500 group-hover:text-white">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">Keamanan Data</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                CLIK menggunakan standar keamanan internasional dalam mengelola data pribadi Anda. Pengecekan skor kredit mandiri tidak akan merusak skor Anda.
              </p>
            </div>
          </div>

          <div className="mt-16 rounded-3xl bg-slate-900 p-8 text-white md:p-12">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <h3 className="mb-4 text-2xl font-bold">Siap Mengambil Langkah Berikutnya?</h3>
                <p className="mb-8 text-slate-400">
                  Setelah melakukan simulasi, Anda bisa mengecek skor kredit asli Anda melalui website resmi CLIK atau OJK iDebku untuk mendapatkan data yang valid dan legal.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button className="rounded-xl bg-sky-500 px-6 hover:bg-sky-600" asChild>
                    <a href="https://cbclik.com/id/" target="_blank" rel="noopener noreferrer">Cek Skor Asli di CLIK</a>
                  </Button>
                  <Button variant="outline" className="rounded-xl border-slate-700 bg-transparent px-6 hover:bg-slate-800" asChild>
                    <a href="https://idebku.ojk.go.id" target="_blank" rel="noopener noreferrer">Layanan iDebku OJK</a>
                  </Button>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full bg-sky-500/20 blur-2xl"></div>
                  <Card className="relative border-slate-800 bg-slate-800/50 p-6 backdrop-blur-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                        <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                        <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                      </div>
                      <ShieldCheck className="h-5 w-5 text-sky-400" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 w-full rounded bg-slate-700"></div>
                      <div className="h-2 w-3/4 rounded bg-slate-700"></div>
                      <div className="h-2 w-1/2 rounded bg-slate-700"></div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <Container>
          <div className="mb-12 flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-sky-600" />
            <h2 className="text-3xl font-bold text-slate-900">Pertanyaan Umum (FAQ)</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                q: "Apa perbedaan Skor Kredit CLIK dan BI Checking?",
                a: "BI Checking (sekarang SLIK OJK) adalah basis data riwayat kredit mentah. CLIK adalah biro kredit yang mengolah data tersebut menjadi 'Skor' angka (seperti 300-850) untuk memudahkan bank menilai risiko Anda secara instan."
              },
              {
                q: "Apakah skor simulasi ini akurat?",
                a: "Simulasi ini dirancang berdasarkan faktor-faktor utama yang digunakan oleh biro kredit. Namun, skor asli Anda ditentukan oleh data riwayat nyata yang tercatat di sistem perbankan nasional."
              },
              {
                q: "Bagaimana cara memperbaiki skor yang buruk?",
                a: "Langkah pertama adalah melunasi seluruh tunggakan. Setelah lunas, status Anda di SLIK akan diperbarui (biasanya butuh waktu 1-2 bulan). Disiplin membayar tepat waktu selama 12-24 bulan akan mengembalikan skor Anda menjadi baik."
              },
              {
                q: "Apakah Kol 2 masih bisa mengajukan KPR?",
                a: "Bisa, namun jauh lebih sulit. Bank biasanya akan meminta bukti pelunasan tunggakan atau penjelasan tertulis. Beberapa bank mungkin tetap menolak sampai status Anda kembali menjadi Kol 1 (Lancar)."
              }
            ].map((faq, i) => (
              <Card key={i} className="rounded-3xl border-slate-100 p-8 shadow-sm">
                <h5 className="mb-3 font-bold text-slate-900">{faq.q}</h5>
                <p className="text-sm text-slate-600">{faq.a}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}

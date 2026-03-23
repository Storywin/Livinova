import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/site/container";
import { Card, CardContent } from "@/components/ui/card";

function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  return envUrl && envUrl.trim() ? envUrl.trim().replace(/\/$/, "") : "http://localhost:3000";
}

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | Livinova",
  description:
    "Syarat & Ketentuan Livinova mengatur penggunaan layanan marketplace properti, fitur Smart Living, inquiry, dan simulasi KPR, termasuk hak dan kewajiban pengguna.",
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: "/syarat-ketentuan" },
  openGraph: {
    type: "website",
    url: "/syarat-ketentuan",
    title: "Syarat & Ketentuan | Livinova",
    description:
      "Syarat & Ketentuan Livinova mengatur penggunaan layanan marketplace properti, fitur Smart Living, inquiry, dan simulasi KPR, termasuk hak dan kewajiban pengguna.",
  },
  twitter: {
    card: "summary",
    title: "Syarat & Ketentuan | Livinova",
    description:
      "Syarat & Ketentuan Livinova mengatur penggunaan layanan marketplace properti, fitur Smart Living, inquiry, dan simulasi KPR, termasuk hak dan kewajiban pengguna.",
  },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  const updatedAt = "23 Maret 2026";
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-28 h-[560px] w-[560px] rounded-full bg-violet-500/16 blur-3xl" />
        <div className="absolute -right-28 -top-20 h-[620px] w-[620px] rounded-full bg-sky-500/18 blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-emerald-500/12 blur-3xl" />
      </div>

      <Container className="py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-900">
              Beranda
            </Link>
            <span className="text-slate-300" aria-hidden="true">
              &gt;
            </span>
            <span className="text-slate-700">Syarat & Ketentuan</span>
          </div>

          <h1 className="mt-5 text-balance text-[36px] font-semibold leading-[1.06] tracking-tight text-slate-900 md:text-[42px]">
            Syarat & Ketentuan
          </h1>
          <div className="mt-3 text-sm text-slate-600">Terakhir diperbarui: {updatedAt}</div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="text-sm font-semibold text-slate-900">Ringkasan</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-600">
                  Livinova adalah platform marketplace properti yang menampilkan listing dan informasi terkait Smart Living, serta
                  menyediakan fitur simulasi KPR. Kami bukan notaris, PPAT, bank, atau pengembang; transaksi akhir tetap dilakukan
                  oleh pihak terkait sesuai ketentuan yang berlaku.
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="text-sm font-semibold text-slate-900">Kebijakan Terkait</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-600">
                  Penggunaan layanan juga tunduk pada{" "}
                  <Link href="/kebijakan-privasi" className="font-semibold text-sky-700 hover:text-sky-800 hover:underline">
                    Kebijakan Privasi
                  </Link>
                  .
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] md:p-8">
            <div className="space-y-8 text-[15px] leading-8 text-slate-800 md:text-[16px]">
              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">1. Penerimaan Ketentuan</h2>
                <p className="mt-3 text-justify">
                  Dengan mengakses atau menggunakan layanan Livinova, Anda menyatakan setuju untuk terikat dengan Syarat & Ketentuan
                  ini. Jika Anda tidak setuju, mohon untuk tidak menggunakan layanan.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">2. Deskripsi Layanan</h2>
                <p className="mt-3 text-justify">
                  Livinova menyediakan platform untuk membantu pengguna menemukan informasi properti, termasuk proyek Smart Living,
                  profil developer, serta fitur simulasi KPR berbasis input pengguna. Informasi yang ditampilkan bersifat referensi
                  dan dapat berubah.
                </p>
                <p className="mt-3 text-justify">
                  Layanan dapat mencakup fitur akun, favorit, inquiry, dan konten edukasi (artikel). Kami dapat menambah, mengubah,
                  atau menghentikan fitur tertentu sewaktu-waktu.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">3. Peran Livinova dan Batasan Tanggung Jawab</h2>
                <ol className="mt-3 list-decimal space-y-2 pl-6 text-justify marker:font-semibold marker:text-slate-500">
                  <li className="pl-1">
                    Livinova bukan pihak dalam perjanjian jual beli antara pengguna dengan developer/penjual/agen, dan tidak
                    bertindak sebagai notaris, PPAT, bank, atau lembaga pembiayaan.
                  </li>
                  <li className="pl-1">
                    Simulasi KPR adalah <span className="font-semibold text-slate-900">estimasi</span> yang bergantung pada input dan
                    asumsi (bunga, tenor, biaya). Hasil aktual ditentukan oleh kebijakan bank/lembaga pembiayaan dan hasil analisis
                    kredit.
                  </li>
                  <li className="pl-1">
                    Informasi listing berasal dari pihak ketiga (developer/agen) dan/atau sumber lain. Kami berupaya menampilkan
                    informasi yang akurat dan terverifikasi, namun tidak menjamin bebas dari kesalahan, keterlambatan, atau perubahan.
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">4. Akun Pengguna</h2>
                <p className="mt-3 text-justify">
                  Anda bertanggung jawab menjaga kerahasiaan kredensial akun dan aktivitas yang terjadi pada akun Anda. Anda setuju
                  memberikan informasi yang benar dan memperbaruinya bila ada perubahan. Kami dapat menangguhkan atau menutup akun
                  yang melanggar ketentuan ini atau peraturan yang berlaku.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">5. Aturan Penggunaan</h2>
                <p className="mt-3 text-justify">Pengguna dilarang:</p>
                <ul className="mt-3 list-disc space-y-2 pl-6 text-justify">
                  <li className="pl-1">Mengunggah/menyebarkan konten yang melanggar hukum, menyesatkan, atau merugikan pihak lain.</li>
                  <li className="pl-1">Melakukan scraping, crawling, atau pengambilan data otomatis tanpa izin tertulis.</li>
                  <li className="pl-1">Mencoba meretas, mengganggu, atau menonaktifkan sistem keamanan layanan.</li>
                  <li className="pl-1">Menggunakan layanan untuk tujuan penipuan, spam, atau aktivitas yang melanggar hukum.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">6. Inquiry, Komunikasi, dan Konten Pengguna</h2>
                <p className="mt-3 text-justify">
                  Saat Anda mengirim inquiry, Anda memahami bahwa data yang relevan dapat diteruskan ke developer/agen untuk
                  menindaklanjuti permintaan Anda. Komunikasi dapat dilakukan melalui email, telepon, atau kanal lain yang Anda
                  setujui.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">7. Ketentuan Terkait Properti</h2>
                <p className="mt-3 text-justify">
                  Transaksi properti di Indonesia tunduk pada ketentuan pertanahan dan perumahan, termasuk praktik umum terkait
                  dokumen seperti sertifikat (mis. SHM/HGB), PPJB, AJB, dan proses notaris/PPAT. Pengguna bertanggung jawab melakukan
                  pemeriksaan dokumen (due diligence) dan memastikan kesesuaian informasi sebelum melakukan pembayaran atau
                  penandatanganan dokumen.
                </p>
                <p className="mt-3 text-justify">
                  Livinova menganjurkan pengguna untuk melakukan verifikasi terhadap legalitas, status proyek, jadwal serah terima,
                  spesifikasi unit, serta fitur Smart Living yang termasuk/opsional.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">8. Hak Kekayaan Intelektual</h2>
                <p className="mt-3 text-justify">
                  Seluruh konten, merek, logo, tampilan, dan materi pada layanan Livinova adalah milik Livinova atau pihak yang
                  memberikan lisensi, dan dilindungi oleh ketentuan yang berlaku. Anda tidak diperkenankan menyalin, memodifikasi,
                  mendistribusikan, atau mengeksploitasi materi tanpa izin.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">9. Tautan Pihak Ketiga</h2>
                <p className="mt-3 text-justify">
                  Layanan dapat memuat tautan ke situs pihak ketiga. Kami tidak bertanggung jawab atas konten, keamanan, atau
                  kebijakan situs pihak ketiga tersebut.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">10. Pengakhiran</h2>
                <p className="mt-3 text-justify">
                  Kami dapat menangguhkan atau menghentikan akses ke layanan bila terjadi dugaan pelanggaran ketentuan ini, ancaman
                  keamanan, atau kewajiban hukum. Pengguna dapat berhenti menggunakan layanan kapan saja.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">11. Perubahan Ketentuan</h2>
                <p className="mt-3 text-justify">
                  Kami dapat memperbarui Syarat & Ketentuan ini dari waktu ke waktu. Perubahan material akan diinformasikan secara
                  wajar melalui layanan. Tanggal pembaruan akan tercantum di bagian atas halaman.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">12. Hubungi Kami</h2>
                <p className="mt-3 text-justify">
                  Untuk pertanyaan terkait ketentuan ini, hubungi kami melalui halaman{" "}
                  <Link href="/kontak" className="font-semibold text-sky-700 hover:text-sky-800 hover:underline">
                    Kontak
                  </Link>
                  .
                </p>
              </section>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}


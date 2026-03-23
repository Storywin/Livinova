import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/site/container";
import { Card, CardContent } from "@/components/ui/card";

function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  return envUrl && envUrl.trim() ? envUrl.trim().replace(/\/$/, "") : "http://localhost:3000";
}

export const metadata: Metadata = {
  title: "Kebijakan Privasi | Livinova",
  description:
    "Kebijakan Privasi Livinova menjelaskan cara kami mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi pengguna sesuai praktik terbaik dan ketentuan yang berlaku di Indonesia.",
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: "/kebijakan-privasi" },
  openGraph: {
    type: "website",
    url: "/kebijakan-privasi",
    title: "Kebijakan Privasi | Livinova",
    description:
      "Kebijakan Privasi Livinova menjelaskan cara kami mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi pengguna sesuai praktik terbaik dan ketentuan yang berlaku di Indonesia.",
  },
  twitter: {
    card: "summary",
    title: "Kebijakan Privasi | Livinova",
    description:
      "Kebijakan Privasi Livinova menjelaskan cara kami mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi pengguna sesuai praktik terbaik dan ketentuan yang berlaku di Indonesia.",
  },
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
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
            <span className="text-slate-700">Kebijakan Privasi</span>
          </div>

          <h1 className="mt-5 text-balance text-[36px] font-semibold leading-[1.06] tracking-tight text-slate-900 md:text-[42px]">
            Kebijakan Privasi
          </h1>
          <div className="mt-3 text-sm text-slate-600">Terakhir diperbarui: {updatedAt}</div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="text-sm font-semibold text-slate-900">Ringkasan</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-600">
                  Kami mengumpulkan data yang relevan untuk menyediakan layanan marketplace properti, simulasi KPR, dan pengalaman
                  Smart Living yang lebih baik. Kami berusaha meminimalkan data yang dikumpulkan dan melindunginya dengan langkah
                  keamanan yang wajar.
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="text-sm font-semibold text-slate-900">Kontak Privasi</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-600">
                  Untuk pertanyaan terkait data pribadi, hubungi kami melalui halaman{" "}
                  <Link href="/kontak" className="font-semibold text-sky-700 hover:text-sky-800 hover:underline">
                    Kontak
                  </Link>
                  .
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] md:p-8">
            <div className="space-y-8 text-[15px] leading-8 text-slate-800 md:text-[16px]">
              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">1. Ruang Lingkup</h2>
                <p className="mt-3 text-justify">
                  Kebijakan Privasi ini menjelaskan bagaimana Livinova mengumpulkan, menggunakan, mengungkapkan, menyimpan, dan
                  melindungi data pribadi pengguna saat mengakses situs, aplikasi, dan layanan terkait, termasuk fitur pencarian
                  properti, profil developer, formulir inquiry, serta layanan simulasi KPR.
                </p>
                <p className="mt-3 text-justify">
                  Dengan menggunakan layanan Livinova, Anda menyatakan telah membaca dan memahami Kebijakan Privasi ini.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">2. Definisi</h2>
                <ul className="mt-3 list-disc space-y-2 pl-6 text-justify">
                  <li className="pl-1">
                    <span className="font-semibold text-slate-900">Data Pribadi</span> adalah setiap data tentang orang perseorangan
                    yang teridentifikasi atau dapat diidentifikasi secara tersendiri atau dikombinasi dengan informasi lainnya.
                  </li>
                  <li className="pl-1">
                    <span className="font-semibold text-slate-900">Pengguna</span> adalah pihak yang mengakses situs/aplikasi Livinova.
                  </li>
                  <li className="pl-1">
                    <span className="font-semibold text-slate-900">Layanan</span> adalah fitur dan fungsi yang disediakan Livinova.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">3. Dasar Hukum dan Kepatuhan</h2>
                <p className="mt-3 text-justify">
                  Livinova berupaya mematuhi ketentuan yang berlaku di Indonesia terkait perlindungan data dan transaksi elektronik,
                  termasuk prinsip-prinsip yang sejalan dengan Undang-Undang Perlindungan Data Pribadi (UU PDP), Undang-Undang ITE,
                  serta peraturan pelaksanaannya. Dalam konteks properti, kami juga berupaya menerapkan praktik penyajian informasi
                  yang bertanggung jawab sesuai ketentuan umum di bidang perumahan, pertanahan, dan transaksi jual beli.
                </p>
                <p className="mt-3 text-justify">
                  Kebijakan ini bersifat informasi umum dan bukan nasihat hukum. Jika diperlukan, Pengguna disarankan berkonsultasi
                  dengan penasihat hukum/PPAT/Notaris untuk kebutuhan spesifik.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">4. Data yang Kami Kumpulkan</h2>
                <p className="mt-3 text-justify">Kami dapat mengumpulkan kategori data berikut sesuai kebutuhan layanan:</p>
                <ol className="mt-3 list-decimal space-y-2 pl-6 text-justify marker:font-semibold marker:text-slate-500">
                  <li className="pl-1">
                    <span className="font-semibold text-slate-900">Data Identitas dan Kontak</span>: nama, email, nomor telepon, dan
                    informasi akun ketika Anda mendaftar/masuk atau mengisi formulir.
                  </li>
                  <li className="pl-1">
                    <span className="font-semibold text-slate-900">Data Preferensi Properti</span>: lokasi minat, rentang harga, tipe
                    unit, kebutuhan Smart Living/Smart Home, serta catatan inquiry.
                  </li>
                  <li className="pl-1">
                    <span className="font-semibold text-slate-900">Data Simulasi KPR</span>: nilai properti, DP, tenor, suku bunga
                    asumsi, dan parameter lain yang Anda masukkan untuk perhitungan estimasi.
                  </li>
                  <li className="pl-1">
                    <span className="font-semibold text-slate-900">Data Teknis</span>: alamat IP, jenis perangkat, browser, halaman
                    yang diakses, dan informasi log yang diperlukan untuk keamanan, analitik, serta peningkatan layanan.
                  </li>
                </ol>
                <p className="mt-3 text-justify">
                  Livinova tidak meminta data yang tidak relevan. Jika suatu saat dibutuhkan, kami akan menjelaskan tujuan dan meminta
                  persetujuan sesuai ketentuan yang berlaku.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">5. Cara Kami Menggunakan Data</h2>
                <p className="mt-3 text-justify">Data dapat digunakan untuk:</p>
                <ul className="mt-3 list-disc space-y-2 pl-6 text-justify">
                  <li className="pl-1">Menyediakan dan mengoperasikan layanan (akun, favorit, inquiry, dan fitur terkait).</li>
                  <li className="pl-1">Menyajikan rekomendasi listing dan pengalaman Smart Living yang lebih relevan.</li>
                  <li className="pl-1">Menghitung estimasi simulasi KPR dan menampilkan perbandingan produk bank (berbasis input Anda).</li>
                  <li className="pl-1">Menghubungi Anda untuk tindak lanjut inquiry atau permintaan informasi.</li>
                  <li className="pl-1">Mendeteksi, mencegah, dan menanggulangi aktivitas yang melanggar keamanan atau hukum.</li>
                  <li className="pl-1">Melakukan analitik untuk peningkatan kualitas produk dan pengalaman pengguna.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">6. Dasar Pemrosesan</h2>
                <p className="mt-3 text-justify">
                  Kami memproses data berdasarkan beberapa dasar yang relevan, termasuk persetujuan Pengguna, pelaksanaan perjanjian
                  (penyediaan layanan), kepatuhan terhadap kewajiban hukum, serta kepentingan yang sah (misalnya keamanan sistem dan
                  peningkatan layanan) sepanjang diperbolehkan oleh peraturan yang berlaku.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">7. Pengungkapan kepada Pihak Ketiga</h2>
                <p className="mt-3 text-justify">
                  Livinova dapat berbagi data secara terbatas dengan pihak ketiga yang relevan, misalnya:
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-6 text-justify">
                  <li className="pl-1">
                    <span className="font-semibold text-slate-900">Developer/agen</span> terkait listing untuk menindaklanjuti inquiry
                    Anda (berdasarkan permintaan Anda).
                  </li>
                  <li className="pl-1">
                    <span className="font-semibold text-slate-900">Penyedia layanan teknologi</span> (hosting, analitik, email) yang
                    membantu operasional layanan dengan kewajiban kerahasiaan dan keamanan.
                  </li>
                  <li className="pl-1">
                    <span className="font-semibold text-slate-900">Penegak hukum/otoritas</span> bila diwajibkan oleh peraturan atau
                    perintah yang sah.
                  </li>
                </ul>
                <p className="mt-3 text-justify">
                  Kami tidak menjual data pribadi. Kami membatasi akses pihak ketiga sesuai kebutuhan layanan dan menerapkan kontrol
                  yang wajar.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">8. Cookies dan Teknologi Pelacakan</h2>
                <p className="mt-3 text-justify">
                  Kami dapat menggunakan cookies atau teknologi serupa untuk menyimpan preferensi, menjaga sesi login, dan memahami
                  cara layanan digunakan. Anda dapat mengatur browser untuk menolak cookies, namun beberapa fitur dapat tidak
                  berfungsi optimal.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">9. Keamanan Data</h2>
                <p className="mt-3 text-justify">
                  Kami menerapkan langkah keamanan teknis dan organisasi yang wajar, termasuk kontrol akses, pemantauan, dan praktik
                  pengamanan sistem. Namun, tidak ada metode transmisi atau penyimpanan yang 100% aman. Pengguna juga bertanggung
                  jawab menjaga kerahasiaan kredensial akun.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">10. Retensi Data</h2>
                <p className="mt-3 text-justify">
                  Kami menyimpan data selama diperlukan untuk tujuan layanan, kepatuhan hukum, penyelesaian sengketa, atau penegakan
                  perjanjian. Setelah tidak diperlukan, data akan dihapus atau dianonimkan sesuai kemampuan sistem dan ketentuan yang
                  berlaku.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">11. Hak Pengguna</h2>
                <p className="mt-3 text-justify">
                  Pengguna dapat memiliki hak tertentu terkait data pribadinya, seperti meminta akses, koreksi, pembaruan, atau
                  penghapusan sesuai ketentuan yang berlaku. Permintaan dapat disampaikan melalui{" "}
                  <Link href="/kontak" className="font-semibold text-sky-700 hover:text-sky-800 hover:underline">
                    Kontak
                  </Link>
                  . Kami dapat meminta verifikasi identitas untuk melindungi keamanan data Anda.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">12. Tautan ke Situs Lain</h2>
                <p className="mt-3 text-justify">
                  Layanan dapat memuat tautan ke situs pihak ketiga (misalnya informasi perbankan, regulasi, atau developer). Kami
                  tidak bertanggung jawab atas praktik privasi pihak ketiga tersebut. Kami menyarankan Anda membaca kebijakan privasi
                  masing-masing situs.
                </p>
              </section>

              <section>
                <h2 className="text-[20px] font-semibold text-slate-900 md:text-[22px]">13. Perubahan Kebijakan</h2>
                <p className="mt-3 text-justify">
                  Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan material akan diinformasikan melalui
                  layanan atau kanal komunikasi yang wajar. Tanggal pembaruan akan tercantum di bagian atas.
                </p>
              </section>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}


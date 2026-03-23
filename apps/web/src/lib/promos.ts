export type PromoAccent = "sky" | "emerald" | "violet" | "amber" | "navy";

export type PromoItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  accent: PromoAccent;
  badge: string;
  periodText: string;
  highlights: string[];
  terms: string[];
  seoDescription: string;
};

export const promos: PromoItem[] = [
  {
    id: "promo-ramadan-smart",
    slug: "promo-ramadan-smart-living",
    title: "Promo Ramadan Smart Living",
    subtitle: "Cashback & bundling perangkat smart home untuk unit pilihan.",
    ctaLabel: "Lihat promo",
    accent: "amber",
    badge: "Promo",
    periodText: "Periode terbatas • Ramadan",
    highlights: ["Cashback untuk unit pilihan", "Bundling Smart Lock + CCTV + sensor", "Gratis konsultasi instalasi smart home"],
    terms: [
      "Berlaku pada proyek dan unit tertentu",
      "Ketersediaan bundling mengikuti jadwal instalasi",
      "Detail promo mengikuti kebijakan kampanye yang aktif",
    ],
    seoDescription:
      "Promo Ramadan Smart Living di Livinova: cashback dan bundling perangkat smart home untuk unit pilihan. Cek detail promo, syarat, dan cara klaim.",
  },
  {
    id: "promo-kpr-ringan",
    slug: "kpr-mulai-lebih-ringan",
    title: "KPR Mulai Lebih Ringan",
    subtitle: "Simulasi cicilan dan biaya awal untuk membantu keputusan.",
    ctaLabel: "Cek detail",
    accent: "violet",
    badge: "Iklan",
    periodText: "Update mingguan • Produk bank terpilih",
    highlights: ["Estimasi cicilan cepat", "Rincian biaya awal transparan", "Bandingkan produk KPR antar bank"],
    terms: [
      "Hasil simulasi bersifat estimasi, bukan penawaran final bank",
      "Angka dapat berubah mengikuti konfigurasi produk dan kebijakan bank",
      "Gunakan data harga dan DP yang sesuai kebutuhan",
    ],
    seoDescription:
      "Iklan KPR Mulai Lebih Ringan: gunakan simulasi KPR Livinova untuk estimasi cicilan dan biaya awal. Bandingkan produk bank dengan cepat dan jelas.",
  },
  {
    id: "promo-verified-week",
    slug: "verified-week",
    title: "Verified Week",
    subtitle: "Koleksi proyek terverifikasi dengan penawaran terbatas.",
    ctaLabel: "Lihat koleksi",
    accent: "sky",
    badge: "Promo",
    periodText: "Periode terbatas • Mingguan",
    highlights: ["Kurasi proyek terverifikasi", "Unit terbatas dan cepat berubah", "Cek lokasi, spesifikasi, dan status online"],
    terms: [
      "Daftar proyek mengikuti status verifikasi yang aktif",
      "Penawaran dapat berubah sewaktu-waktu",
      "Ketersediaan unit tergantung update dari developer",
    ],
    seoDescription:
      "Verified Week Livinova: kurasi proyek terverifikasi dengan penawaran terbatas. Jelajahi koleksi, cek unit tersisa, dan bandingkan spesifikasi dengan mudah.",
  },
  {
    id: "promo-open-house",
    slug: "open-house-smart-living",
    title: "Open House Smart Living",
    subtitle: "Jadwalkan kunjungan dan lihat demo integrasi perangkat.",
    ctaLabel: "Jadwalkan",
    accent: "emerald",
    badge: "Iklan",
    periodText: "Jadwal fleksibel • Slot terbatas",
    highlights: ["Kunjungan lokasi dan show unit", "Demo fitur smart home", "Konsultasi kebutuhan perangkat"],
    terms: ["Jadwal tergantung ketersediaan slot", "Konfirmasi dilakukan oleh tim/developer", "Lokasi dan proyek mengikuti daftar yang aktif"],
    seoDescription:
      "Open House Smart Living: jadwalkan kunjungan dan lihat demo integrasi smart home. Dapatkan pengalaman langsung sebelum membeli unit.",
  },
  {
    id: "promo-developer-featured",
    slug: "developer-featured",
    title: "Developer Featured",
    subtitle: "Sorotan developer pilihan dan proyek premium minggu ini.",
    ctaLabel: "Lihat daftar",
    accent: "navy",
    badge: "Promo",
    periodText: "Sorotan mingguan • Developer pilihan",
    highlights: ["Developer terverifikasi", "Proyek premium dengan presentasi lengkap", "Update rutin ketersediaan unit"],
    terms: ["Sorotan mengikuti program kampanye yang aktif", "Tampilan proyek menyesuaikan status verifikasi", "Konten promo dapat berubah sesuai jadwal"],
    seoDescription:
      "Developer Featured: sorotan developer pilihan dan proyek premium minggu ini. Lihat daftar dan jelajahi properti smart living terverifikasi.",
  },
  {
    id: "promo-smart-bundle",
    slug: "smart-bundle",
    title: "Smart Bundle",
    subtitle: "Paket smart lock + CCTV + sensor dengan instalasi terjadwal.",
    ctaLabel: "Pelajari",
    accent: "sky",
    badge: "Iklan",
    periodText: "Paket terbatas • Selama persediaan",
    highlights: ["Bundling perangkat populer", "Instalasi terjadwal", "Integrasi keamanan & monitoring"],
    terms: [
      "Jenis perangkat menyesuaikan paket yang dipilih",
      "Jadwal instalasi mengikuti ketersediaan teknisi",
      "Berlaku pada proyek/unit tertentu",
    ],
    seoDescription:
      "Smart Bundle: paket smart lock, CCTV, dan sensor dengan instalasi terjadwal. Pelajari detail paket dan cara klaim melalui listing terkait.",
  },
  {
    id: "promo-last-units",
    slug: "last-units",
    title: "Last Units Alert",
    subtitle: "Unit tersisa untuk proyek tertentu — cek ketersediaan cepat.",
    ctaLabel: "Cek unit",
    accent: "amber",
    badge: "Promo",
    periodText: "Update real-time • Kuota menipis",
    highlights: ["Pantau unit tersisa", "Cek harga dan KPR mulai dari", "Hubungi developer lebih cepat"],
    terms: ["Ketersediaan unit dapat berubah cepat", "Harga mengikuti listing yang aktif", "Promo tergantung program kampanye berjalan"],
    seoDescription:
      "Last Units Alert: pantau unit tersisa untuk proyek tertentu. Cek ketersediaan cepat, lihat harga, dan estimasi KPR mulai dari per bulan.",
  },
];

export type CoaAccountType = "asset" | "liability" | "equity" | "income" | "expense";

export type CoaAccount = {
  code: string;
  name: string;
  type: CoaAccountType;
};

export const DEFAULT_PROPERTY_COA: readonly CoaAccount[] = [
  { code: "101.01", name: "Kas Kecil (Petty Cash)", type: "asset" },
  { code: "101.02", name: "Bank Operasional", type: "asset" },
  { code: "101.03", name: "Bank Escrow / Rekening Penampungan", type: "asset" },
  { code: "101.04", name: "Bank Proyek / Project Fund", type: "asset" },
  { code: "101.05", name: "Kas Dalam Perjalanan (Cash in Transit)", type: "asset" },
  { code: "101.06", name: "Deposito Berjangka", type: "asset" },

  { code: "102.01", name: "Piutang Penjualan Unit", type: "asset" },
  { code: "102.02", name: "Piutang Inhouse (Cicilan Langsung)", type: "asset" },
  { code: "102.03", name: "Piutang KPR (Bank Partner)", type: "asset" },
  { code: "102.04", name: "Piutang Sewa", type: "asset" },
  { code: "102.05", name: "Piutang Lain-lain", type: "asset" },
  { code: "102.06", name: "Cadangan Kerugian Piutang", type: "asset" },

  { code: "103.01", name: "Persediaan Tanah Mentah", type: "asset" },
  { code: "103.02", name: "Persediaan Tanah Matang (Ready to Build)", type: "asset" },
  { code: "103.03", name: "WIP Pengembangan Lahan", type: "asset" },
  { code: "103.04", name: "WIP Konstruksi Bangunan", type: "asset" },
  { code: "103.05", name: "WIP Infrastruktur / Fasum-Fasos", type: "asset" },
  { code: "103.06", name: "Persediaan Material Konstruksi", type: "asset" },
  { code: "103.07", name: "Persediaan Unit Selesai (Ready Stock)", type: "asset" },

  { code: "104.01", name: "Uang Muka Vendor Konstruksi", type: "asset" },
  { code: "104.02", name: "Uang Muka Perizinan & Legal", type: "asset" },
  { code: "104.03", name: "Uang Muka Pemasaran", type: "asset" },
  { code: "104.04", name: "Beban Dibayar Dimuka - Asuransi", type: "asset" },
  { code: "104.05", name: "Beban Dibayar Dimuka - Sewa", type: "asset" },
  { code: "104.06", name: "PPN Masukan", type: "asset" },
  { code: "104.07", name: "PPh Dibayar Dimuka", type: "asset" },
  { code: "104.08", name: "PBB Dibayar Dimuka", type: "asset" },

  { code: "105.01", name: "Aset Tetap - Tanah Kantor", type: "asset" },
  { code: "105.02", name: "Aset Tetap - Bangunan Kantor", type: "asset" },
  { code: "105.03", name: "Aset Tetap - Renovasi / Improvement", type: "asset" },
  { code: "105.04", name: "Aset Tetap - Kendaraan", type: "asset" },
  { code: "105.05", name: "Aset Tetap - Peralatan & IT", type: "asset" },
  { code: "105.06", name: "Aset Tetap - Furniture & Perlengkapan", type: "asset" },
  { code: "105.07", name: "Akumulasi Penyusutan - Bangunan", type: "asset" },
  { code: "105.08", name: "Akumulasi Penyusutan - Kendaraan", type: "asset" },
  { code: "105.09", name: "Akumulasi Penyusutan - Peralatan & IT", type: "asset" },
  { code: "105.10", name: "Akumulasi Penyusutan - Furniture & Perlengkapan", type: "asset" },

  { code: "201.01", name: "Hutang Usaha - Subkontraktor", type: "liability" },
  { code: "201.02", name: "Hutang Usaha - Supplier Material", type: "liability" },
  { code: "201.03", name: "Hutang Usaha - Jasa Profesional", type: "liability" },
  { code: "201.04", name: "Hutang Retensi (Retainage Payable)", type: "liability" },
  { code: "201.05", name: "Hutang Usaha - Lain-lain", type: "liability" },

  { code: "202.01", name: "Uang Muka Konsumen - Booking Fee", type: "liability" },
  { code: "202.02", name: "Uang Muka Konsumen - Down Payment (DP)", type: "liability" },
  { code: "202.03", name: "Uang Muka Konsumen - Angsuran Diterima", type: "liability" },
  { code: "202.04", name: "Titipan Biaya Notaris / AJB / Balik Nama", type: "liability" },
  { code: "202.05", name: "Pendapatan Diterima Dimuka (Sewa)", type: "liability" },
  { code: "202.06", name: "Titipan Service Charge / CAM", type: "liability" },
  { code: "202.07", name: "Deposit Sewa / Security Deposit", type: "liability" },

  { code: "203.01", name: "Hutang Bank - Kredit Modal Kerja (KMK)", type: "liability" },
  { code: "203.02", name: "Hutang Bank - Kredit Konstruksi", type: "liability" },
  { code: "203.03", name: "Hutang Bank - KPR Induk / Bridging", type: "liability" },
  { code: "203.04", name: "Hutang Leasing Kendaraan", type: "liability" },

  { code: "204.01", name: "Hutang Pajak - PPN Keluaran", type: "liability" },
  { code: "204.02", name: "Hutang Pajak - PPh Final (4 ayat 2)", type: "liability" },
  { code: "204.03", name: "Hutang Pajak - PPh 21", type: "liability" },
  { code: "204.04", name: "Hutang Pajak - PPh 23", type: "liability" },
  { code: "204.05", name: "Hutang Pajak - PPh 25/29", type: "liability" },

  { code: "205.01", name: "Biaya Yang Masih Harus Dibayar", type: "liability" },
  { code: "205.02", name: "Hutang Gaji", type: "liability" },
  { code: "205.03", name: "Hutang BPJS", type: "liability" },
  { code: "205.04", name: "Hutang Bunga", type: "liability" },
  { code: "205.05", name: "Hutang Insentif Sales", type: "liability" },

  { code: "301.01", name: "Modal Disetor", type: "equity" },
  { code: "301.02", name: "Tambahan Modal Disetor", type: "equity" },
  { code: "302.01", name: "Laba Ditahan (Retained Earnings)", type: "equity" },
  { code: "303.01", name: "Laba (Rugi) Tahun Berjalan", type: "equity" },

  { code: "401.01", name: "Pendapatan Penjualan Unit Properti", type: "income" },
  { code: "401.02", name: "Pendapatan Penjualan Tanah Kavling", type: "income" },
  { code: "401.03", name: "Pendapatan Upgrade / Kelebihan Tanah & Spesifikasi", type: "income" },
  { code: "401.04", name: "Pendapatan Administrasi / Pengalihan Hak", type: "income" },
  { code: "401.05", name: "Pendapatan Progres / Kontrak Konstruksi", type: "income" },

  { code: "402.01", name: "Pendapatan Sewa", type: "income" },
  { code: "402.02", name: "Pendapatan Service Charge / CAM", type: "income" },
  { code: "402.03", name: "Pendapatan Parkir / Storage", type: "income" },
  { code: "402.04", name: "Pendapatan Denda Keterlambatan", type: "income" },
  { code: "402.05", name: "Pendapatan Bunga Bank", type: "income" },
  { code: "402.06", name: "Pendapatan Lain-lain", type: "income" },

  { code: "501.01", name: "HPP - Tanah", type: "expense" },
  { code: "501.02", name: "HPP - Bangunan", type: "expense" },
  { code: "501.03", name: "HPP - Infrastruktur / Fasum-Fasos", type: "expense" },
  { code: "501.04", name: "HPP - Komisi & Biaya Penjualan Langsung", type: "expense" },

  { code: "503.01", name: "Beban Pemasaran - Iklan & Digital", type: "expense" },
  { code: "503.02", name: "Beban Pemasaran - Event & Pameran", type: "expense" },
  { code: "503.03", name: "Beban Komisi Agen / Broker", type: "expense" },
  { code: "503.04", name: "Beban Bonus / Insentif Sales", type: "expense" },
  { code: "503.05", name: "Beban Branding & Materi Promosi", type: "expense" },

  { code: "504.01", name: "Beban Gaji, Upah & Tunjangan", type: "expense" },
  { code: "504.02", name: "Beban BPJS Kesehatan & Ketenagakerjaan", type: "expense" },
  { code: "504.03", name: "Beban Listrik, Air & Telepon", type: "expense" },
  { code: "504.04", name: "Beban Perlengkapan & ATK", type: "expense" },
  { code: "504.05", name: "Beban Sewa Kantor", type: "expense" },
  { code: "504.06", name: "Beban Perjalanan Dinas", type: "expense" },
  { code: "504.07", name: "Beban Jasa Profesional (Audit/Legal/Konsultan)", type: "expense" },
  { code: "504.08", name: "Beban Perizinan, Legal & Notaris", type: "expense" },
  { code: "504.09", name: "Beban Pemeliharaan Kantor & Operasional", type: "expense" },
  { code: "504.10", name: "Beban Asuransi", type: "expense" },
  { code: "504.11", name: "Beban Keamanan & Kebersihan", type: "expense" },
  { code: "504.12", name: "Beban Pajak & Retribusi", type: "expense" },
  { code: "504.13", name: "Beban Penyusutan", type: "expense" },
  { code: "504.14", name: "Beban Administrasi Bank", type: "expense" },
  { code: "504.15", name: "Beban Software, IT & Langganan", type: "expense" },
  { code: "504.16", name: "Beban Pelatihan & Rekrutmen", type: "expense" },
  { code: "504.17", name: "Beban Representasi & Jamuan", type: "expense" },

  { code: "505.01", name: "Beban Bunga Pinjaman", type: "expense" },
  { code: "505.02", name: "Beban Provisi & Administrasi Pinjaman", type: "expense" },
  { code: "506.01", name: "Beban Lain-lain", type: "expense" },
] as const;

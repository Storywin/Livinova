import { Prisma, PrismaClient, RoleName } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const roleNames = Object.values(RoleName);
  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const roles = await prisma.role.findMany();
  const roleIdByName = new Map<RoleName, string>(roles.map((r) => [r.name, r.id]));

  async function upsertDemoUser(input: {
    email: string;
    password: string;
    name: string;
    role: RoleName;
  }) {
    const roleId = roleIdByName.get(input.role);
    if (!roleId) throw new Error(`Role ${input.role} tidak ditemukan`);

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await prisma.user.upsert({
      where: { email: input.email },
      update: {
        name: input.name,
        passwordHash,
        status: "active",
      },
      create: {
        email: input.email,
        passwordHash,
        name: input.name,
        status: "active",
      },
    });

    await prisma.userRole.deleteMany({ where: { userId: user.id } });
    await prisma.userRole.create({ data: { userId: user.id, roleId } });

    return user;
  }

  const superAdminEmail = "superadmin@livinova.local";
  const superAdminPassword = "Admin12345!";
  await upsertDemoUser({
    email: superAdminEmail,
    password: superAdminPassword,
    name: "Super Admin Livinova",
    role: RoleName.super_admin,
  });

  // --- ERP DEMO ACCOUNTS ---
  // 1. Partner (Perusahaan B)
  await upsertDemoUser({
    email: "distributor@companya.id",
    password: "Partner12345!",
    name: "Partner Company A",
    role: RoleName.partner,
  });

  const partner = await prisma.partner.upsert({
    where: { email: "distributor@companya.id" },
    update: { name: "Partner Company A" },
    create: {
      name: "Partner Company A",
      email: "distributor@companya.id",
      phone: "0812-3456-7890",
    },
  });

  // 2. Tenant Admin (Perusahaan C)
  const tenant = await prisma.tenant.upsert({
    where: { slug: "properti-sejahtera" },
    update: {
      name: "PT Properti Sejahtera",
      status: "active",
      partnerId: partner.id,
    },
    create: {
      name: "PT Properti Sejahtera",
      slug: "properti-sejahtera",
      status: "active",
      partnerId: partner.id,
    },
  });

  const tenantAdminUser = await upsertDemoUser({
    email: "admin@properti.co.id",
    password: "Tenant12345!",
    name: "Admin Properti Sejahtera",
    role: RoleName.tenant_admin,
  });

  await prisma.user.update({
    where: { id: tenantAdminUser.id },
    data: { tenantId: tenant.id },
  });

  // 2.1 Licensed Staff (Sales)
  const salesUser = await upsertDemoUser({
    email: "sales@properti.co.id",
    password: "Staff12345!",
    name: "Sales Properti Sejahtera",
    role: RoleName.erp_user, // Use erp_user for staff
  });

  await prisma.user.update({
    where: { id: salesUser.id },
    data: { tenantId: tenant.id },
  });

  // 3. Create initial license for tenant
  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(startDate.getFullYear() + 1);

  await prisma.license.upsert({
    where: { id: "demo-license-id" }, // Using a fixed ID for upsert
    update: { endDate, status: "active" },
    create: {
      id: "demo-license-id",
      tenantId: tenant.id,
      userId: tenantAdminUser.id,
      startDate,
      endDate,
      status: "active",
      deviceName: "Enterprise Pro Activation",
    },
  });

  // --- ERP TENANT DUMMY DATA ---
  // 4. Create ERP Projects for Tenant
  let erpProject = await prisma.erpProject.findFirst({
    where: { tenantId: tenant.id, name: "Griya Livinova Residence" },
  });

  if (!erpProject) {
    erpProject = await prisma.erpProject.create({
      data: {
        tenantId: tenant.id,
        name: "Griya Livinova Residence",
        description: "Hunian asri dengan konsep smart living di pusat kota.",
      },
    });
  }

  // 5. Create ERP Units for Project
  const unitCodes = ["A-01", "A-02", "A-03", "B-01", "B-02", "C-01"];
  for (const code of unitCodes) {
    await prisma.erpUnit.upsert({
      where: { projectId_unitCode: { projectId: erpProject.id, unitCode: code } },
      update: {
        status: code === "A-01" ? "booked" : code === "B-01" ? "sold" : "available",
        price: new Prisma.Decimal(750000000),
      },
      create: {
        projectId: erpProject.id,
        unitCode: code,
        status: code === "A-01" ? "booked" : code === "B-01" ? "sold" : "available",
        price: new Prisma.Decimal(750000000),
      },
    });
  }

  // 6. Create ERP Customers
  let erpCustomer = await prisma.erpCustomer.findFirst({
    where: { tenantId: tenant.id, email: "budi.santoso@gmail.com" },
  });

  if (!erpCustomer) {
    erpCustomer = await prisma.erpCustomer.create({
      data: {
        tenantId: tenant.id,
        name: "Budi Santoso",
        email: "budi.santoso@gmail.com",
        phone: "08123456789",
        address: "Jl. Melati No. 12, Jakarta",
      },
    });
  }

  // 7. Create ERP Sales
  const bookedUnit = await prisma.erpUnit.findFirst({
    where: { projectId: erpProject.id, unitCode: "A-01" },
  });
  if (bookedUnit) {
    const existingSales = await prisma.erpSales.findFirst({
      where: { tenantId: tenant.id, unitId: bookedUnit.id },
    });

    if (!existingSales) {
      await prisma.erpSales.create({
        data: {
          tenantId: tenant.id,
          projectId: erpProject.id,
          unitId: bookedUnit.id,
          customerId: erpCustomer.id,
          totalPrice: bookedUnit.price,
          status: "approved",
        },
      });
    }
  }

  // 8. Seed COA for Demo Tenant
  const existingAccounts = await prisma.erpAccount.count({ where: { tenantId: tenant.id } });
  if (existingAccounts === 0) {
    const standardCOA = [
      { code: "101.01", name: "Kas Utama (Cash on Hand)", type: "asset" },
      { code: "101.02", name: "Bank Mandiri Operasional", type: "asset" },
      { code: "101.03", name: "Bank BCA Escrow", type: "asset" },
      { code: "102.01", name: "Piutang Usaha Konsumen", type: "asset" },
      { code: "103.01", name: "Persediaan Lahan Mentah", type: "asset" },
      { code: "103.03", name: "Pekerjaan Dalam Pelaksanaan (WIP)", type: "asset" },
      { code: "201.01", name: "Hutang Usaha - Subkontraktor", type: "liability" },
      { code: "202.01", name: "Uang Muka Konsumen - Booking Fee", type: "liability" },
      { code: "301.01", name: "Modal Saham Disetor", type: "equity" },
      { code: "401.01", name: "Pendapatan Penjualan Unit Properti", type: "income" },
      { code: "501.01", name: "Beban Pokok Penjualan (HPP)", type: "expense" },
      { code: "503.01", name: "Beban Gaji & Tunjangan", type: "expense" },
    ];
    await prisma.erpAccount.createMany({
      data: standardCOA.map((a) => ({ ...a, tenantId: tenant.id })),
    });
  }

  // --- END ERP DEMO ACCOUNTS ---
  const pricingPlans = [
    {
      name: "Starter (30 Days)",
      durationDays: 30,
      price: new Prisma.Decimal(500000),
      description: "Ideal for testing and small operations.",
    },
    {
      name: "Professional (180 Days)",
      durationDays: 180,
      price: new Prisma.Decimal(2500000),
      description: "Best for growing development companies.",
    },
    {
      name: "Enterprise (1 Year)",
      durationDays: 365,
      price: new Prisma.Decimal(5000000),
      description: "Full enterprise access for large scale operations.",
    },
  ];

  for (const plan of pricingPlans) {
    await prisma.pricingPlan.upsert({
      where: { id: `plan-${slugify(plan.name)}` },
      update: plan,
      create: {
        id: `plan-${slugify(plan.name)}`,
        ...plan,
        ownerType: "SYSTEM",
      },
    });
  }

  // --- END ERP DEMO ACCOUNTS ---

  await upsertDemoUser({
    email: "public@livinova.local",
    password: "Public12345!",
    name: "Demo Public",
    role: RoleName.public,
  });

  await upsertDemoUser({
    email: "buyer@livinova.local",
    password: "Buyer12345!",
    name: "Demo Buyer",
    role: RoleName.buyer,
  });

  const developerUser = await upsertDemoUser({
    email: "developer@livinova.local",
    password: "Developer12345!",
    name: "Demo Developer",
    role: RoleName.developer,
  });

  await upsertDemoUser({
    email: "verifier@livinova.local",
    password: "Verifier12345!",
    name: "Demo Verifier",
    role: RoleName.verifier,
  });

  await upsertDemoUser({
    email: "admin@livinova.local",
    password: "Admin12345!",
    name: "Demo Admin",
    role: RoleName.admin,
  });

  const pendingDeveloper = await prisma.developer.upsert({
    where: { slug: "demo-developer-pending" },
    update: {
      name: "Demo Developer Pending",
      verificationStatus: "pending",
      city: "Jakarta Selatan",
      province: "DKI Jakarta",
      contactPersonName: "Raka Pradana",
      contactPersonEmail: "raka@demodeveloper.id",
      contactPersonPhone: "081298765432",
    },
    create: {
      name: "Demo Developer Pending",
      slug: "demo-developer-pending",
      description: "Developer demo untuk menguji alur verifikasi.",
      website: "https://demodeveloper.id",
      email: "hello@demodeveloper.id",
      phone: "021-000111",
      address: "Jl. Contoh No. 1, Jakarta Selatan",
      city: "Jakarta Selatan",
      province: "DKI Jakarta",
      contactPersonName: "Raka Pradana",
      contactPersonEmail: "raka@demodeveloper.id",
      contactPersonPhone: "081298765432",
      verificationStatus: "pending",
    },
  });

  await prisma.developerUser.upsert({
    where: { developerId_userId: { developerId: pendingDeveloper.id, userId: developerUser.id } },
    update: {},
    create: { developerId: pendingDeveloper.id, userId: developerUser.id },
  });

  const smartFeatures = [
    { name: "Smart Lock", category: "keamanan" as const },
    { name: "CCTV Terintegrasi", category: "keamanan" as const },
    { name: "Smart Lighting", category: "kenyamanan" as const },
    { name: "Sensor Kebocoran Air", category: "keamanan" as const },
    { name: "Smart AC Control", category: "kenyamanan" as const },
    { name: "Monitoring Energi", category: "efisiensi_energi" as const },
  ];

  for (const f of smartFeatures) {
    await prisma.smartFeature.upsert({
      where: { slug: slugify(f.name) },
      update: { name: f.name, category: f.category },
      create: { name: f.name, slug: slugify(f.name), category: f.category },
    });
  }

  const adPackages: Array<{
    type:
      | "basic_listing"
      | "verified_listing"
      | "featured_listing"
      | "sponsored_project"
      | "banner_advertising";
    name: string;
    price: Prisma.Decimal;
    durationDays: number;
  }> = [
    {
      type: "basic_listing",
      name: "Basic Listing",
      price: new Prisma.Decimal(0),
      durationDays: 30,
    },
    {
      type: "verified_listing",
      name: "Verified Listing",
      price: new Prisma.Decimal(2500000),
      durationDays: 30,
    },
    {
      type: "featured_listing",
      name: "Featured Listing",
      price: new Prisma.Decimal(7500000),
      durationDays: 30,
    },
    {
      type: "sponsored_project",
      name: "Sponsored Project",
      price: new Prisma.Decimal(15000000),
      durationDays: 30,
    },
    {
      type: "banner_advertising",
      name: "Banner Advertising",
      price: new Prisma.Decimal(20000000),
      durationDays: 30,
    },
  ];

  for (const p of adPackages) {
    await prisma.adPackage.upsert({
      where: { type: p.type },
      update: {
        name: p.name,
        price: p.price,
        durationDays: p.durationDays,
        isActive: true,
      },
      create: {
        type: p.type,
        name: p.name,
        price: p.price,
        durationDays: p.durationDays,
        isActive: true,
      },
    });
  }

  const banks = [
    { name: "BCA", isSharia: false },
    { name: "BRI", isSharia: false },
    { name: "BNI", isSharia: false },
    { name: "BTN", isSharia: false },
    { name: "Mandiri", isSharia: false },
    { name: "BSI Syariah", isSharia: true },
    { name: "Panin Bank", isSharia: false },
    { name: "UOB", isSharia: false },
    { name: "BCA Syariah", isSharia: true },
    { name: "KB Bukopin", isSharia: false },
    { name: "CIMB Niaga", isSharia: false },
    { name: "Danamon", isSharia: false },
    { name: "Maybank", isSharia: false },
    { name: "Commonwealth Bank", isSharia: false },
  ];

  const bankBySlug = new Map<string, { id: string; isSharia: boolean }>();
  for (const b of banks) {
    const bank = await prisma.mortgageBank.upsert({
      where: { slug: slugify(b.name) },
      update: { name: b.name, isSharia: b.isSharia },
      create: { name: b.name, slug: slugify(b.name), isSharia: b.isSharia },
    });
    bankBySlug.set(bank.slug, { id: bank.id, isSharia: bank.isSharia });
  }

  const sourceCheckedAt = new Date("2026-03-24T00:00:00.000Z");

  const products = [
    {
      bankSlug: "bca",
      name: "KPR BCA Fixed Berjenjang 10Y (s.d. 31 Mar 2026)",
      minTenorMonths: 120,
      rateSchedule: [
        { months: 12, ratePercent: 2.9, kind: "fixed" },
        { months: 24, ratePercent: 5.99, kind: "fixed" },
        { months: 36, ratePercent: 7.99, kind: "fixed" },
        { months: 48, ratePercent: 9.99, kind: "fixed" },
      ],
      floatingRateAssumption: new Prisma.Decimal("11.000"),
      adminFee: new Prisma.Decimal(1500000),
      insuranceRate: new Prisma.Decimal("0.350"),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(8000000),
      sourceUrl: "https://rumahsaya.bca.co.id/id/info-kpr/bunga-kpr-spesial",
      sourceTitle: "Rumahsaya BCA - Bunga KPR Spesial",
      sourceCheckedAt,
      notes:
        "Bunga fixed berjenjang efektif p.a. berlaku s.d. 31 Maret 2026. Floating setelah periode promo mengikuti ketentuan bank; floatingRateAssumption dipakai sebagai asumsi simulasi.",
    },
    {
      bankSlug: "bri",
      name: "KPR Sejahtera",
      defaultInterestRate: new Prisma.Decimal("8.750"),
      promoInterestRate: new Prisma.Decimal("7.250"),
      fixedPeriodMonths: 24,
      floatingRateAssumption: new Prisma.Decimal("11.500"),
      adminFee: new Prisma.Decimal(1000000),
      insuranceRate: new Prisma.Decimal("0.400"),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(7500000),
    },
    {
      bankSlug: "bni",
      name: "BNI Griya Single Fixed 1Y (Kategori B)",
      minTenorMonths: 12,
      defaultInterestRate: new Prisma.Decimal("7.250"),
      promoInterestRate: new Prisma.Decimal("7.250"),
      fixedPeriodMonths: 12,
      floatingRateAssumption: new Prisma.Decimal("10.750"),
      adminFee: new Prisma.Decimal(1250000),
      insuranceRate: new Prisma.Decimal("0.380"),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(7800000),
      sourceUrl: "https://www.bni.co.id/id-id/individu/pinjaman/bni-griya",
      sourceTitle: "BNI Griya - Suku Bunga 2026",
      sourceCheckedAt,
      notes:
        "Mengacu tabel Suku Bunga 2026 (Kategori B: pembelian di developer kerjasama & non-primary). Setelah periode fixed berakhir berlaku bunga floating sesuai ketentuan bank.",
    },
    {
      bankSlug: "bni",
      name: "BNI Griya Fixed Berjenjang 10Y (Kategori B)",
      minTenorMonths: 120,
      rateSchedule: [
        { months: 12, ratePercent: 3.75, kind: "fixed_step" },
        { months: 24, ratePercent: 5.75, kind: "fixed_step" },
        { months: 12, ratePercent: 8.75, kind: "fixed_step" },
        { months: 72, ratePercent: 10.75, kind: "fixed_step" },
      ],
      floatingRateAssumption: new Prisma.Decimal("10.750"),
      adminFee: new Prisma.Decimal(1250000),
      insuranceRate: new Prisma.Decimal("0.380"),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(7800000),
      sourceUrl: "https://www.bni.co.id/id-id/individu/pinjaman/bni-griya",
      sourceTitle: "BNI Griya - Suku Bunga 2026",
      sourceCheckedAt,
      notes:
        "Mengacu tabel Fixed Berjenjang (Kategori B). Jika tenor melebihi 10 tahun, sisa tenor menggunakan asumsi floatingRateAssumption.",
    },
    {
      bankSlug: "btn",
      name: "BTN Platinum FR 1Y",
      defaultInterestRate: new Prisma.Decimal("9.000"),
      promoInterestRate: new Prisma.Decimal("4.500"),
      fixedPeriodMonths: 12,
      minTenorMonths: 96,
      floatingRateAssumption: new Prisma.Decimal("12.990"),
      adminFee: new Prisma.Decimal(500000),
      insuranceRate: new Prisma.Decimal("0.420"),
      provisiRate: new Prisma.Decimal("0.200"),
      notaryFeeEstimate: new Prisma.Decimal(7200000),
      sourceUrl:
        "https://www.btn.co.id/id/Individual/Kredit-Konsumer/Produk-Kredit/KPR-BTN-Platinum",
      sourceTitle: "BTN - KPR BTN Platinum",
      sourceCheckedAt,
      notes:
        "Mengacu tabel Promo Reguler (Fix Rate FR 1 Thn, min tenor 8 tahun) berlaku 1 Maret 2026 s.d. 30 Juni 2026. Setelah promo berakhir terdapat kenaikan berjenjang sebelum floating (GPM) dan/atau floating sesuai ketentuan BTN.",
    },
    {
      bankSlug: "btn",
      name: "BTN Platinum FR 3Y",
      defaultInterestRate: new Prisma.Decimal("10.000"),
      promoInterestRate: new Prisma.Decimal("6.250"),
      fixedPeriodMonths: 36,
      minTenorMonths: 144,
      floatingRateAssumption: new Prisma.Decimal("12.990"),
      adminFee: new Prisma.Decimal(500000),
      insuranceRate: new Prisma.Decimal("0.420"),
      provisiRate: new Prisma.Decimal("0.200"),
      notaryFeeEstimate: new Prisma.Decimal(7200000),
      sourceUrl:
        "https://www.btn.co.id/id/Individual/Kredit-Konsumer/Produk-Kredit/KPR-BTN-Platinum",
      sourceTitle: "BTN - KPR BTN Platinum",
      sourceCheckedAt,
      notes:
        "Mengacu tabel Promo Reguler (Fix Rate FR 3 Thn, min tenor 12 tahun) berlaku 1 Maret 2026 s.d. 30 Juni 2026. Setelah promo berakhir terdapat kenaikan berjenjang sebelum floating (GPM) dan/atau floating sesuai ketentuan BTN.",
    },
    {
      bankSlug: "btn",
      name: "BTN Platinum FR 5Y",
      defaultInterestRate: new Prisma.Decimal("10.250"),
      promoInterestRate: new Prisma.Decimal("7.500"),
      fixedPeriodMonths: 60,
      minTenorMonths: 180,
      floatingRateAssumption: new Prisma.Decimal("12.990"),
      adminFee: new Prisma.Decimal(500000),
      insuranceRate: new Prisma.Decimal("0.420"),
      provisiRate: new Prisma.Decimal("0.200"),
      notaryFeeEstimate: new Prisma.Decimal(7200000),
      sourceUrl:
        "https://www.btn.co.id/id/Individual/Kredit-Konsumer/Produk-Kredit/KPR-BTN-Platinum",
      sourceTitle: "BTN - KPR BTN Platinum",
      sourceCheckedAt,
      notes:
        "Mengacu tabel Promo Reguler (Fix Rate FR 5 Thn, min tenor 15 tahun) berlaku 1 Maret 2026 s.d. 30 Juni 2026. Setelah promo berakhir terdapat kenaikan berjenjang sebelum floating (GPM) dan/atau floating sesuai ketentuan BTN.",
    },
    {
      bankSlug: "btn",
      name: "BTN Platinum Fix n Cap 18Y (Promo Reguler)",
      minTenorMonths: 216,
      rateSchedule: [
        { months: 36, ratePercent: 6.5, kind: "fixed_cap" },
        { months: 36, ratePercent: 9.25, kind: "fixed_cap" },
        { months: 48, ratePercent: 12.0, kind: "fixed_cap" },
        { months: 96, ratePercent: 12.99, kind: "fixed_cap" },
      ],
      floatingRateAssumption: new Prisma.Decimal("12.990"),
      adminFee: new Prisma.Decimal(500000),
      insuranceRate: new Prisma.Decimal("0.420"),
      provisiRate: new Prisma.Decimal("0.200"),
      notaryFeeEstimate: new Prisma.Decimal(7200000),
      sourceUrl:
        "https://www.btn.co.id/id/Individual/Kredit-Konsumer/Produk-Kredit/KPR-BTN-Platinum",
      sourceTitle: "BTN - KPR BTN Platinum",
      sourceCheckedAt,
      notes:
        "Mengacu tabel Promo Reguler Fix n Cap (Thn 1-3, 4-6, 7-10, 11-18) berlaku 1 Maret 2026 s.d. 30 Juni 2026. Setelah masa Fix n Cap berakhir berlaku suku bunga floating sesuai ketentuan BTN.",
    },
    {
      bankSlug: "mandiri",
      name: "Mandiri KPR Fixed Berjenjang 10Y (min tenor 15Y)",
      minTenorMonths: 180,
      rateSchedule: [
        { months: 36, ratePercent: 3.96, kind: "fixed_step" },
        { months: 36, ratePercent: 8.66, kind: "fixed_step" },
        { months: 48, ratePercent: 9.66, kind: "fixed_step" },
      ],
      floatingRateAssumption: new Prisma.Decimal("11.500"),
      adminFee: new Prisma.Decimal(1750000),
      insuranceRate: new Prisma.Decimal("0.360"),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(8200000),
      sourceUrl: "https://www.bankmandiri.co.id/en/kpr-bunga-fixed-berjenjang",
      sourceTitle: "Mandiri KPR - Bunga Fixed Berjenjang 10 Tahun Spesial 2026",
      sourceCheckedAt,
      notes:
        "Mengacu tabel suku bunga fixed berjenjang 10 tahun spesial 2026 (berlaku s.d. pencairan 31 Maret 2026). Jika tenor > 10 tahun, sisa tenor menggunakan floatingRateAssumption sebagai asumsi simulasi.",
    },
    {
      bankSlug: "mandiri",
      name: "Mandiri KPR Fixed Berjenjang 10Y (min tenor 12Y)",
      minTenorMonths: 144,
      rateSchedule: [
        { months: 36, ratePercent: 4.86, kind: "fixed_step" },
        { months: 36, ratePercent: 8.86, kind: "fixed_step" },
        { months: 48, ratePercent: 9.86, kind: "fixed_step" },
      ],
      floatingRateAssumption: new Prisma.Decimal("11.500"),
      adminFee: new Prisma.Decimal(1750000),
      insuranceRate: new Prisma.Decimal("0.360"),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(8200000),
      sourceUrl: "https://www.bankmandiri.co.id/en/kpr-bunga-fixed-berjenjang",
      sourceTitle: "Mandiri KPR - Bunga Fixed Berjenjang 10 Tahun Spesial 2026",
      sourceCheckedAt,
      notes:
        "Mengacu tabel suku bunga fixed berjenjang 10 tahun spesial 2026 (berlaku s.d. pencairan 31 Maret 2026). Jika tenor > 10 tahun, sisa tenor menggunakan floatingRateAssumption sebagai asumsi simulasi.",
    },
    {
      bankSlug: "bsi-syariah",
      name: "BSI Griya (Single Pricing - Payroll)",
      shariaMargin: new Prisma.Decimal("8.500"),
      adminFee: new Prisma.Decimal(1250000),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(8000000),
      sourceUrl: "https://www.bankbsi.co.id/promo/bsi-griya-spesial-margin",
      sourceTitle: "BSI - Promo BSI Griya Spesial Margin",
      sourceCheckedAt,
      notes:
        "Mengacu tabel promo (single pricing payroll). Margin/ujrah mengikuti ketentuan produk pada saat akad; angka ini adalah pricing promo yang dipublikasikan.",
    },
    {
      bankSlug: "bsi-syariah",
      name: "BSI Griya (Single Pricing - Non Payroll)",
      shariaMargin: new Prisma.Decimal("8.750"),
      adminFee: new Prisma.Decimal(1250000),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(8000000),
      sourceUrl: "https://www.bankbsi.co.id/promo/bsi-griya-spesial-margin",
      sourceTitle: "BSI - Promo BSI Griya Spesial Margin",
      sourceCheckedAt,
      notes:
        "Mengacu tabel promo (single pricing non payroll). Margin/ujrah mengikuti ketentuan produk pada saat akad; angka ini adalah pricing promo yang dipublikasikan.",
    },
    {
      bankSlug: "bsi-syariah",
      name: "BSI Griya Step Up 1Y (Payroll, tenor 15Y)",
      minTenorMonths: 180,
      shariaMargin: new Prisma.Decimal("8.500"),
      rateSchedule: [
        { months: 12, ratePercent: 3.0, kind: "sharia_step" },
        { months: 168, ratePercent: 8.5, kind: "sharia_single" },
      ],
      adminFee: new Prisma.Decimal(1250000),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(8000000),
      sourceUrl: "https://www.bankbsi.co.id/promo/bsi-griya-spesial-margin",
      sourceTitle: "BSI - Promo BSI Griya Spesial Margin",
      sourceCheckedAt,
      notes:
        "Mengacu pricing step up payroll: 3.00% fix 1 tahun tenor 15 tahun. Setelah periode step up, simulasi memakai pricing single payroll sebagai asumsi.",
    },
    {
      bankSlug: "bsi-syariah",
      name: "BSI Griya Step Up 3Y (Payroll, tenor 15Y)",
      minTenorMonths: 180,
      shariaMargin: new Prisma.Decimal("8.500"),
      rateSchedule: [
        { months: 36, ratePercent: 4.3, kind: "sharia_step" },
        { months: 144, ratePercent: 8.5, kind: "sharia_single" },
      ],
      adminFee: new Prisma.Decimal(1250000),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(8000000),
      sourceUrl: "https://www.bankbsi.co.id/promo/bsi-griya-spesial-margin",
      sourceTitle: "BSI - Promo BSI Griya Spesial Margin",
      sourceCheckedAt,
      notes:
        "Mengacu pricing step up payroll: 4.30% fix 3 tahun tenor 15 tahun. Setelah periode step up, simulasi memakai pricing single payroll sebagai asumsi.",
    },
    {
      bankSlug: "bsi-syariah",
      name: "BSI Griya Step Up 2Y (Payroll, tenor 10Y)",
      minTenorMonths: 120,
      shariaMargin: new Prisma.Decimal("8.500"),
      rateSchedule: [
        { months: 24, ratePercent: 5.3, kind: "sharia_step" },
        { months: 96, ratePercent: 8.5, kind: "sharia_single" },
      ],
      adminFee: new Prisma.Decimal(1250000),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(8000000),
      sourceUrl: "https://www.bankbsi.co.id/promo/bsi-griya-spesial-margin",
      sourceTitle: "BSI - Promo BSI Griya Spesial Margin",
      sourceCheckedAt,
      notes:
        "Mengacu pricing step up payroll: 5.30% fix 2 tahun tenor 10 tahun. Setelah periode step up, simulasi memakai pricing single payroll sebagai asumsi.",
    },
    {
      bankSlug: "bsi-syariah",
      name: "BSI Griya Step Up 1Y (Non Payroll, tenor 15Y)",
      minTenorMonths: 180,
      shariaMargin: new Prisma.Decimal("8.750"),
      rateSchedule: [
        { months: 12, ratePercent: 3.1, kind: "sharia_step" },
        { months: 168, ratePercent: 8.75, kind: "sharia_single" },
      ],
      adminFee: new Prisma.Decimal(1250000),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(8000000),
      sourceUrl: "https://www.bankbsi.co.id/promo/bsi-griya-spesial-margin",
      sourceTitle: "BSI - Promo BSI Griya Spesial Margin",
      sourceCheckedAt,
      notes:
        "Mengacu pricing step up non payroll: 3.10% fix 1 tahun tenor 15 tahun. Setelah periode step up, simulasi memakai pricing single non payroll sebagai asumsi.",
    },
    {
      bankSlug: "bsi-syariah",
      name: "BSI Griya Step Up 3Y (Non Payroll, tenor 15Y)",
      minTenorMonths: 180,
      shariaMargin: new Prisma.Decimal("8.750"),
      rateSchedule: [
        { months: 36, ratePercent: 4.5, kind: "sharia_step" },
        { months: 144, ratePercent: 8.75, kind: "sharia_single" },
      ],
      adminFee: new Prisma.Decimal(1250000),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(8000000),
      sourceUrl: "https://www.bankbsi.co.id/promo/bsi-griya-spesial-margin",
      sourceTitle: "BSI - Promo BSI Griya Spesial Margin",
      sourceCheckedAt,
      notes:
        "Mengacu pricing step up non payroll: 4.50% fix 3 tahun tenor 15 tahun. Setelah periode step up, simulasi memakai pricing single non payroll sebagai asumsi.",
    },
    {
      bankSlug: "bsi-syariah",
      name: "BSI Griya Step Up 2Y (Non Payroll, tenor 10Y)",
      minTenorMonths: 120,
      shariaMargin: new Prisma.Decimal("8.750"),
      rateSchedule: [
        { months: 24, ratePercent: 5.3, kind: "sharia_step" },
        { months: 96, ratePercent: 8.75, kind: "sharia_single" },
      ],
      adminFee: new Prisma.Decimal(1250000),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(8000000),
      sourceUrl: "https://www.bankbsi.co.id/promo/bsi-griya-spesial-margin",
      sourceTitle: "BSI - Promo BSI Griya Spesial Margin",
      sourceCheckedAt,
      notes:
        "Mengacu pricing step up non payroll: 5.30% fix 2 tahun tenor 10 tahun. Setelah periode step up, simulasi memakai pricing single non payroll sebagai asumsi.",
    },
    {
      bankSlug: "panin-bank",
      name: "Panin KPR",
      defaultInterestRate: new Prisma.Decimal("8.850"),
      promoInterestRate: new Prisma.Decimal("7.350"),
      fixedPeriodMonths: 24,
      floatingRateAssumption: new Prisma.Decimal("11.650"),
      adminFee: new Prisma.Decimal(1250000),
      insuranceRate: new Prisma.Decimal("0.390"),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(7800000),
    },
    {
      bankSlug: "uob",
      name: "UOB Home Loan",
      defaultInterestRate: new Prisma.Decimal("8.700"),
      promoInterestRate: new Prisma.Decimal("7.200"),
      fixedPeriodMonths: 24,
      floatingRateAssumption: new Prisma.Decimal("11.400"),
      adminFee: new Prisma.Decimal(1500000),
      insuranceRate: new Prisma.Decimal("0.380"),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(8000000),
    },
    {
      bankSlug: "bca-syariah",
      name: "BCA Syariah KPR iB",
      shariaMargin: new Prisma.Decimal("9.250"),
      adminFee: new Prisma.Decimal(1250000),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(8000000),
    },
    {
      bankSlug: "kb-bukopin",
      name: "KB Bukopin KPR",
      defaultInterestRate: new Prisma.Decimal("9.150"),
      promoInterestRate: new Prisma.Decimal("7.650"),
      fixedPeriodMonths: 24,
      floatingRateAssumption: new Prisma.Decimal("11.900"),
      adminFee: new Prisma.Decimal(1000000),
      insuranceRate: new Prisma.Decimal("0.410"),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(7400000),
    },
    {
      bankSlug: "cimb-niaga",
      name: "CIMB Niaga KPR",
      defaultInterestRate: new Prisma.Decimal("8.950"),
      promoInterestRate: new Prisma.Decimal("7.450"),
      fixedPeriodMonths: 36,
      floatingRateAssumption: new Prisma.Decimal("11.700"),
      adminFee: new Prisma.Decimal(1250000),
      insuranceRate: new Prisma.Decimal("0.400"),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(7900000),
    },
    {
      bankSlug: "danamon",
      name: "Danamon KPR",
      defaultInterestRate: new Prisma.Decimal("8.900"),
      promoInterestRate: new Prisma.Decimal("7.400"),
      fixedPeriodMonths: 24,
      floatingRateAssumption: new Prisma.Decimal("11.650"),
      adminFee: new Prisma.Decimal(1100000),
      insuranceRate: new Prisma.Decimal("0.390"),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(7600000),
    },
    {
      bankSlug: "maybank",
      name: "Maybank KPR",
      defaultInterestRate: new Prisma.Decimal("8.800"),
      promoInterestRate: new Prisma.Decimal("7.300"),
      fixedPeriodMonths: 24,
      floatingRateAssumption: new Prisma.Decimal("11.550"),
      adminFee: new Prisma.Decimal(1200000),
      insuranceRate: new Prisma.Decimal("0.385"),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(7800000),
    },
    {
      bankSlug: "commonwealth-bank",
      name: "Commonwealth KPR",
      defaultInterestRate: new Prisma.Decimal("9.050"),
      promoInterestRate: new Prisma.Decimal("7.550"),
      fixedPeriodMonths: 24,
      floatingRateAssumption: new Prisma.Decimal("11.800"),
      adminFee: new Prisma.Decimal(1500000),
      insuranceRate: new Prisma.Decimal("0.410"),
      provisiRate: new Prisma.Decimal("1.000"),
      notaryFeeEstimate: new Prisma.Decimal(8200000),
    },
  ];

  for (const p of products) {
    const bank = bankBySlug.get(p.bankSlug);
    if (!bank) continue;

    await prisma.mortgageProduct.upsert({
      where: { bankId_slug: { bankId: bank.id, slug: slugify(p.name) } },
      update: {
        name: p.name,
        isActive: true,
        defaultInterestRate: "defaultInterestRate" in p ? (p.defaultInterestRate ?? null) : null,
        promoInterestRate: "promoInterestRate" in p ? (p.promoInterestRate ?? null) : null,
        fixedPeriodMonths: "fixedPeriodMonths" in p ? (p.fixedPeriodMonths ?? null) : null,
        minTenorMonths: "minTenorMonths" in p ? (p.minTenorMonths ?? null) : null,
        rateSchedule:
          "rateSchedule" in p ? (p.rateSchedule as Prisma.InputJsonValue) : Prisma.JsonNull,
        floatingRateAssumption:
          "floatingRateAssumption" in p ? (p.floatingRateAssumption ?? null) : null,
        shariaMargin: "shariaMargin" in p ? (p.shariaMargin ?? null) : null,
        adminFee: p.adminFee ?? null,
        insuranceRate: "insuranceRate" in p ? (p.insuranceRate ?? null) : null,
        provisiRate: p.provisiRate ?? null,
        notaryFeeEstimate: p.notaryFeeEstimate ?? null,
        sourceUrl: "sourceUrl" in p ? (p.sourceUrl ?? null) : null,
        sourceTitle: "sourceTitle" in p ? (p.sourceTitle ?? null) : null,
        sourceCheckedAt: "sourceCheckedAt" in p ? (p.sourceCheckedAt ?? null) : null,
        notes: "notes" in p ? (p.notes ?? null) : null,
      },
      create: {
        bankId: bank.id,
        name: p.name,
        slug: slugify(p.name),
        isActive: true,
        defaultInterestRate: "defaultInterestRate" in p ? (p.defaultInterestRate ?? null) : null,
        promoInterestRate: "promoInterestRate" in p ? (p.promoInterestRate ?? null) : null,
        fixedPeriodMonths: "fixedPeriodMonths" in p ? (p.fixedPeriodMonths ?? null) : null,
        minTenorMonths: "minTenorMonths" in p ? (p.minTenorMonths ?? null) : null,
        rateSchedule:
          "rateSchedule" in p ? (p.rateSchedule as Prisma.InputJsonValue) : Prisma.JsonNull,
        floatingRateAssumption:
          "floatingRateAssumption" in p ? (p.floatingRateAssumption ?? null) : null,
        shariaMargin: "shariaMargin" in p ? (p.shariaMargin ?? null) : null,
        adminFee: p.adminFee ?? null,
        insuranceRate: "insuranceRate" in p ? (p.insuranceRate ?? null) : null,
        provisiRate: p.provisiRate ?? null,
        notaryFeeEstimate: p.notaryFeeEstimate ?? null,
        sourceUrl: "sourceUrl" in p ? (p.sourceUrl ?? null) : null,
        sourceTitle: "sourceTitle" in p ? (p.sourceTitle ?? null) : null,
        sourceCheckedAt: "sourceCheckedAt" in p ? (p.sourceCheckedAt ?? null) : null,
        notes: "notes" in p ? (p.notes ?? null) : null,
      },
    });
  }

  const developerA = await prisma.developer.upsert({
    where: { slug: "nusantara-properti" },
    update: {
      name: "Nusantara Properti",
      profileTemplate: "skyline",
      verificationStatus: "approved",
      city: "Jakarta Selatan",
      province: "DKI Jakarta",
      contactPersonName: "Dimas Pratama",
      contactPersonEmail: "dimas@nusantaraproperti.co.id",
      contactPersonPhone: "081234567890",
    },
    create: {
      name: "Nusantara Properti",
      slug: "nusantara-properti",
      profileTemplate: "skyline",
      description:
        "Developer premium dengan fokus pada hunian modern yang terintegrasi Smart Living dan standar kualitas tinggi.",
      website: "https://nusantaraproperti.co.id",
      email: "info@nusantaraproperti.co.id",
      phone: "021-5551234",
      address: "Jl. Sudirman No. 10, Jakarta Selatan",
      city: "Jakarta Selatan",
      province: "DKI Jakarta",
      contactPersonName: "Dimas Pratama",
      contactPersonEmail: "dimas@nusantaraproperti.co.id",
      contactPersonPhone: "081234567890",
      verificationStatus: "approved",
    },
  });

  const developerB = await prisma.developer.upsert({
    where: { slug: "bali-smart-living" },
    update: {
      name: "Bali Smart Living",
      profileTemplate: "aurora",
      verificationStatus: "approved",
      city: "Badung",
      province: "Bali",
      contactPersonName: "Ayu Lestari",
      contactPersonEmail: "ayu@balismartliving.id",
      contactPersonPhone: "082345678901",
    },
    create: {
      name: "Bali Smart Living",
      slug: "bali-smart-living",
      profileTemplate: "aurora",
      description: "Pengembang hunian resort dengan Smart Home untuk gaya hidup modern di Bali.",
      website: "https://balismartliving.id",
      email: "hello@balismartliving.id",
      phone: "0361-777888",
      address: "Jl. Raya Canggu No. 2, Badung",
      city: "Badung",
      province: "Bali",
      contactPersonName: "Ayu Lestari",
      contactPersonEmail: "ayu@balismartliving.id",
      contactPersonPhone: "082345678901",
      verificationStatus: "approved",
    },
  });

  const projectA = await prisma.project.upsert({
    where: { slug: "livinova-residence-sudirman" },
    update: {
      name: "Livinova Residence Sudirman",
      developerId: developerA.id,
      status: "ready_stock",
      smartReadiness: "integrated",
      verificationStatus: "approved",
      startingPrice: new Prisma.Decimal(1250000000),
    },
    create: {
      name: "Livinova Residence Sudirman",
      slug: "livinova-residence-sudirman",
      developerId: developerA.id,
      description:
        "Hunian modern di pusat kota dengan integrasi Smart Living dan sistem keamanan terverifikasi.",
      status: "ready_stock",
      smartReadiness: "integrated",
      verificationStatus: "approved",
      startingPrice: new Prisma.Decimal(1250000000),
      location: {
        create: {
          address: "Jl. Jend. Sudirman, Jakarta Selatan",
          city: "Jakarta Selatan",
          area: "Sudirman",
          province: "DKI Jakarta",
          postalCode: "12190",
          latitude: -6.225,
          longitude: 106.808,
        },
      },
    },
  });

  const projectB = await prisma.project.upsert({
    where: { slug: "canggu-smart-villas" },
    update: {
      name: "Canggu Smart Villas",
      developerId: developerB.id,
      status: "under_development",
      smartReadiness: "partial",
      verificationStatus: "approved",
      startingPrice: new Prisma.Decimal(2750000000),
    },
    create: {
      name: "Canggu Smart Villas",
      slug: "canggu-smart-villas",
      developerId: developerB.id,
      description:
        "Villa resort dengan Smart Living, cocok untuk investasi dan tinggal jangka panjang.",
      status: "under_development",
      smartReadiness: "partial",
      verificationStatus: "approved",
      startingPrice: new Prisma.Decimal(2750000000),
      location: {
        create: {
          address: "Canggu, Badung",
          city: "Badung",
          area: "Canggu",
          province: "Bali",
          postalCode: "80361",
          latitude: -8.647,
          longitude: 115.138,
        },
      },
    },
  });

  const unitA = await prisma.propertyUnit.upsert({
    where: { projectId_slug: { projectId: projectA.id, slug: "tipe-a" } },
    update: {
      title: "Tipe A",
      propertyType: "rumah",
      bedrooms: 3,
      bathrooms: 2,
      buildingSize: 110,
      landSize: 90,
      startingPrice: new Prisma.Decimal(1250000000),
      price: new Prisma.Decimal(1350000000),
      availableUnits: 5,
    },
    create: {
      projectId: projectA.id,
      title: "Tipe A",
      slug: "tipe-a",
      propertyType: "rumah",
      bedrooms: 3,
      bathrooms: 2,
      buildingSize: 110,
      landSize: 90,
      startingPrice: new Prisma.Decimal(1250000000),
      price: new Prisma.Decimal(1350000000),
      availableUnits: 5,
    },
  });

  const unitB = await prisma.propertyUnit.upsert({
    where: { projectId_slug: { projectId: projectB.id, slug: "villa-2br" } },
    update: {
      title: "Villa 2BR",
      propertyType: "villa",
      bedrooms: 2,
      bathrooms: 2,
      buildingSize: 140,
      landSize: 200,
      startingPrice: new Prisma.Decimal(2750000000),
      price: new Prisma.Decimal(3200000000),
      availableUnits: 3,
    },
    create: {
      projectId: projectB.id,
      title: "Villa 2BR",
      slug: "villa-2br",
      propertyType: "villa",
      bedrooms: 2,
      bathrooms: 2,
      buildingSize: 140,
      landSize: 200,
      startingPrice: new Prisma.Decimal(2750000000),
      price: new Prisma.Decimal(3200000000),
      availableUnits: 3,
    },
  });

  const listingA = await prisma.propertyListing.upsert({
    where: { slug: "livinova-residence-tipe-a" },
    update: {
      projectId: projectA.id,
      unitId: unitA.id,
      title: "Livinova Residence — Tipe A",
      status: "published",
      verificationStatus: "approved",
      featured: true,
      price: unitA.price,
      startingPrice: unitA.startingPrice,
      description:
        "Rumah modern 3 kamar di Sudirman dengan Smart Lock, CCTV terintegrasi, dan Smart Lighting. Lokasi strategis, siap huni.",
      specs: {
        parking: 1,
        electricity: 2200,
        floors: 2,
        certificate: "SHM",
      },
      smartHomeDetails: {
        hub: "Livinova Smart Hub",
        warrantyMonths: 24,
      },
    },
    create: {
      projectId: projectA.id,
      unitId: unitA.id,
      title: "Livinova Residence — Tipe A",
      slug: "livinova-residence-tipe-a",
      status: "published",
      verificationStatus: "approved",
      featured: true,
      price: unitA.price,
      startingPrice: unitA.startingPrice,
      description:
        "Rumah modern 3 kamar di Sudirman dengan Smart Lock, CCTV terintegrasi, dan Smart Lighting. Lokasi strategis, siap huni.",
      specs: {
        parking: 1,
        electricity: 2200,
        floors: 2,
        certificate: "SHM",
      },
      smartHomeDetails: {
        hub: "Livinova Smart Hub",
        warrantyMonths: 24,
      },
    },
  });

  const listingB = await prisma.propertyListing.upsert({
    where: { slug: "canggu-smart-villas-2br" },
    update: {
      projectId: projectB.id,
      unitId: unitB.id,
      title: "Canggu Smart Villas — Villa 2BR",
      status: "published",
      verificationStatus: "approved",
      featured: true,
      sponsored: true,
      price: unitB.price,
      startingPrice: unitB.startingPrice,
      description:
        "Villa 2 kamar di Canggu untuk investasi dengan Smart AC Control dan monitoring energi. Lingkungan premium, dekat pusat lifestyle.",
      specs: {
        pool: true,
        parking: 1,
        floors: 2,
        certificate: "HGB",
      },
      smartHomeDetails: {
        hub: "Smart Villa Controller",
        warrantyMonths: 12,
      },
    },
    create: {
      projectId: projectB.id,
      unitId: unitB.id,
      title: "Canggu Smart Villas — Villa 2BR",
      slug: "canggu-smart-villas-2br",
      status: "published",
      verificationStatus: "approved",
      featured: true,
      sponsored: true,
      price: unitB.price,
      startingPrice: unitB.startingPrice,
      description:
        "Villa 2 kamar di Canggu untuk investasi dengan Smart AC Control dan monitoring energi. Lingkungan premium, dekat pusat lifestyle.",
      specs: {
        pool: true,
        parking: 1,
        floors: 2,
        certificate: "HGB",
      },
      smartHomeDetails: {
        hub: "Smart Villa Controller",
        warrantyMonths: 12,
      },
    },
  });

  const listingPending = await prisma.propertyListing.upsert({
    where: { slug: "livinova-residence-tipe-a-pending" },
    update: {
      projectId: projectA.id,
      unitId: unitA.id,
      title: "Livinova Residence — Tipe A (Pengajuan)",
      slug: "livinova-residence-tipe-a-pending",
      status: "pending",
      verificationStatus: "pending",
      featured: false,
      sponsored: false,
      recommended: false,
      price: unitA.price,
      startingPrice: unitA.startingPrice,
      description: "Listing demo untuk menguji alur verifikasi admin dan verifier.",
      specs: {
        floors: 2,
        certificate: "SHM",
      },
    },
    create: {
      projectId: projectA.id,
      unitId: unitA.id,
      title: "Livinova Residence — Tipe A (Pengajuan)",
      slug: "livinova-residence-tipe-a-pending",
      status: "pending",
      verificationStatus: "pending",
      featured: false,
      sponsored: false,
      recommended: false,
      price: unitA.price,
      startingPrice: unitA.startingPrice,
      description: "Listing demo untuk menguji alur verifikasi admin dan verifier.",
      specs: {
        floors: 2,
        certificate: "SHM",
      },
    },
  });

  const developerC = await prisma.developer.upsert({
    where: { slug: "jogja-smart-habitat" },
    update: {
      name: "Jogja Smart Habitat",
      verificationStatus: "approved",
      city: "Sleman",
      province: "DI Yogyakarta",
      contactPersonName: "Rangga Wibowo",
      contactPersonEmail: "rangga@jogjasmarthabitat.id",
      contactPersonPhone: "081377788899",
    },
    create: {
      name: "Jogja Smart Habitat",
      slug: "jogja-smart-habitat",
      description:
        "Developer hunian modern di Yogyakarta dengan konsep Smart Living dan lingkungan ramah keluarga.",
      website: "https://jogjasmarthabitat.id",
      email: "hello@jogjasmarthabitat.id",
      phone: "0274-555888",
      address: "Jl. Ringroad Utara No. 12, Sleman",
      city: "Sleman",
      province: "DI Yogyakarta",
      contactPersonName: "Rangga Wibowo",
      contactPersonEmail: "rangga@jogjasmarthabitat.id",
      contactPersonPhone: "081377788899",
      verificationStatus: "approved",
    },
  });

  const developerD = await prisma.developer.upsert({
    where: { slug: "java-smart-estates" },
    update: {
      name: "Java Smart Estates",
      verificationStatus: "approved",
      city: "Semarang",
      province: "Jawa Tengah",
      contactPersonName: "Nadia Putri",
      contactPersonEmail: "nadia@javasmartestates.id",
      contactPersonPhone: "081299900111",
    },
    create: {
      name: "Java Smart Estates",
      slug: "java-smart-estates",
      description:
        "Pengembang kawasan perumahan modern dengan konsep Smart Living dan fasilitas komunitas.",
      website: "https://javasmartestates.id",
      email: "info@javasmartestates.id",
      phone: "024-777111",
      address: "Jl. Setiabudi No. 88, Semarang",
      city: "Semarang",
      province: "Jawa Tengah",
      contactPersonName: "Nadia Putri",
      contactPersonEmail: "nadia@javasmartestates.id",
      contactPersonPhone: "081299900111",
      verificationStatus: "approved",
    },
  });

  const projectC1 = await prisma.project.upsert({
    where: { slug: "sleman-smart-garden" },
    update: {
      name: "Sleman Smart Garden",
      developerId: developerC.id,
      status: "under_development",
      smartReadiness: "partial",
      verificationStatus: "approved",
      startingPrice: new Prisma.Decimal(920000000),
    },
    create: {
      name: "Sleman Smart Garden",
      slug: "sleman-smart-garden",
      developerId: developerC.id,
      description:
        "Cluster modern dengan integrasi Smart Living dan akses cepat ke pusat kota Yogyakarta.",
      status: "under_development",
      smartReadiness: "partial",
      verificationStatus: "approved",
      startingPrice: new Prisma.Decimal(920000000),
      location: {
        create: {
          address: "Jl. Magelang KM 6, Sleman",
          city: "Sleman",
          area: "Mlati",
          province: "DI Yogyakarta",
          postalCode: "55284",
          latitude: -7.7519,
          longitude: 110.3552,
        },
      },
    },
  });

  const projectC2 = await prisma.project.upsert({
    where: { slug: "bantul-smart-village" },
    update: {
      name: "Bantul Smart Village",
      developerId: developerC.id,
      status: "pre_launch",
      smartReadiness: "planned",
      verificationStatus: "approved",
      startingPrice: new Prisma.Decimal(690000000),
    },
    create: {
      name: "Bantul Smart Village",
      slug: "bantul-smart-village",
      developerId: developerC.id,
      description: "Perumahan keluarga dengan konsep Smart Ready dan ruang hijau yang luas.",
      status: "pre_launch",
      smartReadiness: "planned",
      verificationStatus: "approved",
      startingPrice: new Prisma.Decimal(690000000),
      location: {
        create: {
          address: "Kasihan, Bantul",
          city: "Bantul",
          area: "Kasihan",
          province: "DI Yogyakarta",
          postalCode: "55184",
          latitude: -7.8256,
          longitude: 110.3329,
        },
      },
    },
  });

  const projectA2 = await prisma.project.upsert({
    where: { slug: "bintaro-smart-terrace" },
    update: {
      name: "Bintaro Smart Terrace",
      developerId: developerA.id,
      status: "ready_stock",
      smartReadiness: "integrated",
      verificationStatus: "approved",
      startingPrice: new Prisma.Decimal(1550000000),
    },
    create: {
      name: "Bintaro Smart Terrace",
      slug: "bintaro-smart-terrace",
      developerId: developerA.id,
      description:
        "Townhouse premium dengan Smart Living terintegrasi, dekat akses tol dan pusat bisnis.",
      status: "ready_stock",
      smartReadiness: "integrated",
      verificationStatus: "approved",
      startingPrice: new Prisma.Decimal(1550000000),
      location: {
        create: {
          address: "Bintaro, Tangerang Selatan",
          city: "Tangerang Selatan",
          area: "Bintaro",
          province: "Banten",
          postalCode: "15221",
          latitude: -6.2809,
          longitude: 106.7135,
        },
      },
    },
  });

  const projectA3 = await prisma.project.upsert({
    where: { slug: "depok-tech-townhouse" },
    update: {
      name: "Depok Tech Townhouse",
      developerId: developerA.id,
      status: "under_development",
      smartReadiness: "partial",
      verificationStatus: "approved",
      startingPrice: new Prisma.Decimal(1125000000),
    },
    create: {
      name: "Depok Tech Townhouse",
      slug: "depok-tech-townhouse",
      developerId: developerA.id,
      description:
        "Hunian modern dekat kampus dan akses KRL dengan fitur Smart Security dan monitoring energi.",
      status: "under_development",
      smartReadiness: "partial",
      verificationStatus: "approved",
      startingPrice: new Prisma.Decimal(1125000000),
      location: {
        create: {
          address: "Beji, Depok",
          city: "Depok",
          area: "Beji",
          province: "Jawa Barat",
          postalCode: "16425",
          latitude: -6.3673,
          longitude: 106.8294,
        },
      },
    },
  });

  const projectB2 = await prisma.project.upsert({
    where: { slug: "sanur-smart-lofts" },
    update: {
      name: "Sanur Smart Lofts",
      developerId: developerB.id,
      status: "ready_stock",
      smartReadiness: "integrated",
      verificationStatus: "approved",
      startingPrice: new Prisma.Decimal(1450000000),
    },
    create: {
      name: "Sanur Smart Lofts",
      slug: "sanur-smart-lofts",
      developerId: developerB.id,
      description: "Loft modern dekat pantai dengan Smart Access dan sistem keamanan terintegrasi.",
      status: "ready_stock",
      smartReadiness: "integrated",
      verificationStatus: "approved",
      startingPrice: new Prisma.Decimal(1450000000),
      location: {
        create: {
          address: "Sanur, Denpasar",
          city: "Denpasar",
          area: "Sanur",
          province: "Bali",
          postalCode: "80228",
          latitude: -8.6939,
          longitude: 115.2632,
        },
      },
    },
  });

  const projectB3 = await prisma.project.upsert({
    where: { slug: "ubud-eco-smart-villa" },
    update: {
      name: "Ubud Eco Smart Villa",
      developerId: developerB.id,
      status: "under_development",
      smartReadiness: "partial",
      verificationStatus: "approved",
      startingPrice: new Prisma.Decimal(3850000000),
    },
    create: {
      name: "Ubud Eco Smart Villa",
      slug: "ubud-eco-smart-villa",
      developerId: developerB.id,
      description:
        "Villa eco-luxury dengan Smart Living dan monitoring energi untuk pengalaman tinggal yang tenang.",
      status: "under_development",
      smartReadiness: "partial",
      verificationStatus: "approved",
      startingPrice: new Prisma.Decimal(3850000000),
      location: {
        create: {
          address: "Ubud, Gianyar",
          city: "Gianyar",
          area: "Ubud",
          province: "Bali",
          postalCode: "80571",
          latitude: -8.5069,
          longitude: 115.2625,
        },
      },
    },
  });

  const projectD1 = await prisma.project.upsert({
    where: { slug: "semarang-smart-hills" },
    update: {
      name: "Semarang Smart Hills",
      developerId: developerD.id,
      status: "under_development",
      smartReadiness: "planned",
      verificationStatus: "approved",
      startingPrice: new Prisma.Decimal(845000000),
    },
    create: {
      name: "Semarang Smart Hills",
      slug: "semarang-smart-hills",
      developerId: developerD.id,
      description: "Kawasan hunian modern dengan konsep Smart Ready dan pemandangan perbukitan.",
      status: "under_development",
      smartReadiness: "planned",
      verificationStatus: "approved",
      startingPrice: new Prisma.Decimal(845000000),
      location: {
        create: {
          address: "Tembalang, Semarang",
          city: "Semarang",
          area: "Tembalang",
          province: "Jawa Tengah",
          postalCode: "50275",
          latitude: -7.0512,
          longitude: 110.4409,
        },
      },
    },
  });

  const unitC1 = await prisma.propertyUnit.upsert({
    where: { projectId_slug: { projectId: projectC1.id, slug: "tipe-72" } },
    update: {
      title: "Tipe 72",
      propertyType: "rumah",
      bedrooms: 3,
      bathrooms: 2,
      buildingSize: 72,
      landSize: 105,
      startingPrice: new Prisma.Decimal(920000000),
      price: new Prisma.Decimal(980000000),
      availableUnits: 12,
    },
    create: {
      projectId: projectC1.id,
      title: "Tipe 72",
      slug: "tipe-72",
      propertyType: "rumah",
      bedrooms: 3,
      bathrooms: 2,
      buildingSize: 72,
      landSize: 105,
      startingPrice: new Prisma.Decimal(920000000),
      price: new Prisma.Decimal(980000000),
      availableUnits: 12,
    },
  });

  const unitC2 = await prisma.propertyUnit.upsert({
    where: { projectId_slug: { projectId: projectC2.id, slug: "tipe-60" } },
    update: {
      title: "Tipe 60",
      propertyType: "rumah",
      bedrooms: 2,
      bathrooms: 1,
      buildingSize: 60,
      landSize: 96,
      startingPrice: new Prisma.Decimal(690000000),
      price: new Prisma.Decimal(750000000),
      availableUnits: 18,
    },
    create: {
      projectId: projectC2.id,
      title: "Tipe 60",
      slug: "tipe-60",
      propertyType: "rumah",
      bedrooms: 2,
      bathrooms: 1,
      buildingSize: 60,
      landSize: 96,
      startingPrice: new Prisma.Decimal(690000000),
      price: new Prisma.Decimal(750000000),
      availableUnits: 18,
    },
  });

  const unitA2 = await prisma.propertyUnit.upsert({
    where: { projectId_slug: { projectId: projectA2.id, slug: "tipe-90" } },
    update: {
      title: "Tipe 90",
      propertyType: "rumah",
      bedrooms: 3,
      bathrooms: 3,
      buildingSize: 90,
      landSize: 96,
      startingPrice: new Prisma.Decimal(1550000000),
      price: new Prisma.Decimal(1685000000),
      availableUnits: 6,
    },
    create: {
      projectId: projectA2.id,
      title: "Tipe 90",
      slug: "tipe-90",
      propertyType: "rumah",
      bedrooms: 3,
      bathrooms: 3,
      buildingSize: 90,
      landSize: 96,
      startingPrice: new Prisma.Decimal(1550000000),
      price: new Prisma.Decimal(1685000000),
      availableUnits: 6,
    },
  });

  const unitA3 = await prisma.propertyUnit.upsert({
    where: { projectId_slug: { projectId: projectA3.id, slug: "tipe-84" } },
    update: {
      title: "Tipe 84",
      propertyType: "rumah",
      bedrooms: 3,
      bathrooms: 2,
      buildingSize: 84,
      landSize: 102,
      startingPrice: new Prisma.Decimal(1125000000),
      price: new Prisma.Decimal(1225000000),
      availableUnits: 10,
    },
    create: {
      projectId: projectA3.id,
      title: "Tipe 84",
      slug: "tipe-84",
      propertyType: "rumah",
      bedrooms: 3,
      bathrooms: 2,
      buildingSize: 84,
      landSize: 102,
      startingPrice: new Prisma.Decimal(1125000000),
      price: new Prisma.Decimal(1225000000),
      availableUnits: 10,
    },
  });

  const unitB2 = await prisma.propertyUnit.upsert({
    where: { projectId_slug: { projectId: projectB2.id, slug: "loft-1br" } },
    update: {
      title: "Loft 1BR",
      propertyType: "apartemen",
      bedrooms: 1,
      bathrooms: 1,
      buildingSize: 48,
      landSize: null,
      startingPrice: new Prisma.Decimal(1450000000),
      price: new Prisma.Decimal(1590000000),
      availableUnits: 14,
    },
    create: {
      projectId: projectB2.id,
      title: "Loft 1BR",
      slug: "loft-1br",
      propertyType: "apartemen",
      bedrooms: 1,
      bathrooms: 1,
      buildingSize: 48,
      landSize: null,
      startingPrice: new Prisma.Decimal(1450000000),
      price: new Prisma.Decimal(1590000000),
      availableUnits: 14,
    },
  });

  const unitB3 = await prisma.propertyUnit.upsert({
    where: { projectId_slug: { projectId: projectB3.id, slug: "villa-3br" } },
    update: {
      title: "Villa 3BR",
      propertyType: "villa",
      bedrooms: 3,
      bathrooms: 3,
      buildingSize: 180,
      landSize: 240,
      startingPrice: new Prisma.Decimal(3850000000),
      price: new Prisma.Decimal(4250000000),
      availableUnits: 4,
    },
    create: {
      projectId: projectB3.id,
      title: "Villa 3BR",
      slug: "villa-3br",
      propertyType: "villa",
      bedrooms: 3,
      bathrooms: 3,
      buildingSize: 180,
      landSize: 240,
      startingPrice: new Prisma.Decimal(3850000000),
      price: new Prisma.Decimal(4250000000),
      availableUnits: 4,
    },
  });

  const unitD1 = await prisma.propertyUnit.upsert({
    where: { projectId_slug: { projectId: projectD1.id, slug: "tipe-70" } },
    update: {
      title: "Tipe 70",
      propertyType: "rumah",
      bedrooms: 3,
      bathrooms: 2,
      buildingSize: 70,
      landSize: 100,
      startingPrice: new Prisma.Decimal(845000000),
      price: new Prisma.Decimal(920000000),
      availableUnits: 16,
    },
    create: {
      projectId: projectD1.id,
      title: "Tipe 70",
      slug: "tipe-70",
      propertyType: "rumah",
      bedrooms: 3,
      bathrooms: 2,
      buildingSize: 70,
      landSize: 100,
      startingPrice: new Prisma.Decimal(845000000),
      price: new Prisma.Decimal(920000000),
      availableUnits: 16,
    },
  });

  const listingC1 = await prisma.propertyListing.upsert({
    where: { slug: "sleman-smart-garden-tipe-72" },
    update: {
      projectId: projectC1.id,
      unitId: unitC1.id,
      title: "Sleman Smart Garden — Tipe 72",
      status: "published",
      verificationStatus: "approved",
      featured: true,
      price: unitC1.price,
      startingPrice: unitC1.startingPrice,
      description:
        "Rumah keluarga 3 kamar di Sleman dengan Smart Lighting, CCTV terintegrasi, dan monitoring energi. Akses cepat ke Ring Road & pusat kota.",
      specs: { parking: 1, electricity: 2200, floors: 2, certificate: "SHM" },
      smartHomeDetails: { hub: "Livinova Smart Hub", warrantyMonths: 24 },
    },
    create: {
      projectId: projectC1.id,
      unitId: unitC1.id,
      title: "Sleman Smart Garden — Tipe 72",
      slug: "sleman-smart-garden-tipe-72",
      status: "published",
      verificationStatus: "approved",
      featured: true,
      price: unitC1.price,
      startingPrice: unitC1.startingPrice,
      description:
        "Rumah keluarga 3 kamar di Sleman dengan Smart Lighting, CCTV terintegrasi, dan monitoring energi. Akses cepat ke Ring Road & pusat kota.",
      specs: { parking: 1, electricity: 2200, floors: 2, certificate: "SHM" },
      smartHomeDetails: { hub: "Livinova Smart Hub", warrantyMonths: 24 },
    },
  });

  const listingC2 = await prisma.propertyListing.upsert({
    where: { slug: "bantul-smart-village-tipe-60" },
    update: {
      projectId: projectC2.id,
      unitId: unitC2.id,
      title: "Bantul Smart Village — Tipe 60",
      status: "published",
      verificationStatus: "approved",
      featured: true,
      price: unitC2.price,
      startingPrice: unitC2.startingPrice,
      description:
        "Rumah 2 kamar dengan konsep Smart Ready di Bantul. Tata ruang efisien, dekat fasilitas pendidikan, dan lingkungan hijau.",
      specs: { parking: 1, electricity: 1300, floors: 1, certificate: "SHM" },
      smartHomeDetails: { hub: "Smart Ready Pack", warrantyMonths: 12 },
    },
    create: {
      projectId: projectC2.id,
      unitId: unitC2.id,
      title: "Bantul Smart Village — Tipe 60",
      slug: "bantul-smart-village-tipe-60",
      status: "published",
      verificationStatus: "approved",
      featured: true,
      price: unitC2.price,
      startingPrice: unitC2.startingPrice,
      description:
        "Rumah 2 kamar dengan konsep Smart Ready di Bantul. Tata ruang efisien, dekat fasilitas pendidikan, dan lingkungan hijau.",
      specs: { parking: 1, electricity: 1300, floors: 1, certificate: "SHM" },
      smartHomeDetails: { hub: "Smart Ready Pack", warrantyMonths: 12 },
    },
  });

  const listingA2 = await prisma.propertyListing.upsert({
    where: { slug: "bintaro-smart-terrace-tipe-90" },
    update: {
      projectId: projectA2.id,
      unitId: unitA2.id,
      title: "Bintaro Smart Terrace — Tipe 90",
      status: "published",
      verificationStatus: "approved",
      featured: true,
      price: unitA2.price,
      startingPrice: unitA2.startingPrice,
      description:
        "Townhouse premium 3 lantai di Bintaro dengan Smart Lock, CCTV terintegrasi, dan Smart Lighting. Dekat akses tol dan pusat bisnis.",
      specs: { parking: 2, electricity: 3500, floors: 3, certificate: "HGB" },
      smartHomeDetails: { hub: "Livinova Smart Hub", warrantyMonths: 24 },
    },
    create: {
      projectId: projectA2.id,
      unitId: unitA2.id,
      title: "Bintaro Smart Terrace — Tipe 90",
      slug: "bintaro-smart-terrace-tipe-90",
      status: "published",
      verificationStatus: "approved",
      featured: true,
      price: unitA2.price,
      startingPrice: unitA2.startingPrice,
      description:
        "Townhouse premium 3 lantai di Bintaro dengan Smart Lock, CCTV terintegrasi, dan Smart Lighting. Dekat akses tol dan pusat bisnis.",
      specs: { parking: 2, electricity: 3500, floors: 3, certificate: "HGB" },
      smartHomeDetails: { hub: "Livinova Smart Hub", warrantyMonths: 24 },
    },
  });

  const listingA3 = await prisma.propertyListing.upsert({
    where: { slug: "depok-tech-townhouse-tipe-84" },
    update: {
      projectId: projectA3.id,
      unitId: unitA3.id,
      title: "Depok Tech Townhouse — Tipe 84",
      status: "published",
      verificationStatus: "approved",
      featured: true,
      price: unitA3.price,
      startingPrice: unitA3.startingPrice,
      description:
        "Hunian modern 3 kamar di Depok dengan Smart Security, monitoring energi, dan akses cepat ke KRL. Cocok untuk keluarga muda.",
      specs: { parking: 1, electricity: 2200, floors: 2, certificate: "SHM" },
      smartHomeDetails: { hub: "Smart Home Controller", warrantyMonths: 18 },
    },
    create: {
      projectId: projectA3.id,
      unitId: unitA3.id,
      title: "Depok Tech Townhouse — Tipe 84",
      slug: "depok-tech-townhouse-tipe-84",
      status: "published",
      verificationStatus: "approved",
      featured: true,
      price: unitA3.price,
      startingPrice: unitA3.startingPrice,
      description:
        "Hunian modern 3 kamar di Depok dengan Smart Security, monitoring energi, dan akses cepat ke KRL. Cocok untuk keluarga muda.",
      specs: { parking: 1, electricity: 2200, floors: 2, certificate: "SHM" },
      smartHomeDetails: { hub: "Smart Home Controller", warrantyMonths: 18 },
    },
  });

  const listingB2 = await prisma.propertyListing.upsert({
    where: { slug: "sanur-smart-lofts-loft-1br" },
    update: {
      projectId: projectB2.id,
      unitId: unitB2.id,
      title: "Sanur Smart Lofts — Loft 1BR",
      status: "published",
      verificationStatus: "approved",
      featured: true,
      price: unitB2.price,
      startingPrice: unitB2.startingPrice,
      description:
        "Loft 1BR modern dekat pantai dengan Smart Lock, CCTV terintegrasi, dan Smart Lighting. Cocok untuk tinggal atau investasi.",
      specs: { parking: 1, electricity: 2200, floors: 1, certificate: "HGB" },
      smartHomeDetails: { hub: "Smart Loft Controller", warrantyMonths: 12 },
    },
    create: {
      projectId: projectB2.id,
      unitId: unitB2.id,
      title: "Sanur Smart Lofts — Loft 1BR",
      slug: "sanur-smart-lofts-loft-1br",
      status: "published",
      verificationStatus: "approved",
      featured: true,
      price: unitB2.price,
      startingPrice: unitB2.startingPrice,
      description:
        "Loft 1BR modern dekat pantai dengan Smart Lock, CCTV terintegrasi, dan Smart Lighting. Cocok untuk tinggal atau investasi.",
      specs: { parking: 1, electricity: 2200, floors: 1, certificate: "HGB" },
      smartHomeDetails: { hub: "Smart Loft Controller", warrantyMonths: 12 },
    },
  });

  const listingB3 = await prisma.propertyListing.upsert({
    where: { slug: "ubud-eco-smart-villa-villa-3br" },
    update: {
      projectId: projectB3.id,
      unitId: unitB3.id,
      title: "Ubud Eco Smart Villa — Villa 3BR",
      status: "published",
      verificationStatus: "approved",
      featured: true,
      price: unitB3.price,
      startingPrice: unitB3.startingPrice,
      description:
        "Villa 3 kamar di Ubud dengan monitoring energi, Smart AC Control, dan sensor keamanan. Suasana tenang, cocok untuk investasi premium.",
      specs: { pool: true, parking: 2, electricity: 5500, floors: 2, certificate: "HGB" },
      smartHomeDetails: { hub: "Smart Villa Controller", warrantyMonths: 12 },
    },
    create: {
      projectId: projectB3.id,
      unitId: unitB3.id,
      title: "Ubud Eco Smart Villa — Villa 3BR",
      slug: "ubud-eco-smart-villa-villa-3br",
      status: "published",
      verificationStatus: "approved",
      featured: true,
      price: unitB3.price,
      startingPrice: unitB3.startingPrice,
      description:
        "Villa 3 kamar di Ubud dengan monitoring energi, Smart AC Control, dan sensor keamanan. Suasana tenang, cocok untuk investasi premium.",
      specs: { pool: true, parking: 2, electricity: 5500, floors: 2, certificate: "HGB" },
      smartHomeDetails: { hub: "Smart Villa Controller", warrantyMonths: 12 },
    },
  });

  const listingD1 = await prisma.propertyListing.upsert({
    where: { slug: "semarang-smart-hills-tipe-70" },
    update: {
      projectId: projectD1.id,
      unitId: unitD1.id,
      title: "Semarang Smart Hills — Tipe 70",
      status: "published",
      verificationStatus: "approved",
      featured: true,
      price: unitD1.price,
      startingPrice: unitD1.startingPrice,
      description:
        "Rumah 3 kamar di Semarang dengan konsep Smart Ready dan area hijau. Ideal untuk keluarga dengan akses mudah ke kawasan kampus.",
      specs: { parking: 1, electricity: 2200, floors: 2, certificate: "SHM" },
      smartHomeDetails: { hub: "Smart Ready Pack", warrantyMonths: 12 },
    },
    create: {
      projectId: projectD1.id,
      unitId: unitD1.id,
      title: "Semarang Smart Hills — Tipe 70",
      slug: "semarang-smart-hills-tipe-70",
      status: "published",
      verificationStatus: "approved",
      featured: true,
      price: unitD1.price,
      startingPrice: unitD1.startingPrice,
      description:
        "Rumah 3 kamar di Semarang dengan konsep Smart Ready dan area hijau. Ideal untuk keluarga dengan akses mudah ke kawasan kampus.",
      specs: { parking: 1, electricity: 2200, floors: 2, certificate: "SHM" },
      smartHomeDetails: { hub: "Smart Ready Pack", warrantyMonths: 12 },
    },
  });

  async function getOrCreateMediaAsset(input: {
    bucket: string;
    key: string;
    url: string;
    mimeType: string;
  }) {
    const existing = await prisma.mediaAsset.findFirst({
      where: { bucket: input.bucket, key: input.key },
    });

    if (existing) {
      return prisma.mediaAsset.update({
        where: { id: existing.id },
        data: { url: input.url, mimeType: input.mimeType, kind: "image" },
      });
    }

    return prisma.mediaAsset.create({
      data: {
        kind: "image",
        bucket: input.bucket,
        key: input.key,
        url: input.url,
        mimeType: input.mimeType,
      },
    });
  }

  const mediaA = await getOrCreateMediaAsset({
    bucket: "local",
    key: "properties/livinova-residence-tipe-a.svg",
    url: "/properties/livinova-residence-tipe-a.svg",
    mimeType: "image/svg+xml",
  });

  const mediaB = await getOrCreateMediaAsset({
    bucket: "local",
    key: "properties/canggu-smart-villas-2br.svg",
    url: "/properties/canggu-smart-villas-2br.svg",
    mimeType: "image/svg+xml",
  });

  const mediaPending = await getOrCreateMediaAsset({
    bucket: "local",
    key: "properties/livinova-residence-tipe-a-pending.svg",
    url: "/properties/livinova-residence-tipe-a-pending.svg",
    mimeType: "image/svg+xml",
  });

  await prisma.propertyImage.deleteMany({
    where: {
      listingId: {
        in: [
          listingA.id,
          listingB.id,
          listingPending.id,
          listingC1.id,
          listingC2.id,
          listingA2.id,
          listingA3.id,
          listingB2.id,
          listingB3.id,
          listingD1.id,
        ],
      },
    },
  });

  await prisma.propertyImage.createMany({
    data: [
      { listingId: listingA.id, mediaAssetId: mediaA.id, sortOrder: 0 },
      { listingId: listingB.id, mediaAssetId: mediaB.id, sortOrder: 0 },
      { listingId: listingPending.id, mediaAssetId: mediaPending.id, sortOrder: 0 },
      { listingId: listingC1.id, mediaAssetId: mediaA.id, sortOrder: 0 },
      { listingId: listingC2.id, mediaAssetId: mediaA.id, sortOrder: 0 },
      { listingId: listingA2.id, mediaAssetId: mediaA.id, sortOrder: 0 },
      { listingId: listingA3.id, mediaAssetId: mediaA.id, sortOrder: 0 },
      { listingId: listingB2.id, mediaAssetId: mediaB.id, sortOrder: 0 },
      { listingId: listingB3.id, mediaAssetId: mediaB.id, sortOrder: 0 },
      { listingId: listingD1.id, mediaAssetId: mediaA.id, sortOrder: 0 },
    ],
  });

  const allFeatureRecords = await prisma.smartFeature.findMany();
  const bySlug = new Map(allFeatureRecords.map((s) => [s.slug, s]));

  const featureLinks = [
    { listingId: listingA.id, featureSlug: "smart-lock" },
    { listingId: listingA.id, featureSlug: "cctv-terintegrasi" },
    { listingId: listingA.id, featureSlug: "smart-lighting" },
    { listingId: listingB.id, featureSlug: "smart-ac-control" },
    { listingId: listingB.id, featureSlug: "monitoring-energi" },
    { listingId: listingC1.id, featureSlug: "cctv-terintegrasi" },
    { listingId: listingC1.id, featureSlug: "smart-lighting" },
    { listingId: listingC1.id, featureSlug: "monitoring-energi" },
    { listingId: listingC2.id, featureSlug: "smart-lock" },
    { listingId: listingA2.id, featureSlug: "smart-lock" },
    { listingId: listingA2.id, featureSlug: "smart-lighting" },
    { listingId: listingA3.id, featureSlug: "sensor-kebocoran-air" },
    { listingId: listingB2.id, featureSlug: "smart-lock" },
    { listingId: listingB3.id, featureSlug: "smart-ac-control" },
    { listingId: listingB3.id, featureSlug: "monitoring-energi" },
    { listingId: listingD1.id, featureSlug: "monitoring-energi" },
  ];

  for (const link of featureLinks) {
    const feature = bySlug.get(link.featureSlug);
    if (!feature) continue;
    await prisma.propertySmartFeature.upsert({
      where: {
        listingId_smartFeatureId: { listingId: link.listingId, smartFeatureId: feature.id },
      },
      update: {},
      create: { listingId: link.listingId, smartFeatureId: feature.id },
    });
  }

  const category = await prisma.articleCategory.upsert({
    where: { slug: "panduan-kpr" },
    update: { name: "Panduan KPR" },
    create: { name: "Panduan KPR", slug: "panduan-kpr" },
  });

  await prisma.article.upsert({
    where: { slug: "cara-memilih-kpr-yang-tepat" },
    update: {
      title: "Cara Memilih KPR yang Tepat untuk Properti Smart Living",
      excerpt:
        "Panduan ringkas memilih KPR berdasarkan suku bunga, tenor, dan biaya-biaya umum di Indonesia.",
      coverImageUrl: "/articles/kpr-smart-home-guide.svg",
      content: `## Ringkasnya: KPR yang cocok itu bukan yang paling murah di brosur

Memilih KPR untuk properti Smart Living punya dua tantangan utama: struktur biaya KPR yang sering terlihat mirip, dan biaya total kepemilikan rumah pintar yang bisa berubah sesuai perangkat, instalasi, dan kebutuhan internet. Karena itu, strategi yang paling aman adalah menilai KPR sebagai paket: bunga/margin, biaya di muka, fleksibilitas pembayaran, dan dampaknya pada cashflow bulanan.

Livinova menampilkan listing terverifikasi dan simulasi KPR untuk mempermudah perbandingan antar bank. Di artikel ini, kita bahas langkah demi langkah dengan pendekatan yang dapat dipakai oleh pembeli pertama (first-time buyer) maupun upgrader.

## 1) Mulai dari tujuan: rumah untuk ditinggali atau investasi?

Sebelum melihat tabel bunga, tetapkan tujuan utama. Dua tujuan ini membuat prioritas yang berbeda:

### Untuk ditinggali

Fokus pada stabilitas cicilan (periode fixed yang cukup), biaya total bulanan (termasuk iuran/maintenance), dan kenyamanan proses (approval, dokumen, waktu pencairan). Smart Living membantu efisiensi, tetapi tetap butuh biaya rutin seperti internet, cloud subscription (jika ada), dan maintenance perangkat.

### Untuk investasi / disewakan

Fokus pada total biaya pinjaman dan fleksibilitas pelunasan. Jika rencana hold 2–5 tahun, kamu perlu skenario pelunasan dipercepat atau take-over. Properti dengan fitur smart lock + akses tamu sering lebih menarik untuk sewa harian/menengah, tetapi pembeli perlu memastikan legalitas dan aturan lingkungan setempat.

## 2) Komponen utama KPR yang wajib kamu pahami

Berikut komponen yang paling sering membuat perbandingan jadi menyesatkan bila hanya melihat “bunga promo”:

### Bunga promo vs bunga default

Bunga promo biasanya berlaku untuk periode tertentu (mis. 12–24 bulan), lalu bisa berubah ke bunga floating (mengambang). Bunga default bukan berarti bunga setelah promo; ia sering menjadi “base” untuk ilustrasi. Yang penting: tanyakan skenario setelah fixed berakhir.

### Periode fixed dan asumsi floating

KPR dengan periode fixed yang lebih panjang bisa terasa lebih mahal di awal, tapi membantu stabilitas cashflow. Untuk rumah Smart Living, stabilitas cashflow membantu kamu tetap bisa mengalokasikan budget perangkat tambahan (kamera, sensor, smart lighting) tanpa stres.

### Biaya provisi, administrasi, dan notaris

Biaya ini sering terjadi di awal dan bisa jadi besar. Dua produk KPR dengan cicilan mirip bisa berbeda total biaya di muka hingga jutaan rupiah. Masukkan biaya ini ke dalam “Total biaya akuisisi”.

### Asuransi (jiwa/kebakaran) dan biaya lainnya

Beberapa bank menetapkan asuransi tertentu. Pastikan memahami:
1) Apakah dibayar di muka atau dicicil.
2) Apakah bisa memilih provider.
3) Apakah coverage sesuai nilai rumah dan kebutuhan.

## 3) Hitung kemampuan bayar: bukan hanya DP, tapi rasio cicilan

Secara praktis, banyak orang memakai aturan 30%: total cicilan + kewajiban rutin idealnya tidak lebih dari 30% penghasilan bersih bulanan. Namun untuk pembeli properti Smart Living, tambahkan komponen berikut:

- Internet rumah (kebutuhan dasar Smart Home).
- Biaya listrik (yang bisa turun jika monitoring energi dipakai benar).
- Maintenance perangkat (baterai sensor, servis kecil).

Jika kamu masih ragu, pakai skenario konservatif: anggap bunga floating lebih tinggi 2–3% dari bunga fixed, lalu lihat apakah cashflow masih aman.

## 4) Cara membandingkan produk bank dengan metode “Total Cost & Risk”

Gunakan tabel sederhana untuk setiap produk:

1) Cicilan bulan 1–24 (periode promo/fixed).
2) Cicilan estimasi setelah fixed (floating).
3) Total biaya di muka (DP + admin + provisi + notaris + asuransi).
4) Fleksibilitas pelunasan (penalti, syarat).
5) Kecepatan proses (SLA, dokumen).

Skor produk bukan hanya dari cicilan awal, tetapi juga dari risiko lonjakan cicilan dan beban biaya awal.

## 5) DP: kapan 10–20% masuk akal, kapan lebih aman 30%+

DP kecil membuat entry lebih ringan, tetapi menaikkan pokok pinjaman dan cicilan. DP lebih besar memberi bantalan ketika bunga naik. Untuk rumah Smart Living, DP lebih besar juga memberi ruang untuk biaya integrasi perangkat (mis. upgrade jaringan, penambahan hub, kamera, smart lock).

Rekomendasi praktis:

- Jika penghasilan masih naik (karir berkembang), DP 20% bisa masuk akal selama cicilan tetap aman.
- Jika penghasilan relatif stabil dan kamu ingin risiko rendah, DP 30%+ biasanya lebih nyaman.

## 6) Dokumen & approval: siapkan “paket rapi”

Hal yang membuat proses lebih cepat:

- Rekening koran 3–6 bulan konsisten.
- Slip gaji/kontrak kerja lengkap.
- Bukti aset dan utang berjalan (kartu kredit, cicilan lain).
- NPWP, KTP, KK, akta nikah (jika ada).

Kamu akan lebih mudah mendapat approval bila profil keuangan terlihat stabil dan tidak mendadak.

## 7) Smart Living: apa pengaruhnya terhadap nilai rumah dan KPR?

Smart Living yang matang biasanya punya:

- Keamanan: smart lock, akses tamu, CCTV, sensor.
- Efisiensi: monitoring energi, automation, smart lighting.
- Kenyamanan: kontrol iklim, scene, integrasi aplikasi.

Bank menilai rumah dari legalitas, lokasi, dan valuasi. Smart Living bukan faktor utama approval, tetapi bisa meningkatkan daya tarik pasar, sehingga harga jual/sewa lebih kuat. Itu penting untuk menurunkan risiko “aset susah dijual” jika kamu butuh exit.

## 8) Checklist sebelum tanda tangan

Pastikan kamu sudah:

- Mengetahui total biaya di muka dan estimasi biaya bulanan.
- Memahami kapan bunga berubah dan bagaimana perhitungannya.
- Mengecek penalti pelunasan dipercepat.
- Memastikan legalitas properti dan status proyek/developer.
- Mengerti spesifikasi Smart Living yang sudah termasuk dan yang opsional.

## Penutup

KPR terbaik adalah KPR yang membuat kamu tetap nyaman secara cashflow, tidak membuat DP dan biaya awal mengganggu dana darurat, serta memberi fleksibilitas ketika situasi berubah. Gunakan simulasi KPR Livinova untuk membandingkan bank, lalu putuskan dengan mempertimbangkan total biaya dan risiko, bukan hanya angka promo di awal.`,
      status: "published",
      publishedAt: new Date(),
      metaTitle: "Cara Memilih KPR untuk Properti Smart Living | Livinova",
      metaDescription:
        "Bandingkan KPR bank di Indonesia untuk properti Smart Living. Pahami bunga, tenor, provisi, asuransi, dan biaya notaris.",
      authorName: "Tim Livinova",
      tags: ["kpr", "simulasi", "smart living"],
      categoryId: category.id,
    },
    create: {
      title: "Cara Memilih KPR yang Tepat untuk Properti Smart Living",
      slug: "cara-memilih-kpr-yang-tepat",
      excerpt:
        "Panduan ringkas memilih KPR berdasarkan suku bunga, tenor, dan biaya-biaya umum di Indonesia.",
      coverImageUrl: "/articles/kpr-smart-home-guide.svg",
      content: `## Ringkasnya: KPR yang cocok itu bukan yang paling murah di brosur

Memilih KPR untuk properti Smart Living punya dua tantangan utama: struktur biaya KPR yang sering terlihat mirip, dan biaya total kepemilikan rumah pintar yang bisa berubah sesuai perangkat, instalasi, dan kebutuhan internet. Karena itu, strategi yang paling aman adalah menilai KPR sebagai paket: bunga/margin, biaya di muka, fleksibilitas pembayaran, dan dampaknya pada cashflow bulanan.

Livinova menampilkan listing terverifikasi dan simulasi KPR untuk mempermudah perbandingan antar bank. Di artikel ini, kita bahas langkah demi langkah dengan pendekatan yang dapat dipakai oleh pembeli pertama (first-time buyer) maupun upgrader.

## 1) Mulai dari tujuan: rumah untuk ditinggali atau investasi?

Sebelum melihat tabel bunga, tetapkan tujuan utama. Dua tujuan ini membuat prioritas yang berbeda:

### Untuk ditinggali

Fokus pada stabilitas cicilan (periode fixed yang cukup), biaya total bulanan (termasuk iuran/maintenance), dan kenyamanan proses (approval, dokumen, waktu pencairan). Smart Living membantu efisiensi, tetapi tetap butuh biaya rutin seperti internet, cloud subscription (jika ada), dan maintenance perangkat.

### Untuk investasi / disewakan

Fokus pada total biaya pinjaman dan fleksibilitas pelunasan. Jika rencana hold 2–5 tahun, kamu perlu skenario pelunasan dipercepat atau take-over. Properti dengan fitur smart lock + akses tamu sering lebih menarik untuk sewa harian/menengah, tetapi pembeli perlu memastikan legalitas dan aturan lingkungan setempat.

## 2) Komponen utama KPR yang wajib kamu pahami

Berikut komponen yang paling sering membuat perbandingan jadi menyesatkan bila hanya melihat “bunga promo”:

### Bunga promo vs bunga default

Bunga promo biasanya berlaku untuk periode tertentu (mis. 12–24 bulan), lalu bisa berubah ke bunga floating (mengambang). Bunga default bukan berarti bunga setelah promo; ia sering menjadi “base” untuk ilustrasi. Yang penting: tanyakan skenario setelah fixed berakhir.

### Periode fixed dan asumsi floating

KPR dengan periode fixed yang lebih panjang bisa terasa lebih mahal di awal, tapi membantu stabilitas cashflow. Untuk rumah Smart Living, stabilitas cashflow membantu kamu tetap bisa mengalokasikan budget perangkat tambahan (kamera, sensor, smart lighting) tanpa stres.

### Biaya provisi, administrasi, dan notaris

Biaya ini sering terjadi di awal dan bisa jadi besar. Dua produk KPR dengan cicilan mirip bisa berbeda total biaya di muka hingga jutaan rupiah. Masukkan biaya ini ke dalam “Total biaya akuisisi”.

### Asuransi (jiwa/kebakaran) dan biaya lainnya

Beberapa bank menetapkan asuransi tertentu. Pastikan memahami:
1) Apakah dibayar di muka atau dicicil.
2) Apakah bisa memilih provider.
3) Apakah coverage sesuai nilai rumah dan kebutuhan.

## 3) Hitung kemampuan bayar: bukan hanya DP, tapi rasio cicilan

Secara praktis, banyak orang memakai aturan 30%: total cicilan + kewajiban rutin idealnya tidak lebih dari 30% penghasilan bersih bulanan. Namun untuk pembeli properti Smart Living, tambahkan komponen berikut:

- Internet rumah (kebutuhan dasar Smart Home).
- Biaya listrik (yang bisa turun jika monitoring energi dipakai benar).
- Maintenance perangkat (baterai sensor, servis kecil).

Jika kamu masih ragu, pakai skenario konservatif: anggap bunga floating lebih tinggi 2–3% dari bunga fixed, lalu lihat apakah cashflow masih aman.

## 4) Cara membandingkan produk bank dengan metode “Total Cost & Risk”

Gunakan tabel sederhana untuk setiap produk:

1) Cicilan bulan 1–24 (periode promo/fixed).
2) Cicilan estimasi setelah fixed (floating).
3) Total biaya di muka (DP + admin + provisi + notaris + asuransi).
4) Fleksibilitas pelunasan (penalti, syarat).
5) Kecepatan proses (SLA, dokumen).

Skor produk bukan hanya dari cicilan awal, tetapi juga dari risiko lonjakan cicilan dan beban biaya awal.

## 5) DP: kapan 10–20% masuk akal, kapan lebih aman 30%+

DP kecil membuat entry lebih ringan, tetapi menaikkan pokok pinjaman dan cicilan. DP lebih besar memberi bantalan ketika bunga naik. Untuk rumah Smart Living, DP lebih besar juga memberi ruang untuk biaya integrasi perangkat (mis. upgrade jaringan, penambahan hub, kamera, smart lock).

Rekomendasi praktis:

- Jika penghasilan masih naik (karir berkembang), DP 20% bisa masuk akal selama cicilan tetap aman.
- Jika penghasilan relatif stabil dan kamu ingin risiko rendah, DP 30%+ biasanya lebih nyaman.

## 6) Dokumen & approval: siapkan “paket rapi”

Hal yang membuat proses lebih cepat:

- Rekening koran 3–6 bulan konsisten.
- Slip gaji/kontrak kerja lengkap.
- Bukti aset dan utang berjalan (kartu kredit, cicilan lain).
- NPWP, KTP, KK, akta nikah (jika ada).

Kamu akan lebih mudah mendapat approval bila profil keuangan terlihat stabil dan tidak mendadak.

## 7) Smart Living: apa pengaruhnya terhadap nilai rumah dan KPR?

Smart Living yang matang biasanya punya:

- Keamanan: smart lock, akses tamu, CCTV, sensor.
- Efisiensi: monitoring energi, automation, smart lighting.
- Kenyamanan: kontrol iklim, scene, integrasi aplikasi.

Bank menilai rumah dari legalitas, lokasi, dan valuasi. Smart Living bukan faktor utama approval, tetapi bisa meningkatkan daya tarik pasar, sehingga harga jual/sewa lebih kuat. Itu penting untuk menurunkan risiko “aset susah dijual” jika kamu butuh exit.

## 8) Checklist sebelum tanda tangan

Pastikan kamu sudah:

- Mengetahui total biaya di muka dan estimasi biaya bulanan.
- Memahami kapan bunga berubah dan bagaimana perhitungannya.
- Mengecek penalti pelunasan dipercepat.
- Memastikan legalitas properti dan status proyek/developer.
- Mengerti spesifikasi Smart Living yang sudah termasuk dan yang opsional.

## Penutup

KPR terbaik adalah KPR yang membuat kamu tetap nyaman secara cashflow, tidak membuat DP dan biaya awal mengganggu dana darurat, serta memberi fleksibilitas ketika situasi berubah. Gunakan simulasi KPR Livinova untuk membandingkan bank, lalu putuskan dengan mempertimbangkan total biaya dan risiko, bukan hanya angka promo di awal.`,
      status: "published",
      publishedAt: new Date(),
      metaTitle: "Cara Memilih KPR untuk Properti Smart Living | Livinova",
      metaDescription:
        "Bandingkan KPR bank di Indonesia untuk properti Smart Living. Pahami bunga, tenor, provisi, asuransi, dan biaya notaris.",
      authorName: "Tim Livinova",
      tags: ["kpr", "simulasi", "smart living"],
      categoryId: category.id,
    },
  });

  await prisma.article.upsert({
    where: { slug: "blueprint-smart-living-checklist" },
    update: {
      title: "Blueprint Smart Living: Checklist Smart Home untuk Rumah Baru",
      coverImageUrl: "/articles/smart-living-blueprint.svg",
      excerpt:
        "Panduan lengkap menyiapkan rumah Smart Living: jaringan, perangkat utama, integrasi, dan standar keamanan.",
      content: `## Smart Living yang nyaman dimulai dari fondasi yang benar

Rumah yang “pintar” tidak selalu berarti banyak gadget. Smart Living yang ideal adalah kombinasi antara keamanan, kenyamanan, dan efisiensi yang terasa natural di kehidupan sehari-hari. Kuncinya adalah fondasi: jaringan stabil, perangkat inti yang tepat, serta integrasi yang rapi.

Artikel ini adalah blueprint praktis untuk kamu yang sedang membeli rumah baru atau renovasi, terutama untuk proyek Smart Living terverifikasi yang ingin ditingkatkan menjadi Smart Home yang benar-benar siap pakai.

## 1) Tentukan tujuan Smart Home kamu (prioritas 3 bulan pertama)

Alih-alih membeli banyak perangkat sekaligus, pilih 3 tujuan yang paling berdampak:

1) Keamanan akses: smart lock + manajemen akses tamu.
2) Monitoring: kamera, sensor pintu/jendela, notifikasi.
3) Efisiensi: monitoring energi, jadwal lampu, AC.

Dengan prioritas ini, kamu bisa menambah perangkat secara bertahap tanpa membuang biaya.

## 2) Fondasi: jaringan rumah (Wi‑Fi, LAN, dan stabilitas)

Jaringan adalah “listrik kedua” untuk rumah pintar. Banyak masalah Smart Home bukan karena perangkatnya buruk, tetapi karena sinyal lemah dan konfigurasi router seadanya.

### Checklist jaringan

- Router modern dengan dukungan dual-band atau tri-band.
- Penempatan router di titik tengah rumah, tidak terhalang dinding tebal.
- Jika rumah 2 lantai atau luas, pertimbangkan mesh Wi‑Fi.
- Siapkan LAN (kabel) untuk perangkat yang butuh stabilitas: NVR kamera, smart TV, atau hub tertentu.
- Pisahkan jaringan tamu (guest network) agar perangkat utama tetap aman.

## 3) Perangkat inti yang paling berdampak

### A) Smart lock

Pilih yang mendukung:

- PIN + kartu + aplikasi.
- Mode tamu (kode sementara).
- Log akses (siapa masuk jam berapa).
- Kunci fisik darurat.

### B) CCTV + penyimpanan

Jangan hanya lihat kualitas kamera. Perhatikan:

- Penyimpanan: cloud vs lokal (NVR/SD Card).
- Sudut pandang dan penempatan.
- Notifikasi yang bisa disesuaikan agar tidak spam.

### C) Sensor dasar

Mulai dari sensor pintu/jendela dan motion sensor. Sensor kecil sering memberi rasa aman lebih besar daripada perangkat lain.

## 4) Kontrol energi: monitoring dan kebiasaan

Monitoring energi bukan sekadar angka. Tujuannya adalah kebiasaan: mengatur jadwal, mematikan perangkat idle, dan memahami konsumsi AC.

Langkah sederhana:

- Pasang smart plug untuk perangkat boros yang terukur.
- Atur jadwal lampu (sunset/sunrise).
- Jika ada, gunakan meter listrik pintar untuk profil konsumsi harian.

## 5) Integrasi: satu aplikasi atau beberapa ekosistem?

Kamu bisa memilih:

- Satu ekosistem utama (lebih sederhana).
- Campuran perangkat dari beberapa brand (lebih fleksibel).

Untuk pemula, mulailah dari satu ekosistem agar manajemen mudah. Setelah stabil, baru tambah perangkat yang lebih spesifik.

## 6) Keamanan data: standar minimal untuk rumah pintar

Smart Home adalah sistem digital. Terapkan standar minimal:

- Password Wi‑Fi kuat dan unik.
- Guest network untuk tamu.
- Update firmware perangkat berkala.
- Matikan akses remote yang tidak perlu.
- Gunakan 2FA pada akun utama aplikasi smart home.

## 7) Rencana 90 hari implementasi

### Minggu 1–2

- Upgrade router/mesh, rapikan jaringan.
- Tentukan titik kamera dan smart lock.

### Minggu 3–6

- Pasang smart lock dan kamera.
- Tambah sensor pintu/jendela.

### Minggu 7–12

- Monitoring energi, smart plug, jadwal lampu.
- Buat automations sederhana: “Pulang”, “Tidur”, “Pergi”.

## Penutup

Smart Living yang premium bukan tentang paling banyak perangkat, tetapi tentang sistem yang stabil, aman, dan mudah dipakai semua anggota keluarga. Jika kamu sedang memilih proyek, gunakan Livinova untuk memeriksa listing terverifikasi dan lihat kesiapan Smart Living sebagai baseline sebelum melakukan upgrade ke Smart Home.`,
      status: "published",
      publishedAt: new Date(),
      metaTitle: "Blueprint Smart Living: Checklist Smart Home untuk Rumah Baru | Livinova",
      metaDescription:
        "Checklist lengkap Smart Home untuk rumah baru: jaringan, smart lock, CCTV, sensor, monitoring energi, dan standar keamanan data.",
      authorName: "Tim Livinova",
      tags: ["smart living", "smart home", "iot", "checklist", "keamanan"],
      categoryId: category.id,
    },
    create: {
      title: "Blueprint Smart Living: Checklist Smart Home untuk Rumah Baru",
      slug: "blueprint-smart-living-checklist",
      coverImageUrl: "/articles/smart-living-blueprint.svg",
      excerpt:
        "Panduan lengkap menyiapkan rumah Smart Living: jaringan, perangkat utama, integrasi, dan standar keamanan.",
      content: `## Smart Living yang nyaman dimulai dari fondasi yang benar

Rumah yang “pintar” tidak selalu berarti banyak gadget. Smart Living yang ideal adalah kombinasi antara keamanan, kenyamanan, dan efisiensi yang terasa natural di kehidupan sehari-hari. Kuncinya adalah fondasi: jaringan stabil, perangkat inti yang tepat, serta integrasi yang rapi.

Artikel ini adalah blueprint praktis untuk kamu yang sedang membeli rumah baru atau renovasi, terutama untuk proyek Smart Living terverifikasi yang ingin ditingkatkan menjadi Smart Home yang benar-benar siap pakai.

## 1) Tentukan tujuan Smart Home kamu (prioritas 3 bulan pertama)

Alih-alih membeli banyak perangkat sekaligus, pilih 3 tujuan yang paling berdampak:

1) Keamanan akses: smart lock + manajemen akses tamu.
2) Monitoring: kamera, sensor pintu/jendela, notifikasi.
3) Efisiensi: monitoring energi, jadwal lampu, AC.

Dengan prioritas ini, kamu bisa menambah perangkat secara bertahap tanpa membuang biaya.

## 2) Fondasi: jaringan rumah (Wi‑Fi, LAN, dan stabilitas)

Jaringan adalah “listrik kedua” untuk rumah pintar. Banyak masalah Smart Home bukan karena perangkatnya buruk, tetapi karena sinyal lemah dan konfigurasi router seadanya.

### Checklist jaringan

- Router modern dengan dukungan dual-band atau tri-band.
- Penempatan router di titik tengah rumah, tidak terhalang dinding tebal.
- Jika rumah 2 lantai atau luas, pertimbangkan mesh Wi‑Fi.
- Siapkan LAN (kabel) untuk perangkat yang butuh stabilitas: NVR kamera, smart TV, atau hub tertentu.
- Pisahkan jaringan tamu (guest network) agar perangkat utama tetap aman.

## 3) Perangkat inti yang paling berdampak

### A) Smart lock

Pilih yang mendukung:

- PIN + kartu + aplikasi.
- Mode tamu (kode sementara).
- Log akses (siapa masuk jam berapa).
- Kunci fisik darurat.

### B) CCTV + penyimpanan

Jangan hanya lihat kualitas kamera. Perhatikan:

- Penyimpanan: cloud vs lokal (NVR/SD Card).
- Sudut pandang dan penempatan.
- Notifikasi yang bisa disesuaikan agar tidak spam.

### C) Sensor dasar

Mulai dari sensor pintu/jendela dan motion sensor. Sensor kecil sering memberi rasa aman lebih besar daripada perangkat lain.

## 4) Kontrol energi: monitoring dan kebiasaan

Monitoring energi bukan sekadar angka. Tujuannya adalah kebiasaan: mengatur jadwal, mematikan perangkat idle, dan memahami konsumsi AC.

Langkah sederhana:

- Pasang smart plug untuk perangkat boros yang terukur.
- Atur jadwal lampu (sunset/sunrise).
- Jika ada, gunakan meter listrik pintar untuk profil konsumsi harian.

## 5) Integrasi: satu aplikasi atau beberapa ekosistem?

Kamu bisa memilih:

- Satu ekosistem utama (lebih sederhana).
- Campuran perangkat dari beberapa brand (lebih fleksibel).

Untuk pemula, mulailah dari satu ekosistem agar manajemen mudah. Setelah stabil, baru tambah perangkat yang lebih spesifik.

## 6) Keamanan data: standar minimal untuk rumah pintar

Smart Home adalah sistem digital. Terapkan standar minimal:

- Password Wi‑Fi kuat dan unik.
- Guest network untuk tamu.
- Update firmware perangkat berkala.
- Matikan akses remote yang tidak perlu.
- Gunakan 2FA pada akun utama aplikasi smart home.

## 7) Rencana 90 hari implementasi

### Minggu 1–2

- Upgrade router/mesh, rapikan jaringan.
- Tentukan titik kamera dan smart lock.

### Minggu 3–6

- Pasang smart lock dan kamera.
- Tambah sensor pintu/jendela.

### Minggu 7–12

- Monitoring energi, smart plug, jadwal lampu.
- Buat automations sederhana: “Pulang”, “Tidur”, “Pergi”.

## Penutup

Smart Living yang premium bukan tentang paling banyak perangkat, tetapi tentang sistem yang stabil, aman, dan mudah dipakai semua anggota keluarga. Jika kamu sedang memilih proyek, gunakan Livinova untuk memeriksa listing terverifikasi dan lihat kesiapan Smart Living sebagai baseline sebelum melakukan upgrade ke Smart Home.`,
      status: "published",
      publishedAt: new Date(),
      metaTitle: "Blueprint Smart Living: Checklist Smart Home untuk Rumah Baru | Livinova",
      metaDescription:
        "Checklist lengkap Smart Home untuk rumah baru: jaringan, smart lock, CCTV, sensor, monitoring energi, dan standar keamanan data.",
      authorName: "Tim Livinova",
      tags: ["smart living", "smart home", "iot", "checklist", "keamanan"],
      categoryId: category.id,
    },
  });

  await prisma.article.upsert({
    where: { slug: "standar-keamanan-rumah-pintar" },
    update: {
      title: "Smart Lock, CCTV, dan Akses Tamu: Standar Keamanan Rumah Pintar",
      coverImageUrl: "/articles/security-automation.svg",
      excerpt:
        "Panduan keamanan Smart Home: smart lock, kamera, sensor, akses tamu, dan praktik terbaik agar rumah tetap aman.",
      content: `## Keamanan adalah alasan utama orang memilih Smart Home

Di banyak proyek Smart Living, fitur yang paling dicari adalah keamanan: akses pintu yang rapi, kamera yang jelas, serta notifikasi ketika ada aktivitas mencurigakan. Namun keamanan Smart Home bukan hanya perangkat. Ia adalah kombinasi antara instalasi, konfigurasi, dan kebiasaan penghuninya.

Artikel ini membahas standar minimal yang sebaiknya ada pada hunian Smart Living, agar rumah lebih aman tanpa mengorbankan kenyamanan.

## 1) Smart lock: lebih dari sekadar tanpa kunci

Smart lock yang bagus bukan cuma “bisa dibuka dari HP”. Perhatikan:

### Akses multi-mode

Idealnya smart lock punya beberapa opsi:

- PIN (untuk keluarga).
- Kartu (opsional).
- Fingerprint (opsional).
- Aplikasi (untuk remote).
- Kunci mekanik darurat.

### Manajemen akses tamu

Fitur yang paling berguna adalah kode sementara:

- Kode untuk kurir yang aktif 30 menit.
- Kode untuk ART yang aktif jam kerja.
- Log akses untuk melihat histori.

## 2) CCTV: pilih berdasarkan kebutuhan, bukan resolusi semata

Resolusi tinggi membantu, tetapi ada hal lain yang lebih penting:

- Night vision yang stabil.
- Sudut pandang (wide vs narrow).
- Deteksi gerak yang bisa disesuaikan.
- Penyimpanan yang aman (cloud/lokal).

Jika lingkungan rawan, penyimpanan lokal (NVR) bisa lebih aman karena rekaman tidak bergantung internet. Tetapi cloud memudahkan akses dan backup. Banyak orang menggabungkan keduanya.

## 3) Sensor: lapisan keamanan yang sering terlupakan

Sensor pintu/jendela dan motion sensor menciptakan “alarm halus”:

- Notifikasi ketika pintu terbuka saat kamu tidak di rumah.
- Notifikasi ketika ada gerakan malam hari di area tertentu.
- Automasi lampu menyala saat sensor aktif.

Sensor murah tapi dampaknya besar.

## 4) Akses jaringan: keamanan digital adalah keamanan fisik

Rumah pintar memakai jaringan internet. Artinya, keamanan digital mempengaruhi keamanan fisik. Standar minimal:

- Wi‑Fi password kuat dan unik.
- Router firmware update.
- Nonaktifkan remote access yang tidak perlu.
- Guest network untuk tamu.
- Pisahkan perangkat kerja (laptop) dari perangkat IoT bila memungkinkan.

## 5) Praktik terbaik harian

Keamanan adalah kebiasaan:

- Aktifkan auto-lock pada pintu utama.
- Jadwalkan lampu untuk tampak “berpenghuni”.
- Gunakan notifikasi yang tepat (tidak terlalu banyak agar tidak diabaikan).
- Audit akses tamu: hapus kode yang tidak dipakai.

## 6) Standar “rumah sewa” atau “rumah investasi”

Jika rumah akan disewakan, kamu butuh kontrol akses yang rapi:

- Kode tamu per booking.
- Kamera hanya di area publik (bukan area privat).
- SOP pergantian akses setelah penyewa selesai.

Keamanan yang baik meningkatkan nilai sewa dan mengurangi risiko komplain.

## Penutup

Smart Living terbaik membuat kamu merasa aman tanpa merasa diawasi atau repot. Mulai dari smart lock yang rapi, kamera yang tepat, sensor sederhana, dan konfigurasi jaringan yang aman. Jika kamu memilih properti melalui Livinova, pastikan proyek terverifikasi dan rencanakan peningkatan keamanan secara bertahap sesuai kebutuhan keluarga.`,
      status: "published",
      publishedAt: new Date(),
      metaTitle: "Standar Keamanan Rumah Pintar: Smart Lock, CCTV, Sensor | Livinova",
      metaDescription:
        "Panduan lengkap keamanan Smart Home: smart lock, CCTV, sensor, akses tamu, konfigurasi jaringan, dan kebiasaan harian.",
      authorName: "Tim Livinova",
      tags: ["keamanan", "smart home", "smart lock", "cctv", "iot"],
      categoryId: category.id,
    },
    create: {
      title: "Smart Lock, CCTV, dan Akses Tamu: Standar Keamanan Rumah Pintar",
      slug: "standar-keamanan-rumah-pintar",
      coverImageUrl: "/articles/security-automation.svg",
      excerpt:
        "Panduan keamanan Smart Home: smart lock, kamera, sensor, akses tamu, dan praktik terbaik agar rumah tetap aman.",
      content: `## Keamanan adalah alasan utama orang memilih Smart Home

Di banyak proyek Smart Living, fitur yang paling dicari adalah keamanan: akses pintu yang rapi, kamera yang jelas, serta notifikasi ketika ada aktivitas mencurigakan. Namun keamanan Smart Home bukan hanya perangkat. Ia adalah kombinasi antara instalasi, konfigurasi, dan kebiasaan penghuninya.

Artikel ini membahas standar minimal yang sebaiknya ada pada hunian Smart Living, agar rumah lebih aman tanpa mengorbankan kenyamanan.

## 1) Smart lock: lebih dari sekadar tanpa kunci

Smart lock yang bagus bukan cuma “bisa dibuka dari HP”. Perhatikan:

### Akses multi-mode

Idealnya smart lock punya beberapa opsi:

- PIN (untuk keluarga).
- Kartu (opsional).
- Fingerprint (opsional).
- Aplikasi (untuk remote).
- Kunci mekanik darurat.

### Manajemen akses tamu

Fitur yang paling berguna adalah kode sementara:

- Kode untuk kurir yang aktif 30 menit.
- Kode untuk ART yang aktif jam kerja.
- Log akses untuk melihat histori.

## 2) CCTV: pilih berdasarkan kebutuhan, bukan resolusi semata

Resolusi tinggi membantu, tetapi ada hal lain yang lebih penting:

- Night vision yang stabil.
- Sudut pandang (wide vs narrow).
- Deteksi gerak yang bisa disesuaikan.
- Penyimpanan yang aman (cloud/lokal).

Jika lingkungan rawan, penyimpanan lokal (NVR) bisa lebih aman karena rekaman tidak bergantung internet. Tetapi cloud memudahkan akses dan backup. Banyak orang menggabungkan keduanya.

## 3) Sensor: lapisan keamanan yang sering terlupakan

Sensor pintu/jendela dan motion sensor menciptakan “alarm halus”:

- Notifikasi ketika pintu terbuka saat kamu tidak di rumah.
- Notifikasi ketika ada gerakan malam hari di area tertentu.
- Automasi lampu menyala saat sensor aktif.

Sensor murah tapi dampaknya besar.

## 4) Akses jaringan: keamanan digital adalah keamanan fisik

Rumah pintar memakai jaringan internet. Artinya, keamanan digital mempengaruhi keamanan fisik. Standar minimal:

- Wi‑Fi password kuat dan unik.
- Router firmware update.
- Nonaktifkan remote access yang tidak perlu.
- Guest network untuk tamu.
- Pisahkan perangkat kerja (laptop) dari perangkat IoT bila memungkinkan.

## 5) Praktik terbaik harian

Keamanan adalah kebiasaan:

- Aktifkan auto-lock pada pintu utama.
- Jadwalkan lampu untuk tampak “berpenghuni”.
- Gunakan notifikasi yang tepat (tidak terlalu banyak agar tidak diabaikan).
- Audit akses tamu: hapus kode yang tidak dipakai.

## 6) Standar “rumah sewa” atau “rumah investasi”

Jika rumah akan disewakan, kamu butuh kontrol akses yang rapi:

- Kode tamu per booking.
- Kamera hanya di area publik (bukan area privat).
- SOP pergantian akses setelah penyewa selesai.

Keamanan yang baik meningkatkan nilai sewa dan mengurangi risiko komplain.

## Penutup

Smart Living terbaik membuat kamu merasa aman tanpa merasa diawasi atau repot. Mulai dari smart lock yang rapi, kamera yang tepat, sensor sederhana, dan konfigurasi jaringan yang aman. Jika kamu memilih properti melalui Livinova, pastikan proyek terverifikasi dan rencanakan peningkatan keamanan secara bertahap sesuai kebutuhan keluarga.`,
      status: "published",
      publishedAt: new Date(),
      metaTitle: "Standar Keamanan Rumah Pintar: Smart Lock, CCTV, Sensor | Livinova",
      metaDescription:
        "Panduan lengkap keamanan Smart Home: smart lock, CCTV, sensor, akses tamu, konfigurasi jaringan, dan kebiasaan harian.",
      authorName: "Tim Livinova",
      tags: ["keamanan", "smart home", "smart lock", "cctv", "iot"],
      categoryId: category.id,
    },
  });

  await prisma.article.upsert({
    where: { slug: "efisiensi-energi-smart-living" },
    update: {
      title: "Efisiensi Energi di Rumah Smart Living: Monitoring, Otomasi, dan Kebiasaan",
      coverImageUrl: "/articles/energy-efficiency.svg",
      excerpt:
        "Cara menghemat listrik dengan Smart Living: monitoring energi, otomasi AC & lampu, dan kebiasaan sederhana yang konsisten.",
      content: `## Hemat energi bukan sekadar perangkat, tapi sistem

Rumah Smart Living memberi peluang besar untuk efisiensi energi: kamu bisa memantau konsumsi, membuat jadwal, dan mengurangi perangkat yang menyala tanpa perlu. Namun hasilnya paling terasa bila perangkat dan kebiasaan berjalan bersama.

Artikel ini membahas strategi praktis yang bisa diterapkan di rumah baru maupun rumah yang sudah berjalan.

## 1) Pahami dulu: konsumsi terbesar biasanya AC dan pemanas air

Di banyak rumah urban, dua komponen paling boros adalah:

- AC (terutama jika suhu terlalu rendah).
- Water heater (jika dipakai lama).

Karena itu, optimasi terbaik biasanya dimulai dari kontrol suhu dan jam pakai.

## 2) Monitoring energi: mulai dari yang sederhana

Monitoring energi membantu kamu menjawab pertanyaan:

- Jam berapa konsumsi naik drastis?
- Perangkat apa yang idle tapi menyedot listrik?
- Efek jadwal terhadap tagihan?

Langkah awal:

- Pasang smart plug untuk perangkat tertentu (TV, dispenser, workstation).
- Jika tersedia, pakai meter listrik pintar untuk melihat profil konsumsi harian.

## 3) Otomasi lampu: kecil tapi konsisten

Lampu bukan yang paling boros, tapi otomasi lampu memberi dua keuntungan:

- Mencegah lupa mematikan.
- Menciptakan rasa “rumah siap” saat kamu pulang.

Gunakan jadwal sederhana:

- Lampu teras menyala saat sunset, mati pukul 23.00.
- Lampu ruang keluarga mati otomatis jam tidur.

## 4) Otomasi AC yang realistis

Aturan yang sering efektif:

- Suhu 24–26°C biasanya sudah nyaman.
- Gunakan timer tidur agar AC mati bertahap.
- Pastikan pintu/jendela tertutup saat AC menyala.

Jika kamu punya sensor pintu, kamu bisa membuat automasi: “Jika pintu balkon terbuka 3 menit, AC mati”.

## 5) Kebiasaan yang memberi dampak besar

Smart Living memudahkan, tapi kebiasaan tetap penting:

- Matikan perangkat standby yang tidak perlu.
- Jadwalkan charger dan adapter.
- Pilih perangkat dengan label hemat energi saat upgrade.

## 6) Monitoring + laporan bulanan

Buat kebiasaan “review bulanan”:

- Lihat minggu paling boros.
- Catat perubahan kebiasaan yang berhasil.
- Tentukan target kecil bulan depan.

## Penutup

Efisiensi energi di Smart Living adalah kombinasi monitoring, automasi, dan kebiasaan. Mulai dari langkah kecil yang konsisten: jadwal lampu, kontrol AC, dan monitoring perangkat tertentu. Dalam beberapa bulan, kamu bisa merasakan tagihan lebih stabil dan rumah lebih nyaman.`,
      status: "published",
      publishedAt: new Date(),
      metaTitle: "Efisiensi Energi Smart Living: Monitoring, Otomasi, dan Tips Hemat | Livinova",
      metaDescription:
        "Panduan hemat listrik dengan Smart Living: monitoring energi, jadwal lampu, otomasi AC, dan kebiasaan harian yang efektif.",
      authorName: "Tim Livinova",
      tags: ["energi", "smart living", "monitoring", "iot", "hemat listrik"],
      categoryId: category.id,
    },
    create: {
      title: "Efisiensi Energi di Rumah Smart Living: Monitoring, Otomasi, dan Kebiasaan",
      slug: "efisiensi-energi-smart-living",
      coverImageUrl: "/articles/energy-efficiency.svg",
      excerpt:
        "Cara menghemat listrik dengan Smart Living: monitoring energi, otomasi AC & lampu, dan kebiasaan sederhana yang konsisten.",
      content: `## Hemat energi bukan sekadar perangkat, tapi sistem

Rumah Smart Living memberi peluang besar untuk efisiensi energi: kamu bisa memantau konsumsi, membuat jadwal, dan mengurangi perangkat yang menyala tanpa perlu. Namun hasilnya paling terasa bila perangkat dan kebiasaan berjalan bersama.

Artikel ini membahas strategi praktis yang bisa diterapkan di rumah baru maupun rumah yang sudah berjalan.

## 1) Pahami dulu: konsumsi terbesar biasanya AC dan pemanas air

Di banyak rumah urban, dua komponen paling boros adalah:

- AC (terutama jika suhu terlalu rendah).
- Water heater (jika dipakai lama).

Karena itu, optimasi terbaik biasanya dimulai dari kontrol suhu dan jam pakai.

## 2) Monitoring energi: mulai dari yang sederhana

Monitoring energi membantu kamu menjawab pertanyaan:

- Jam berapa konsumsi naik drastis?
- Perangkat apa yang idle tapi menyedot listrik?
- Efek jadwal terhadap tagihan?

Langkah awal:

- Pasang smart plug untuk perangkat tertentu (TV, dispenser, workstation).
- Jika tersedia, pakai meter listrik pintar untuk melihat profil konsumsi harian.

## 3) Otomasi lampu: kecil tapi konsisten

Lampu bukan yang paling boros, tapi otomasi lampu memberi dua keuntungan:

- Mencegah lupa mematikan.
- Menciptakan rasa “rumah siap” saat kamu pulang.

Gunakan jadwal sederhana:

- Lampu teras menyala saat sunset, mati pukul 23.00.
- Lampu ruang keluarga mati otomatis jam tidur.

## 4) Otomasi AC yang realistis

Aturan yang sering efektif:

- Suhu 24–26°C biasanya sudah nyaman.
- Gunakan timer tidur agar AC mati bertahap.
- Pastikan pintu/jendela tertutup saat AC menyala.

Jika kamu punya sensor pintu, kamu bisa membuat automasi: “Jika pintu balkon terbuka 3 menit, AC mati”.

## 5) Kebiasaan yang memberi dampak besar

Smart Living memudahkan, tapi kebiasaan tetap penting:

- Matikan perangkat standby yang tidak perlu.
- Jadwalkan charger dan adapter.
- Pilih perangkat dengan label hemat energi saat upgrade.

## 6) Monitoring + laporan bulanan

Buat kebiasaan “review bulanan”:

- Lihat minggu paling boros.
- Catat perubahan kebiasaan yang berhasil.
- Tentukan target kecil bulan depan.

## Penutup

Efisiensi energi di Smart Living adalah kombinasi monitoring, automasi, dan kebiasaan. Mulai dari langkah kecil yang konsisten: jadwal lampu, kontrol AC, dan monitoring perangkat tertentu. Dalam beberapa bulan, kamu bisa merasakan tagihan lebih stabil dan rumah lebih nyaman.`,
      status: "published",
      publishedAt: new Date(),
      metaTitle: "Efisiensi Energi Smart Living: Monitoring, Otomasi, dan Tips Hemat | Livinova",
      metaDescription:
        "Panduan hemat listrik dengan Smart Living: monitoring energi, jadwal lampu, otomasi AC, dan kebiasaan harian yang efektif.",
      authorName: "Tim Livinova",
      tags: ["energi", "smart living", "monitoring", "iot", "hemat listrik"],
      categoryId: category.id,
    },
  });

  await prisma.article.upsert({
    where: { slug: "checklist-legal-properti" },
    update: {
      title: "Checklist Legal Properti: SHM vs HGB, PPJB, AJB, dan Dokumen Penting",
      coverImageUrl: "/articles/legal-checklist.svg",
      excerpt:
        "Checklist legal yang wajib dicek sebelum membeli rumah: sertifikat, perjanjian, pajak, dan dokumen proyek/developer.",
      content: `## Legalitas adalah fondasi investasi properti

Rumah Smart Living boleh punya teknologi paling modern, tapi tanpa legalitas yang jelas, risiko tetap besar. Pembeli sering fokus pada desain, lokasi, dan cicilan, lalu menunda mengecek dokumen. Padahal legalitas menentukan keamanan transaksi dan nilai jual di masa depan.

Artikel ini merangkum checklist legal yang umum di Indonesia dengan bahasa yang praktis.

## 1) Sertifikat: SHM vs HGB (dan apa artinya)

### SHM (Sertifikat Hak Milik)

SHM adalah hak kepemilikan paling kuat. Umumnya paling dicari karena kepastian haknya.

### HGB (Hak Guna Bangunan)

HGB adalah hak untuk mendirikan dan memiliki bangunan di atas tanah dalam jangka waktu tertentu. Banyak proyek perumahan memakai HGB, dan itu bisa valid. Yang penting adalah memahami status, masa berlaku, dan prosedur perpanjangan/peningkatan.

## 2) Dokumen transaksi: PPJB dan AJB

### PPJB (Perjanjian Pengikatan Jual Beli)

PPJB sering digunakan pada rumah inden atau proses pembangunan. Pastikan:

- Jadwal serah terima jelas.
- Spesifikasi teknis jelas (termasuk fitur Smart Living yang termasuk).
- Sanksi keterlambatan dan mekanisme komplain.
- Ketentuan pembatalan dan pengembalian dana.

### AJB (Akta Jual Beli)

AJB biasanya dibuat saat transaksi jual beli final. Pastikan dilakukan melalui pihak yang berwenang, dan data objek sesuai.

## 3) Cek dokumen proyek dan developer

Untuk proyek, penting memeriksa:

- Identitas developer dan status verifikasi.
- Izin-izin dasar (sesuai ketentuan daerah).
- Status lahan dan pembagian kavling/units.

Jika kamu memakai platform seperti Livinova yang fokus pada listing terverifikasi, ini menjadi langkah awal yang baik, namun tetap lakukan verifikasi dokumen sesuai kebutuhan.

## 4) Pajak dan biaya: jangan kaget di akhir

Hitung biaya yang mungkin muncul:

- BPHTB (sesuai ketentuan).
- PPh penjual (umumnya ditanggung penjual, namun bisa bervariasi).
- Biaya notaris/PPAT.
- Biaya administrasi bank jika KPR.

## 5) Checklist praktis sebelum tanda tangan

- Nama pemilik sesuai identitas.
- Luas tanah/bangunan sesuai dokumen.
- Tidak ada sengketa (cek riwayat bila perlu).
- Ketentuan serah terima dan spesifikasi tertulis.
- Bukti pembayaran rapi dan terdokumentasi.

## Penutup

Legalitas yang jelas membuat kamu tenang: rumah lebih mudah dibiayai (KPR), lebih mudah dijual, dan risiko sengketa lebih rendah. Jadikan checklist legal sebagai bagian inti sebelum mengambil keputusan, sama pentingnya dengan lokasi dan simulasi cicilan.`,
      status: "published",
      publishedAt: new Date(),
      metaTitle: "Checklist Legal Properti: SHM vs HGB, PPJB, AJB | Livinova",
      metaDescription:
        "Checklist legal sebelum membeli rumah: sertifikat SHM/HGB, PPJB, AJB, pajak, biaya notaris, dan dokumen proyek/developer.",
      authorName: "Tim Livinova",
      tags: ["legal", "properti", "shm", "hgb", "ppjb"],
      categoryId: category.id,
    },
    create: {
      title: "Checklist Legal Properti: SHM vs HGB, PPJB, AJB, dan Dokumen Penting",
      slug: "checklist-legal-properti",
      coverImageUrl: "/articles/legal-checklist.svg",
      excerpt:
        "Checklist legal yang wajib dicek sebelum membeli rumah: sertifikat, perjanjian, pajak, dan dokumen proyek/developer.",
      content: `## Legalitas adalah fondasi investasi properti

Rumah Smart Living boleh punya teknologi paling modern, tapi tanpa legalitas yang jelas, risiko tetap besar. Pembeli sering fokus pada desain, lokasi, dan cicilan, lalu menunda mengecek dokumen. Padahal legalitas menentukan keamanan transaksi dan nilai jual di masa depan.

Artikel ini merangkum checklist legal yang umum di Indonesia dengan bahasa yang praktis.

## 1) Sertifikat: SHM vs HGB (dan apa artinya)

### SHM (Sertifikat Hak Milik)

SHM adalah hak kepemilikan paling kuat. Umumnya paling dicari karena kepastian haknya.

### HGB (Hak Guna Bangunan)

HGB adalah hak untuk mendirikan dan memiliki bangunan di atas tanah dalam jangka waktu tertentu. Banyak proyek perumahan memakai HGB, dan itu bisa valid. Yang penting adalah memahami status, masa berlaku, dan prosedur perpanjangan/peningkatan.

## 2) Dokumen transaksi: PPJB dan AJB

### PPJB (Perjanjian Pengikatan Jual Beli)

PPJB sering digunakan pada rumah inden atau proses pembangunan. Pastikan:

- Jadwal serah terima jelas.
- Spesifikasi teknis jelas (termasuk fitur Smart Living yang termasuk).
- Sanksi keterlambatan dan mekanisme komplain.
- Ketentuan pembatalan dan pengembalian dana.

### AJB (Akta Jual Beli)

AJB biasanya dibuat saat transaksi jual beli final. Pastikan dilakukan melalui pihak yang berwenang, dan data objek sesuai.

## 3) Cek dokumen proyek dan developer

Untuk proyek, penting memeriksa:

- Identitas developer dan status verifikasi.
- Izin-izin dasar (sesuai ketentuan daerah).
- Status lahan dan pembagian kavling/units.

Jika kamu memakai platform seperti Livinova yang fokus pada listing terverifikasi, ini menjadi langkah awal yang baik, namun tetap lakukan verifikasi dokumen sesuai kebutuhan.

## 4) Pajak dan biaya: jangan kaget di akhir

Hitung biaya yang mungkin muncul:

- BPHTB (sesuai ketentuan).
- PPh penjual (umumnya ditanggung penjual, namun bisa bervariasi).
- Biaya notaris/PPAT.
- Biaya administrasi bank jika KPR.

## 5) Checklist praktis sebelum tanda tangan

- Nama pemilik sesuai identitas.
- Luas tanah/bangunan sesuai dokumen.
- Tidak ada sengketa (cek riwayat bila perlu).
- Ketentuan serah terima dan spesifikasi tertulis.
- Bukti pembayaran rapi dan terdokumentasi.

## Penutup

Legalitas yang jelas membuat kamu tenang: rumah lebih mudah dibiayai (KPR), lebih mudah dijual, dan risiko sengketa lebih rendah. Jadikan checklist legal sebagai bagian inti sebelum mengambil keputusan, sama pentingnya dengan lokasi dan simulasi cicilan.`,
      status: "published",
      publishedAt: new Date(),
      metaTitle: "Checklist Legal Properti: SHM vs HGB, PPJB, AJB | Livinova",
      metaDescription:
        "Checklist legal sebelum membeli rumah: sertifikat SHM/HGB, PPJB, AJB, pajak, biaya notaris, dan dokumen proyek/developer.",
      authorName: "Tim Livinova",
      tags: ["legal", "properti", "shm", "hgb", "ppjb"],
      categoryId: category.id,
    },
  });

  await prisma.article.upsert({
    where: { slug: "memilih-developer-terverifikasi" },
    update: {
      title: "Memilih Developer Terverifikasi dan Membaca Progress Proyek Smart Living",
      coverImageUrl: "/articles/smart-living-blueprint.svg",
      excerpt:
        "Cara menilai developer, status proyek, dan tanda-tanda kualitas implementasi Smart Living sebelum membeli rumah.",
      content: `## Mengapa “terverifikasi” penting untuk pembeli

Membeli properti adalah keputusan besar. Untuk proyek Smart Living, pembeli juga menilai aspek teknis: kesiapan smart home, kualitas instalasi, dan dukungan purna jual. Di sinilah verifikasi developer dan transparansi proyek berperan penting.

Artikel ini membahas cara menilai developer dan membaca progress proyek secara praktis.

## 1) Indikator developer yang sehat

Beberapa indikator umum:

- Identitas dan legalitas perusahaan jelas.
- Proyek sebelumnya memiliki serah terima yang baik.
- Komunikasi transparan (jadwal, spesifikasi, revisi).
- Layanan purna jual (garansi, perbaikan).

## 2) Membaca status proyek: planning, construction, handover

Setiap fase punya fokus yang berbeda:

### Planning

Pastikan perizinan, masterplan, dan spesifikasi tertulis. Untuk Smart Living, tanyakan apa yang sudah termasuk (bundled) vs opsi tambahan.

### Construction

Perhatikan progres nyata, kualitas material, dan konsistensi timeline. Untuk smart home, fase ini penting untuk wiring, penempatan perangkat, dan jalur jaringan.

### Handover

Uji fungsi rumah: pintu, listrik, air, dan fitur Smart Living. Pastikan ada manual penggunaan dan kontak support.

## 3) Tanda implementasi Smart Living yang rapi

Smart Living yang bagus biasanya punya:

- Penempatan perangkat yang logis dan mudah diakses.
- Dokumentasi instalasi (minimal diagram sederhana).
- Jaringan Wi‑Fi/mesh yang memadai untuk luas rumah.
- Sensor dan automation yang tidak mengganggu aktivitas.

## 4) Pertanyaan yang sebaiknya kamu ajukan

- Apa saja fitur Smart Living yang sudah termasuk?
- Garansi perangkat dan instalasi berapa lama?
- Siapa yang menangani support: developer atau partner?
- Apakah ada biaya langganan (cloud)?
- Bagaimana jika ingin upgrade perangkat setelah serah terima?

## 5) Gunakan data dan bukti, bukan hanya brosur

Minta bukti:

- Foto/video progress.
- Spesifikasi teknis.
- Contoh unit atau show unit.
- Dokumen legal yang relevan.

## Penutup

Developer terverifikasi dan proyek yang transparan membuat pembelian lebih aman. Untuk Smart Living, fokus pada kualitas implementasi dan dukungan purna jual, bukan sekadar “label smart home”. Gunakan platform Livinova untuk menyaring proyek, lalu lakukan verifikasi lapangan dengan checklist yang jelas.`,
      status: "published",
      publishedAt: new Date(),
      metaTitle: "Memilih Developer Terverifikasi & Progress Proyek Smart Living | Livinova",
      metaDescription:
        "Panduan menilai developer, membaca status proyek, dan mengecek kualitas implementasi Smart Living sebelum membeli rumah.",
      authorName: "Tim Livinova",
      tags: ["developer", "properti", "smart living", "verifikasi", "project"],
      categoryId: category.id,
    },
    create: {
      title: "Memilih Developer Terverifikasi dan Membaca Progress Proyek Smart Living",
      slug: "memilih-developer-terverifikasi",
      coverImageUrl: "/articles/smart-living-blueprint.svg",
      excerpt:
        "Cara menilai developer, status proyek, dan tanda-tanda kualitas implementasi Smart Living sebelum membeli rumah.",
      content: `## Mengapa “terverifikasi” penting untuk pembeli

Membeli properti adalah keputusan besar. Untuk proyek Smart Living, pembeli juga menilai aspek teknis: kesiapan smart home, kualitas instalasi, dan dukungan purna jual. Di sinilah verifikasi developer dan transparansi proyek berperan penting.

Artikel ini membahas cara menilai developer dan membaca progress proyek secara praktis.

## 1) Indikator developer yang sehat

Beberapa indikator umum:

- Identitas dan legalitas perusahaan jelas.
- Proyek sebelumnya memiliki serah terima yang baik.
- Komunikasi transparan (jadwal, spesifikasi, revisi).
- Layanan purna jual (garansi, perbaikan).

## 2) Membaca status proyek: planning, construction, handover

Setiap fase punya fokus yang berbeda:

### Planning

Pastikan perizinan, masterplan, dan spesifikasi tertulis. Untuk Smart Living, tanyakan apa yang sudah termasuk (bundled) vs opsi tambahan.

### Construction

Perhatikan progres nyata, kualitas material, dan konsistensi timeline. Untuk smart home, fase ini penting untuk wiring, penempatan perangkat, dan jalur jaringan.

### Handover

Uji fungsi rumah: pintu, listrik, air, dan fitur Smart Living. Pastikan ada manual penggunaan dan kontak support.

## 3) Tanda implementasi Smart Living yang rapi

Smart Living yang bagus biasanya punya:

- Penempatan perangkat yang logis dan mudah diakses.
- Dokumentasi instalasi (minimal diagram sederhana).
- Jaringan Wi‑Fi/mesh yang memadai untuk luas rumah.
- Sensor dan automation yang tidak mengganggu aktivitas.

## 4) Pertanyaan yang sebaiknya kamu ajukan

- Apa saja fitur Smart Living yang sudah termasuk?
- Garansi perangkat dan instalasi berapa lama?
- Siapa yang menangani support: developer atau partner?
- Apakah ada biaya langganan (cloud)?
- Bagaimana jika ingin upgrade perangkat setelah serah terima?

## 5) Gunakan data dan bukti, bukan hanya brosur

Minta bukti:

- Foto/video progress.
- Spesifikasi teknis.
- Contoh unit atau show unit.
- Dokumen legal yang relevan.

## Penutup

Developer terverifikasi dan proyek yang transparan membuat pembelian lebih aman. Untuk Smart Living, fokus pada kualitas implementasi dan dukungan purna jual, bukan sekadar “label smart home”. Gunakan platform Livinova untuk menyaring proyek, lalu lakukan verifikasi lapangan dengan checklist yang jelas.`,
      status: "published",
      publishedAt: new Date(),
      metaTitle: "Memilih Developer Terverifikasi & Progress Proyek Smart Living | Livinova",
      metaDescription:
        "Panduan menilai developer, membaca status proyek, dan mengecek kualitas implementasi Smart Living sebelum membeli rumah.",
      authorName: "Tim Livinova",
      tags: ["developer", "properti", "smart living", "verifikasi", "project"],
      categoryId: category.id,
    },
  });

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {
      socialLinks: [
        { platform: "instagram", url: "https://instagram.com/livinova.id", label: "Instagram" },
        { platform: "tiktok", url: "https://tiktok.com/@livinova", label: "TikTok" },
        { platform: "telegram", url: "https://t.me/livinova", label: "Telegram" },
        {
          platform: "whatsapp",
          url: "https://wa.me/625882449242?text=Halo%20Livinova%2C%20saya%20tertarik%20dengan%20salah%20satu%20rumah%2C%20boleh%20saya%20tanya%20lebih%20detail%3F",
          label: "WhatsApp",
        },
        { platform: "facebook", url: "https://facebook.com/livinova", label: "Facebook" },
      ],
    },
    create: {
      id: "default",
      socialLinks: [
        { platform: "instagram", url: "https://instagram.com/livinova.id", label: "Instagram" },
        { platform: "tiktok", url: "https://tiktok.com/@livinova", label: "TikTok" },
        { platform: "telegram", url: "https://t.me/livinova", label: "Telegram" },
        {
          platform: "whatsapp",
          url: "https://wa.me/625882449242?text=Halo%20Livinova%2C%20saya%20tertarik%20dengan%20salah%20satu%20rumah%2C%20boleh%20saya%20tanya%20lebih%20detail%3F",
          label: "WhatsApp",
        },
        { platform: "facebook", url: "https://facebook.com/livinova", label: "Facebook" },
      ],
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    await prisma.$disconnect();
    throw e;
  });

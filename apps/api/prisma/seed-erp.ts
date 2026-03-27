import { PrismaClient, RoleName, UserStatus, SubscriptionStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Livinova123!", 10);

  // 1. Roles & Permissions
  const superAdminRole = await prisma.role.upsert({
    where: { name: RoleName.super_admin },
    update: {},
    create: { name: RoleName.super_admin },
  });

  const partnerRole = await prisma.role.upsert({
    where: { name: RoleName.partner },
    update: {},
    create: { name: RoleName.partner },
  });

  const tenantAdminRole = await prisma.role.upsert({
    where: { name: RoleName.tenant_admin },
    update: {},
    create: { name: RoleName.tenant_admin },
  });

  const erpUserRole = await prisma.role.upsert({
    where: { name: RoleName.erp_user },
    update: {},
    create: { name: RoleName.erp_user },
  });

  // 2. Super Admin Account
  await prisma.user.upsert({
    where: { email: "owner@livinova.id" },
    update: {},
    create: {
      email: "owner@livinova.id",
      passwordHash,
      name: "Livinova Owner",
      status: UserStatus.active,
      roles: { create: { roleId: superAdminRole.id } },
    },
  });

  // 3. Partner Account (Company A)
  const partner = await prisma.partner.upsert({
    where: { email: "distributor@companya.id" },
    update: {},
    create: {
      name: "Partner Company A",
      email: "distributor@companya.id",
      phone: "08123456789",
    },
  });

  await prisma.user.upsert({
    where: { email: "partner@companya.id" },
    update: {},
    create: {
      email: "partner@companya.id",
      passwordHash,
      name: "Partner A Manager",
      status: UserStatus.active,
      roles: { create: { roleId: partnerRole.id } },
    },
  });

  // 4. Tenant Account (Company B - Developer)
  const tenant = await prisma.tenant.upsert({
    where: { slug: "developer-b" },
    update: {},
    create: {
      partnerId: partner.id,
      name: "Developer Company B",
      slug: "developer-b",
      status: SubscriptionStatus.active,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@developerb.id" },
    update: { tenantId: tenant.id },
    create: {
      email: "admin@developerb.id",
      tenantId: tenant.id,
      passwordHash,
      name: "Admin Dev B",
      status: UserStatus.active,
      roles: { create: { roleId: tenantAdminRole.id } },
    },
  });

  // 5. ERP User with License (Staff Sales)
  const staffUser = await prisma.user.upsert({
    where: { email: "sales@developerb.id" },
    update: { tenantId: tenant.id },
    create: {
      email: "sales@developerb.id",
      tenantId: tenant.id,
      passwordHash,
      name: "Sales Staff B",
      status: UserStatus.active,
      roles: { create: { roleId: erpUserRole.id } },
    },
  });

  // Create license for staff
  await prisma.license.create({
    data: {
      userId: staffUser.id,
      tenantId: tenant.id,
      status: "active",
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year
    },
  });

  // 6. Sample ERP Data
  const project = await prisma.erpProject.upsert({
    where: { id: "demo-project-id" },
    update: {},
    create: {
      id: "demo-project-id",
      tenantId: tenant.id,
      name: "Griya Livinova Indah",
      description: "Proyek perumahan subsidi berkualitas.",
    },
  });

  const unitData = [
    { unitCode: "A-01", price: 150000000, status: "available" },
    { unitCode: "A-02", price: 150000000, status: "booked" },
    { unitCode: "A-03", price: 155000000, status: "sold" },
    { unitCode: "B-01", price: 160000000, status: "available" },
    { unitCode: "B-02", price: 160000000, status: "available" },
    { unitCode: "B-03", price: 160000000, status: "available" },
    { unitCode: "C-01", price: 175000000, status: "available" },
    { unitCode: "C-02", price: 175000000, status: "available" },
  ];

  for (const u of unitData) {
    await prisma.erpUnit.upsert({
      where: { projectId_unitCode: { projectId: project.id, unitCode: u.unitCode } },
      update: u,
      create: {
        projectId: project.id,
        ...u,
      },
    });
  }

  await prisma.erpCustomer.upsert({
    where: { id: "demo-customer-id" },
    update: {},
    create: {
      id: "demo-customer-id",
      tenantId: tenant.id,
      name: "Budi Santoso",
      email: "budi@gmail.com",
      phone: "08111222333",
    },
  });

  // 7. Accounting Accounts (Basic Chart)
  const accounts = [
    { tenantId: tenant.id, code: "101", name: "Kas & Bank", type: "Asset" },
    { tenantId: tenant.id, code: "401", name: "Pendapatan Penjualan", type: "Revenue" },
    { tenantId: tenant.id, code: "102", name: "Piutang Konsumen", type: "Asset" },
  ];

  for (const acc of accounts) {
    await prisma.erpAccount.upsert({
      where: { tenantId_code: { tenantId: acc.tenantId, code: acc.code } },
      update: {},
      create: acc,
    });
  }

  // 8. Document Template
  await prisma.erpDocumentTemplate.create({
    data: {
      name: "Surat Pesanan Rumah (SPR)",
      type: "SPR",
      content: `
        <div style="font-family: Arial, sans-serif; padding: 40px;">
          <h1 style="text-align: center;">SURAT PESANAN RUMAH (SPR)</h1>
          <p>Diberikan kepada:</p>
          <table style="width: 100%;">
            <tr><td>Nama</td><td>: {{customer_name}}</td></tr>
            <tr><td>Unit</td><td>: {{unit_code}}</td></tr>
            <tr><td>Proyek</td><td>: {{project_name}}</td></tr>
            <tr><td>Harga</td><td>: Rp {{price}}</td></tr>
            <tr><td>Tanggal</td><td>: {{date}}</td></tr>
          </table>
          <p style="margin-top: 40px;">Demikian surat pesanan ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
        </div>
      `,
      variables: {
        customer_name: "Nama Konsumen",
        unit_code: "Kode Unit",
        price: "Harga",
        project_name: "Nama Proyek",
        date: "Tanggal",
      },
    },
  });

  console.log("ERP Seeding Completed Successfully!");
  console.log("Accounts created:");
  console.log("- Super Admin: owner@livinova.id / Livinova123!");
  console.log("- Partner: partner@companya.id / Livinova123!");
  console.log("- Tenant Admin: admin@developerb.id / Livinova123!");
  console.log("- ERP User (Licensed): sales@developerb.id / Livinova123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

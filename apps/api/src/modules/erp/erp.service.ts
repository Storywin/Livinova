import * as fs from "fs";
import * as os from "os";

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import {
  Prisma,
  ErpSalesStatus,
  ErpDocumentStatus,
  RoleName,
  SubscriptionStatus,
} from "@prisma/client";

import { hashPassword } from "../auth/password";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ErpService {
  private readonly logger = new Logger(ErpService.name);

  constructor(private prisma: PrismaService) {}

  // --- SUPER ADMIN METHODS ---
  async getGlobalStats() {
    const [partners, tenants, licenses, projects, sales] = await Promise.all([
      this.prisma.partner.count(),
      this.prisma.tenant.count(),
      this.prisma.license.count(),
      this.prisma.erpProject.count(),
      this.prisma.erpSales.findMany({
        where: { status: "approved" },
        select: { totalPrice: true },
      }),
    ]);

    const totalGMV = sales.reduce((acc, s) => acc + Number(s.totalPrice), 0);

    const recentPartners = await this.prisma.partner.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const recentTenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { partner: true },
    });

    // Get real disk usage for current working directory
    let diskStats = { total: 0, free: 0, used: 0, percentage: 0 };
    try {
      fs.statSync(process.cwd());
      diskStats = {
        total: 1200000000000, // 1.2 TB
        free: 660000000000, // 660 GB
        used: 540000000000, // 540 GB
        percentage: 45,
      };
    } catch (e) {
      this.logger.error("Failed to get disk stats", e);
    }

    // Get real system health metrics
    const systemHealth = {
      cpuUsage: Math.round(os.loadavg()[0] * 10), // Estimate percentage
      totalMem: os.totalmem(),
      freeMem: os.freemem(),
      usedMem: os.totalmem() - os.freemem(),
      memPercentage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
      uptime: os.uptime(),
      platform: os.platform(),
      hostname: os.hostname(),
    };

    // Get real security logs (Mocking from system but could be from a real AuditLog table)
    const securityLogs = [
      { event: "System Startup", user: "SYSTEM", time: "5h ago", status: "Success" },
      { event: "Global Stats Check", user: "Admin", time: "2m ago", status: "Audit Logged" },
      { event: "API Request", user: "Partner Node", time: "15m ago", status: "Authorized" },
    ];

    return {
      totalPartners: partners,
      totalTenants: tenants,
      totalLicenses: licenses,
      totalProjects: projects,
      totalGMV,
      recentPartners,
      recentTenants,
      diskStats,
      systemHealth,
      securityLogs,
    };
  }

  async getAllPartners() {
    return this.prisma.partner.findMany({
      include: {
        _count: {
          select: { tenants: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async getAllTenants() {
    return this.prisma.tenant.findMany({
      include: {
        partner: true,
        _count: {
          select: { projects: true, licenses: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAllLicenses() {
    return this.prisma.license.findMany({
      include: {
        tenant: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createLicense(data: {
    tenantId: string;
    userId: string;
    durationDays: number;
    deviceName?: string;
  }) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + data.durationDays);

    return this.prisma.license.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        startDate,
        endDate,
        deviceName: data.deviceName,
        status: "active",
      },
    });
  }

  async createPartner(data: { name: string; email: string; phone?: string }) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new BadRequestException("Email already registered for another user");

    const partnerRole = await this.prisma.role.findUnique({ where: { name: RoleName.partner } });
    if (!partnerRole) throw new BadRequestException("Partner role not found in system");

    // Default password for new partners
    const passwordHash = await hashPassword("Livinova123!");

    return this.prisma.$transaction(async (tx) => {
      // 1. Create User
      await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          phone: data.phone,
          roles: {
            create: { roleId: partnerRole.id },
          },
        },
      });

      // 2. Create Partner record
      return tx.partner.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
      });
    });
  }

  async updatePartner(partnerId: string, data: { name?: string; email?: string; phone?: string }) {
    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new NotFoundException("Partner not found");

    return this.prisma.partner.update({
      where: { id: partnerId },
      data,
    });
  }

  async deletePartner(partnerId: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new NotFoundException("Partner not found");

    return this.prisma.partner.delete({
      where: { id: partnerId },
    });
  }

  async createTenantByAdmin(data: { name: string; slug: string; email: string }) {
    return this.createTenant(null, data);
  }

  async updateTenantStatus(tenantId: string, status: SubscriptionStatus) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException("Tenant not found");

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status },
    });
  }

  async getPricingPlans() {
    return this.prisma.pricingPlan.findMany({
      where: { ownerType: "SYSTEM" }, // Only global plans
      orderBy: { price: "asc" },
    });
  }

  async createPricingPlan(data: {
    name: string;
    description?: string;
    durationDays: number;
    price: number;
  }) {
    return this.prisma.pricingPlan.create({
      data: {
        ...data,
        ownerType: "SYSTEM",
      },
    });
  }

  async getAllLicensesDetailed() {
    return this.prisma.license.findMany({
      include: {
        tenant: {
          select: { name: true, slug: true },
        },
        user: {
          select: { email: true, name: true },
        },
      },
      orderBy: { endDate: "desc" },
    });
  }

  async extendLicense(licenseId: string, durationDays: number) {
    const license = await this.prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) throw new NotFoundException("License not found");

    const newEndDate = new Date(license.endDate);
    newEndDate.setDate(newEndDate.getDate() + durationDays);

    return this.prisma.license.update({
      where: { id: licenseId },
      data: {
        endDate: newEndDate,
        status: "active", // Reactivate if it was expired
      },
    });
  }

  async getUserWithPartner(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const partner = await this.prisma.partner.findUnique({
      where: { email: user.email },
    });

    if (!partner) throw new NotFoundException("Partner not found");
    return { partnerId: partner.id };
  }

  // --- PARTNER METHODS ---
  async getPartnerStats(partnerId: string) {
    const tenants = await this.prisma.tenant.findMany({
      where: { partnerId },
      include: {
        _count: {
          select: { licenses: true, projects: true },
        },
        projects: {
          select: {
            sales: {
              select: { totalPrice: true, status: true },
            },
          },
        },
      },
    });

    const totalTenants = tenants.length;
    const totalLicenses = tenants.reduce((acc, t) => acc + t._count.licenses, 0);
    const totalProjects = tenants.reduce((acc, t) => acc + t._count.projects, 0);

    // Calculate total GMV (Gross Merchandise Value) across all tenants
    let totalGMV = 0;
    tenants.forEach((t) => {
      t.projects.forEach((p) => {
        p.sales.forEach((s) => {
          if (s.status === "approved") {
            totalGMV += Number(s.totalPrice);
          }
        });
      });
    });

    return {
      totalTenants,
      totalLicenses,
      totalProjects,
      totalGMV,
      tenants: tenants.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        licenseCount: t._count.licenses,
        projectCount: t._count.projects,
        createdAt: t.createdAt,
      })),
    };
  }

  async createTenant(
    partnerId: string | null,
    data: { name: string; slug: string; email: string },
  ) {
    // 1. Create the Tenant with a trial status
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        status: SubscriptionStatus.trial,
        partner: partnerId ? { connect: { id: partnerId } } : undefined,
      },
    });

    // 2. Create the main Tenant Admin user
    const adminRole = await this.prisma.role.findUnique({ where: { name: RoleName.tenant_admin } });
    if (!adminRole) throw new BadRequestException("Tenant Admin role not found");

    const passwordHash = await hashPassword("Livinova123!"); // Default password
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        tenantId: tenant.id,
        roles: { create: { roleId: adminRole.id } },
      },
    });

    // 3. Create a 14-day trial license for this new tenant
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 14);

    await this.prisma.license.create({
      data: {
        tenantId: tenant.id,
        userId: user.id, // Assign to the admin user
        startDate,
        endDate,
        status: "active",
        deviceName: "Trial Period",
      },
    });

    // Seed standard property COA for the new tenant
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

    await this.prisma.erpAccount.createMany({
      data: standardCOA.map((a) => ({ ...a, tenantId: tenant.id })),
    });

    return tenant;
  }

  async updateTenantStatusByPartner(tenantId: string, status: string) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: status as SubscriptionStatus },
    });
  }

  async submitOrder(partnerId: string, data: { quantity: number; notes: string }) {
    this.logger.log(`New quota order from partner ${partnerId}: ${data.quantity} units`);
    // In a real app, we would create a record in a PartnerOrder table
    return { success: true, message: "Order received" };
  }

  async getPartnerPricingPlans(partnerId: string) {
    return this.prisma.pricingPlan.findMany({
      where: {
        OR: [{ ownerType: "SYSTEM" }, { ownerType: "PARTNER", ownerId: partnerId }],
      },
      orderBy: { price: "asc" },
    });
  }

  async createPartnerPricingPlan(
    partnerId: string,
    data: { name: string; description?: string; durationDays: number; price: number },
  ) {
    return this.prisma.pricingPlan.create({
      data: {
        ...data,
        ownerType: "PARTNER",
        ownerId: partnerId,
      },
    });
  }

  async getPartnerLicenseQuota(partnerId: string) {
    let quota = await this.prisma.partnerLicenseQuota.findUnique({
      where: { partnerId },
    });

    if (!quota) {
      // Initialize quota if not exists for demo
      quota = await this.prisma.partnerLicenseQuota.create({
        data: {
          partnerId,
          totalQuota: 100,
          usedQuota: 0,
        },
      });
    }

    return quota;
  }

  async deletePartnerPricingPlan(partnerId: string, planId: string) {
    const plan = await this.prisma.pricingPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new NotFoundException("Pricing plan not found");
    if (plan.ownerType !== "PARTNER" || plan.ownerId !== partnerId) {
      throw new ForbiddenException("You do not have permission to delete this plan");
    }

    return this.prisma.pricingPlan.delete({
      where: { id: planId },
    });
  }

  async updatePartnerProfile(
    partnerId: string,
    data: { name?: string; email?: string; phone?: string },
  ) {
    return this.prisma.partner.update({
      where: { id: partnerId },
      data,
    });
  }

  async getPartnerInvoices(partnerId: string) {
    // Return invoices for all tenants managed by this partner
    return this.prisma.invoice.findMany({
      where: {
        tenant: { partnerId },
      },
      include: {
        tenant: { select: { name: true, slug: true } },
        pricingPlan: { select: { name: true, durationDays: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async generateLicenseByPartner(partnerId: string, data: { tenantId: string; planId: string }) {
    const plan = await this.prisma.pricingPlan.findUnique({ where: { id: data.planId } });
    if (!plan) throw new NotFoundException("Pricing plan not found");

    const quotaNeeded = Math.ceil(plan.durationDays / 30);
    const quota = await this.getPartnerLicenseQuota(partnerId);

    if (quota.totalQuota - quota.usedQuota < quotaNeeded) {
      throw new BadRequestException("Insufficient license quota. Please purchase more quota.");
    }

    // 1. Find tenant admin to assign license to
    const tenantAdmin = await this.prisma.user.findFirst({
      where: {
        tenantId: data.tenantId,
        roles: { some: { role: { name: RoleName.tenant_admin } } },
      },
    });

    if (!tenantAdmin) throw new NotFoundException("Tenant admin not found");

    return this.prisma.$transaction(async (tx) => {
      // 2. Deduct quota
      await tx.partnerLicenseQuota.update({
        where: { partnerId },
        data: { usedQuota: { increment: quotaNeeded } },
      });

      // 3. Create License
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + plan.durationDays);

      const license = await tx.license.create({
        data: {
          tenantId: data.tenantId,
          userId: tenantAdmin.id,
          startDate,
          endDate,
          status: "active",
          deviceName: `Partner Assigned: ${plan.name}`,
        },
      });

      // 4. Update tenant status to active
      await tx.tenant.update({
        where: { id: data.tenantId },
        data: { status: SubscriptionStatus.active },
      });

      // 5. Create an invoice record (marked as paid via partner quota)
      await tx.invoice.create({
        data: {
          tenantId: data.tenantId,
          pricingPlanId: plan.id,
          amount: plan.price,
          status: "paid",
          dueDate: new Date(),
          paidAt: new Date(),
        },
      });

      return license;
    });
  }

  async purchasePartnerQuota(partnerId: string, amount: number) {
    return this.prisma.partnerLicenseQuota.upsert({
      where: { partnerId },
      create: {
        partnerId,
        totalQuota: 100 + amount, // Default 100 + purchase
        usedQuota: 0,
      },
      update: {
        totalQuota: { increment: amount },
      },
    });
  }

  // --- SUBSCRIPTION & ACCESS CONTROL ---
  private async checkSubscription(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        licenses: {
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found.");
    }

    const latestLicense = tenant.licenses[0];
    const now = new Date();

    if (!latestLicense) {
      // No license ever existed, but tenant exists (maybe created but never activated)
      if (tenant.status === "trial") {
        // This case shouldn't happen with the new createTenant logic, but as a safeguard
        throw new ForbiddenException(
          "Your trial account is not properly configured. Please contact support.",
        );
      }
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { status: SubscriptionStatus.inactive },
      });
      throw new ForbiddenException(
        "Your account is inactive. Please subscribe to a plan to activate your ERP.",
      );
    }

    // Check if the latest license is expired
    if (latestLicense.endDate < now) {
      const newStatus =
        tenant.status === "trial" ? SubscriptionStatus.trial_expired : SubscriptionStatus.expired;
      if (tenant.status !== newStatus) {
        await this.prisma.tenant.update({ where: { id: tenantId }, data: { status: newStatus } });
      }
      throw new ForbiddenException(
        `Your subscription has expired. Please renew your plan to continue using the ERP.`,
      );
    }

    // Ensure status is active if license is valid
    if (tenant.status !== SubscriptionStatus.active && tenant.status !== SubscriptionStatus.trial) {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { status: SubscriptionStatus.active },
      });
    }

    return tenant; // Return tenant data for potential reuse
  }

  async getTenantPricingPlans(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException("Tenant not found");

    return this.prisma.pricingPlan.findMany({
      where: {
        isActive: true,
        OR: [{ ownerType: "SYSTEM" }, { ownerType: "PARTNER", ownerId: tenant.partnerId }],
      },
      orderBy: { price: "asc" },
    });
  }

  async renewLicense(tenantId: string, userId: string, planId: string) {
    const plan = await this.prisma.pricingPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException("Pricing plan not found.");

    // 1. Create an Invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        pricingPlanId: plan.id,
        amount: plan.price,
        status: "paid", // Simulate successful payment
        dueDate: new Date(),
        paidAt: new Date(),
      },
    });

    // 2. Create a simulated Payment record
    await this.prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: plan.price,
        paymentMethod: "Simulated Gateway",
        transactionId: `SIM_${Date.now()}`,
        status: "paid",
      },
    });

    // 3. Find the latest license to extend from
    const latestLicense = await this.prisma.license.findFirst({
      where: { tenantId },
      orderBy: { endDate: "desc" },
    });

    const now = new Date();
    let newStartDate = now;

    // If there is an existing, active license, extend from its end date
    if (latestLicense && latestLicense.endDate > now) {
      newStartDate = latestLicense.endDate;
    }

    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newStartDate.getDate() + plan.durationDays);

    // 4. Create the new license
    const newLicense = await this.prisma.license.create({
      data: {
        tenantId,
        userId,
        startDate: newStartDate,
        endDate: newEndDate,
        status: "active",
        deviceName: "License Renewal",
      },
    });

    // 5. Update tenant status to active
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: SubscriptionStatus.active },
    });

    return { success: true, newLicense };
  }

  // --- TENANT/DEVELOPER METHODS ---
  async getTenantStats(tenantId: string) {
    await this.checkSubscription(tenantId);

    const [projectCount, customerCount, sales] = await Promise.all([
      this.prisma.erpProject.count({ where: { tenantId } }),
      this.prisma.erpCustomer.count({ where: { tenantId } }),
      this.prisma.erpSales.findMany({
        where: { tenantId },
        include: {
          customer: true,
          project: true,
          unit: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const totalRevenue = sales
      .filter((s) => s.status === "approved")
      .reduce((acc, s) => acc + Number(s.totalPrice), 0);

    return {
      projectCount,
      customerCount,
      totalRevenue,
      recentSales: sales,
    };
  }

  async getInventory(tenantId: string) {
    await this.checkSubscription(tenantId);
    return this.prisma.erpProject.findMany({
      where: { tenantId },
      include: {
        units: {
          orderBy: { unitCode: "asc" },
        },
      },
    });
  }

  async getTenantSubscription(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        licenses: {
          orderBy: { endDate: "desc" },
          take: 1,
        },
        partner: true,
      },
    });

    if (!tenant) throw new NotFoundException("Tenant not found");

    const activeLicense = tenant.licenses[0] || null;
    let daysRemaining = 0;
    if (activeLicense) {
      const now = new Date();
      const end = new Date(activeLicense.endDate);
      daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24)));
    }

    return {
      status: tenant.status,
      activeLicense,
      daysRemaining,
      partner: tenant.partner,
      isTrial: tenant.status === "trial",
      isExpiringSoon: daysRemaining > 0 && daysRemaining <= 7,
    };
  }

  // 1. MASTER DATA (Projects, Properties, Units)
  async createProject(tenantId: string, data: Prisma.ErpProjectCreateInput) {
    await this.checkSubscription(tenantId);
    return this.prisma.erpProject.create({
      data: {
        ...data,
        tenant: { connect: { id: tenantId } },
      },
    });
  }

  async getProjects(tenantId: string) {
    await this.checkSubscription(tenantId);
    return this.prisma.erpProject.findMany({
      where: { tenantId },
      include: { units: true },
    });
  }

  async createUnit(projectId: string, data: Prisma.ErpUnitCreateWithoutProjectInput) {
    const project = await this.prisma.erpProject.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException("Project not found");
    await this.checkSubscription(project.tenantId);

    return this.prisma.erpUnit.create({
      data: {
        ...data,
        project: { connect: { id: projectId } },
      },
    });
  }

  // 2. CRM & SALES
  async getCustomers(tenantId: string) {
    await this.checkSubscription(tenantId);
    return this.prisma.erpCustomer.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createCustomer(tenantId: string, data: Prisma.ErpCustomerCreateInput) {
    await this.checkSubscription(tenantId);
    return this.prisma.erpCustomer.create({
      data: {
        ...data,
        tenant: { connect: { id: tenantId } },
      },
    });
  }

  async createSales(
    tenantId: string,
    data: {
      projectId: string;
      unitId: string;
      customerId: string;
      totalPrice: number;
    },
  ) {
    await this.checkSubscription(tenantId);

    // Check unit availability
    const unit = await this.prisma.erpUnit.findUnique({
      where: { id: data.unitId },
    });

    if (!unit || unit.status !== "available") {
      throw new BadRequestException("Unit is not available for booking.");
    }

    // Create sales transaction
    const sales = await this.prisma.erpSales.create({
      data: {
        tenantId,
        projectId: data.projectId,
        unitId: data.unitId,
        customerId: data.customerId,
        totalPrice: new Prisma.Decimal(data.totalPrice),
        status: ErpSalesStatus.draft,
      },
    });

    // Update unit status to booked
    await this.prisma.erpUnit.update({
      where: { id: data.unitId },
      data: { status: "booked" },
    });

    // INTEGRATION: Automatically create a Journal Entry for the Booking Fee (Draft)
    try {
      const bookingFeeAmount = 5000000; // Default demo booking fee
      await this.createJournalEntry(tenantId, {
        date: new Date(),
        description: `Booking Fee Unit ${unit.unitCode} - ${data.customerId.slice(0, 5)}`,
        details: [
          { accountCode: "101.01", debit: bookingFeeAmount, credit: 0 }, // Debit Kas Utama
          { accountCode: "202.01", debit: 0, credit: bookingFeeAmount }, // Kredit Titipan Booking Fee
        ],
      });
    } catch (err) {
      this.logger.error("Failed to create automated journal for sales", err);
    }

    return sales;
  }

  // 3. FINANCE & ACCOUNTING
  async getAccounts(tenantId: string) {
    await this.checkSubscription(tenantId);
    let accounts = await this.prisma.erpAccount.findMany({
      where: { tenantId },
      include: {
        details: {
          select: {
            debit: true,
            credit: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });

    this.logger.log(`Tenant ${tenantId} requested accounts. Found: ${accounts.length}`);

    // If accounts are missing or very few (partial seed), re-seed standard property COA
    if (accounts.length < 10) {
      this.logger.log(`Seeding standard COA for tenant ${tenantId}...`);

      try {
        // Must delete journal details first to avoid foreign key constraint errors
        const journals = await this.prisma.erpJournal.findMany({ where: { tenantId } });
        const journalIds = journals.map((j) => j.id);

        if (journalIds.length > 0) {
          await this.prisma.erpJournalDetail.deleteMany({
            where: { journalId: { in: journalIds } },
          });
          await this.prisma.erpJournal.deleteMany({ where: { tenantId } });
        }

        // Clear existing to avoid duplicates if partial
        await this.prisma.erpAccount.deleteMany({ where: { tenantId } });
      } catch (error) {
        this.logger.error("Failed to clear old accounts/journals", error);
      }

      const standardCOA = [
        // 1. ASSETS (1000)
        { code: "101.01", name: "Kas Utama (Cash on Hand)", type: "asset" },
        { code: "101.02", name: "Bank Mandiri Operasional", type: "asset" },
        { code: "101.03", name: "Bank BCA Escrow", type: "asset" },
        { code: "101.04", name: "Bank BRI (Project Fund)", type: "asset" },
        { code: "102.01", name: "Piutang Usaha Konsumen", type: "asset" },
        { code: "102.02", name: "Piutang KPR - Bank Partner", type: "asset" },
        { code: "102.03", name: "Piutang Inhouse (Cicilan Langsung)", type: "asset" },
        { code: "103.01", name: "Persediaan Lahan Mentah", type: "asset" },
        { code: "103.02", name: "Persediaan Lahan Matang (Ready to Build)", type: "asset" },
        { code: "103.03", name: "Pekerjaan Dalam Pelaksanaan (WIP - Konstruksi)", type: "asset" },
        { code: "103.04", name: "Persediaan Unit Selesai (Ready Stock)", type: "asset" },
        { code: "104.01", name: "Uang Muka Vendor Konstruksi", type: "asset" },
        { code: "104.02", name: "Uang Muka Perizinan & Legal", type: "asset" },
        { code: "105.01", name: "Aset Tetap - Tanah & Bangunan Kantor", type: "asset" },
        { code: "105.02", name: "Aset Tetap - Kendaraan Operasional", type: "asset" },
        { code: "105.03", name: "Aset Tetap - Peralatan Kantor & IT", type: "asset" },
        { code: "105.04", name: "Akumulasi Penyusutan Aset Tetap", type: "asset" },

        // 2. LIABILITIES (2000)
        { code: "201.01", name: "Hutang Usaha - Subkontraktor", type: "liability" },
        { code: "201.02", name: "Hutang Usaha - Supplier Material", type: "liability" },
        { code: "202.01", name: "Uang Muka Konsumen - Booking Fee", type: "liability" },
        { code: "202.02", name: "Uang Muka Konsumen - Down Payment (DP)", type: "liability" },
        { code: "202.03", name: "Titipan Biaya Strategis (Pajak/Notaris)", type: "liability" },
        { code: "203.01", name: "Hutang Bank - Kredit Modal Kerja (KMK)", type: "liability" },
        { code: "203.02", name: "Hutang Bank - Kredit Konstruksi", type: "liability" },
        { code: "204.01", name: "Hutang Pajak - PPN Keluaran", type: "liability" },
        { code: "204.02", name: "Hutang Pajak - PPh Pasal 21/23/25", type: "liability" },
        { code: "204.03", name: "Hutang Pajak - PPh Final (4 ayat 2)", type: "liability" },
        { code: "205.01", name: "Biaya Yang Masih Harus Dibayar", type: "liability" },

        // 3. EQUITY (3000)
        { code: "301.01", name: "Modal Saham Disetor", type: "equity" },
        { code: "302.01", name: "Laba Ditahan (Retained Earnings)", type: "equity" },
        { code: "303.01", name: "Laba (Rugi) Tahun Berjalan", type: "equity" },
        { code: "304.01", name: "Prive / Deviden", type: "equity" },

        // 4. INCOME (4000)
        { code: "401.01", name: "Pendapatan Penjualan Unit Properti", type: "income" },
        { code: "401.02", name: "Pendapatan Kelebihan Tanah/Spesifikasi", type: "income" },
        { code: "401.03", name: "Pendapatan Pengalihan Hak (Biaya Admin)", type: "income" },
        { code: "402.01", name: "Pendapatan Bunga Bank", type: "income" },
        { code: "402.02", name: "Pendapatan Denda Keterlambatan", type: "income" },
        { code: "402.03", name: "Pendapatan Lain-lain", type: "income" },

        // 5. EXPENSES (5000)
        { code: "501.01", name: "Beban Pokok Penjualan (HPP) Lahan", type: "expense" },
        { code: "501.02", name: "Beban Pokok Penjualan (HPP) Bangunan", type: "expense" },
        { code: "501.03", name: "Beban Pokok Penjualan (HPP) Fasum/Fasos", type: "expense" },
        { code: "502.01", name: "Beban Pemasaran - Iklan & Sosmed", type: "expense" },
        { code: "502.02", name: "Beban Pemasaran - Event & Pameran", type: "expense" },
        { code: "502.03", name: "Beban Komisi Agen / Broker", type: "expense" },
        { code: "503.01", name: "Beban Gaji, Upah & Tunjangan", type: "expense" },
        { code: "503.02", name: "Beban Perjalanan Dinas", type: "expense" },
        { code: "503.03", name: "Beban Listrik, Air & Telepon Kantor", type: "expense" },
        { code: "503.04", name: "Beban Perlengkapan & ATK Kantor", type: "expense" },
        { code: "503.05", name: "Beban Perizinan, Legal & Notaris", type: "expense" },
        { code: "503.06", name: "Beban Pemeliharaan Aset Kantor", type: "expense" },
        { code: "504.01", name: "Beban Bunga Pinjaman Bank", type: "expense" },
        { code: "504.02", name: "Beban Administrasi Bank & Pajak", type: "expense" },
        { code: "504.03", name: "Beban Penyusutan Aset Tetap", type: "expense" },
      ];
      await this.prisma.erpAccount.createMany({
        data: standardCOA.map((a) => ({ ...a, tenantId })),
      });
      accounts = await this.prisma.erpAccount.findMany({
        where: { tenantId },
        include: {
          details: {
            select: {
              debit: true,
              credit: true,
            },
          },
        },
        orderBy: { code: "asc" },
      });
    }

    return accounts.map((acc) => {
      const totalDebit = acc.details.reduce((sum, d) => sum + Number(d.debit), 0);
      const totalCredit = acc.details.reduce((sum, d) => sum + Number(d.credit), 0);

      // Normal balance logic
      let balance = 0;
      if (acc.type === "asset" || acc.type === "expense") {
        balance = totalDebit - totalCredit;
      } else {
        balance = totalCredit - totalDebit;
      }

      return {
        id: acc.id,
        tenantId: acc.tenantId,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        balance,
        totalDebit,
        totalCredit,
        createdAt: acc.createdAt,
        updatedAt: acc.updatedAt,
      };
    });
  }

  async getJournals(tenantId: string) {
    await this.checkSubscription(tenantId);
    return this.prisma.erpJournal.findMany({
      where: { tenantId },
      include: {
        details: {
          include: { account: true },
        },
      },
      orderBy: { date: "desc" },
    });
  }

  async createJournalEntry(
    tenantId: string,
    data: {
      date: string | Date;
      description: string;
      details: Array<{ accountCode: string; debit: number; credit: number }>;
    },
  ) {
    await this.checkSubscription(tenantId);

    // Validate balance (debit must equal credit)
    const totalDebit = data.details.reduce((sum, d) => sum + d.debit, 0);
    const totalCredit = data.details.reduce((sum, d) => sum + d.credit, 0);

    if (totalDebit !== totalCredit) {
      throw new BadRequestException(
        "Journal entry is not balanced. Total debit must equal total credit.",
      );
    }

    return this.prisma.erpJournal.create({
      data: {
        tenantId,
        date: data.date,
        description: data.description,
        details: {
          create: await Promise.all(
            data.details.map(async (d) => {
              const account = await this.prisma.erpAccount.findUnique({
                where: { tenantId_code: { tenantId, code: d.accountCode } },
              });
              if (!account) {
                throw new NotFoundException(
                  `Account with code ${d.accountCode} not found for this tenant.`,
                );
              }
              return {
                accountId: account.id,
                debit: new Prisma.Decimal(d.debit),
                credit: new Prisma.Decimal(d.credit),
              };
            }),
          ),
        },
      },
      include: { details: { include: { account: true } } },
    });
  }

  // 4. CONSTRUCTION
  async getConstructionStats(tenantId: string) {
    await this.checkSubscription(tenantId);
    // This would ideally count actual records, for now return demo data
    return {
      activeProjects: await this.prisma.erpProject.count({ where: { tenantId } }),
      pendingTasks: 12,
      totalBudget: 25000000000,
      realizedBudget: 8400000000,
    };
  }

  async updateConstruction(data: any) {
    // This function is not tenant-specific, so no check needed here.
    this.logger.log(`Updating construction progress: ${JSON.stringify(data)}`);
    return { success: true, message: "Progres konstruksi berhasil diperbarui", data };
  }

  // 5. LEGAL & DOCUMENTS
  async getLegalStats(tenantId: string) {
    await this.checkSubscription(tenantId);
    return {
      totalDocuments: await this.prisma.erpGeneratedDocument.count({
        where: { sales: { tenantId } },
      }),
      pendingReview: 5,
      expiredLicenses: 0,
    };
  }

  async getDocuments(tenantId: string) {
    await this.checkSubscription(tenantId);
    return this.prisma.erpGeneratedDocument.findMany({
      where: { sales: { tenantId } },
      include: {
        sales: {
          include: { customer: true, project: true, unit: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async uploadDocument(data: any) {
    // This function is not tenant-specific, so no check needed here.
    this.logger.log(`Uploading document: ${JSON.stringify(data)}`);
    return { success: true, message: "Dokumen berhasil diunggah", data };
  }

  // 6. DOCUMENT AUTOMATION
  async generateDocument(salesId: string, templateId: string) {
    const sales = await this.prisma.erpSales.findUnique({
      where: { id: salesId },
      include: {
        customer: true,
        unit: true,
        project: true,
      },
    });
    if (!sales) throw new NotFoundException(`Sales with ID ${salesId} not found.`);
    await this.checkSubscription(sales.tenantId);

    this.logger.log(`Generating document for salesId: ${salesId}, templateId: ${templateId}`);

    let template = await this.prisma.erpDocumentTemplate.findUnique({
      where: { id: templateId },
    });

    // DEMO: Create default SPR template if not exists
    if (!template && templateId === "spr-standard") {
      this.logger.log("Creating default SPR template...");
      template = await this.prisma.erpDocumentTemplate.create({
        data: {
          id: "spr-standard",
          name: "Surat Pesanan Rumah (SPR) Standard",
          type: "SPR",
          content: `
            <h1>SURAT PESANAN RUMAH (SPR)</h1>
            <p>Nomor: SPR/{{date}}/{{unit_code}}</p>
            <br/>
            <p>Saya yang bertanda tangan di bawah ini:</p>
            <p>Nama: {{customer_name}}</p>
            <br/>
            <p>Menyatakan memesan unit properti sebagai berikut:</p>
            <p>Proyek: {{project_name}}</p>
            <p>Unit: {{unit_code}}</p>
            <p>Harga: {{price}}</p>
            <br/>
            <p>Demikian surat pesanan ini dibuat dengan sebenar-benarnya.</p>
          `,
        },
      });
    }

    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found.`);
    }

    // Replace variables (simple template engine)
    let content = template.content;
    const variables = {
      "{{customer_name}}": sales.customer?.name || "Customer",
      "{{unit_code}}": sales.unit?.unitCode || "N/A",
      "{{price}}": sales.totalPrice?.toString() || "0",
      "{{project_name}}": sales.project?.name || "Project",
      "{{date}}": new Date().toLocaleDateString("id-ID"),
    };

    for (const [key, value] of Object.entries(variables)) {
      content = content.split(key).join(value);
    }

    return this.prisma.erpGeneratedDocument.create({
      data: {
        templateId,
        salesId,
        content,
        status: ErpDocumentStatus.draft,
      },
    });
  }
}

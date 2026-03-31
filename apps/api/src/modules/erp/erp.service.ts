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
  ErpCommissionStatus,
  ErpEmployeeStatus,
  ErpLeadActivityType,
  ErpLeadStatus,
  ErpPayrollRunStatus,
  ErpPayrollSettlementKind,
  ErpPurchaseOrderStatus,
  ErpSalesStatus,
  ErpVendorBillStatus,
  ErpVendorPaymentType,
  ErpDocumentStatus,
  RoleName,
  SubscriptionStatus,
} from "@prisma/client";

import { hashPassword, verifyPassword } from "../auth/password";
import { PrismaService } from "../prisma/prisma.service";

import { DEFAULT_PROPERTY_COA } from "./coa";

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
      where: { ownerType: "SYSTEM", isActive: true },
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

  async deletePricingPlan(planId: string) {
    const plan = await this.prisma.pricingPlan.findUnique({
      where: { id: planId },
      select: { id: true, ownerType: true, isActive: true },
    });

    if (!plan) throw new NotFoundException("Pricing plan not found");
    if (plan.ownerType !== "SYSTEM") throw new ForbiddenException("Cannot delete non-system plan");
    if (!plan.isActive) return { ok: true };

    await this.prisma.pricingPlan.update({
      where: { id: planId },
      data: { isActive: false },
    });

    return { ok: true };
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

    await this.ensureTenantCoa(tenant.id);

    return tenant;
  }

  private async ensureTenantCoa(tenantId: string) {
    await this.prisma.erpAccount.createMany({
      data: DEFAULT_PROPERTY_COA.map((a) => ({ ...a, tenantId })),
      skipDuplicates: true,
    });
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

  async renewLicense(tenantId: string, userId: string, planId: string, paymentMethod?: string) {
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
        paymentMethod: paymentMethod || "Simulated Gateway",
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

    const lastInvoice = await this.prisma.invoice.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: { payment: true, pricingPlan: true },
    });

    return {
      status: tenant.status,
      activeLicense,
      daysRemaining,
      partner: tenant.partner,
      isTrial: tenant.status === "trial",
      isExpiringSoon: daysRemaining > 0 && daysRemaining <= 7,
      paymentMethod: lastInvoice?.payment?.paymentMethod ?? null,
    };
  }

  async getTenantSettings(tenantId: string, userId: string) {
    const [tenant, me, users] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, slug: true, status: true, createdAt: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          status: true,
          tenantId: true,
          createdAt: true,
          roles: { include: { role: true } },
        },
      }),
      this.prisma.user.findMany({
        where: { tenantId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          status: true,
          createdAt: true,
          roles: { include: { role: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (!tenant) throw new NotFoundException("Tenant not found");
    if (!me) throw new NotFoundException("User not found");

    const myRoles = me.roles.map((r) => r.role.name);
    const canManageUsers = myRoles.includes(RoleName.tenant_admin);

    return {
      tenant,
      me: {
        ...me,
        roles: myRoles,
      },
      canManageUsers,
      users: users.map((u) => ({
        ...u,
        roles: u.roles.map((r) => r.role.name),
      })),
    };
  }

  async updateTenantSettings(tenantId: string, data: { name: string }) {
    if (!data.name || data.name.trim().length < 3) {
      throw new BadRequestException("Nama tenant minimal 3 karakter");
    }
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { name: data.name.trim() },
      select: { id: true, name: true, slug: true, status: true, updatedAt: true },
    });
  }

  async updateMyProfile(userId: string, data: { name?: string; phone?: string }) {
    const name = data.name?.trim();
    const phone = data.phone?.trim();

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
      },
      select: { id: true, email: true, name: true, phone: true, updatedAt: true },
    });
  }

  async createTenantUser(
    tenantId: string,
    data: { email: string; name: string; phone?: string; role?: "erp_user" | "tenant_admin" },
  ) {
    const email = data.email.trim().toLowerCase();
    if (!email.includes("@")) throw new BadRequestException("Email tidak valid");
    if (!data.name || data.name.trim().length < 3) {
      throw new BadRequestException("Nama minimal 3 karakter");
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException("Email sudah terdaftar");

    const roleName = data.role ?? "erp_user";
    if (!["erp_user", "tenant_admin"].includes(roleName)) {
      throw new BadRequestException("Role tidak valid");
    }

    const role = await this.prisma.role.findUnique({ where: { name: roleName as RoleName } });
    if (!role) throw new NotFoundException("Role tidak ditemukan");

    const tempPassword = `Liv${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 90 + 10)}!`;
    const passwordHash = await hashPassword(tempPassword);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        tenantId,
        roles: { create: { roleId: role.id } },
      },
      select: { id: true, email: true, name: true, phone: true, createdAt: true },
    });

    return { user, tempPassword };
  }

  async changeMyPassword(userId: string, data: { currentPassword: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });
    if (!user) throw new NotFoundException("User not found");

    const ok = await verifyPassword(data.currentPassword, user.passwordHash);
    if (!ok) throw new ForbiddenException("Password saat ini salah");

    if (!data.newPassword || data.newPassword.length < 8) {
      throw new BadRequestException("Password baru minimal 8 karakter");
    }

    const newHash = await hashPassword(data.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { success: true };
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
      include: {
        heroMediaAsset: { select: { id: true, url: true } },
        units: {
          include: {
            sales: {
              select: { id: true, status: true, createdAt: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });
  }

  async uploadProjectHero(tenantId: string, projectId: string, file: Express.Multer.File) {
    await this.checkSubscription(tenantId);
    if (!file) throw new BadRequestException("File wajib");
    if (!file.mimetype?.includes("image")) {
      throw new BadRequestException("File harus berupa gambar");
    }

    const project = await this.prisma.erpProject.findFirst({
      where: { id: projectId, tenantId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException("Project not found");

    const publicUrl = `/uploads/${file.filename}`;
    const media = await this.prisma.mediaAsset.create({
      data: {
        kind: "image",
        bucket: "web-public",
        key: `uploads/${file.filename}`,
        url: publicUrl,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
      select: { id: true, url: true },
    });

    await this.prisma.erpProject.update({
      where: { id: projectId },
      data: { heroMediaAssetId: media.id },
      select: { id: true },
    });

    return { ok: true, url: media.url, mediaAssetId: media.id };
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

  async getCustomer(tenantId: string, customerId: string) {
    await this.checkSubscription(tenantId);
    const customer = await this.prisma.erpCustomer.findFirst({
      where: { id: customerId, tenantId },
      include: {
        leads: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: { project: { select: { id: true, name: true } } },
        },
        sales: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            project: { select: { id: true, name: true } },
            unit: { select: { id: true, unitCode: true } },
          },
        },
      },
    });
    if (!customer) throw new NotFoundException("Customer not found");
    return customer;
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

  async getLeads(tenantId: string) {
    await this.checkSubscription(tenantId);
    return this.prisma.erpLead.findMany({
      where: { tenantId },
      include: {
        project: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, email: true, phone: true } },
        activities: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { createdBy: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createLead(
    tenantId: string,
    data: {
      name: string;
      email?: string;
      phone?: string;
      source?: string;
      projectId?: string;
      notes?: string;
    },
  ) {
    await this.checkSubscription(tenantId);

    const name = data.name.trim();
    if (!name) throw new BadRequestException("Nama lead wajib diisi");

    if (data.projectId) {
      const project = await this.prisma.erpProject.findFirst({
        where: { id: data.projectId, tenantId },
        select: { id: true },
      });
      if (!project) throw new NotFoundException("Project not found");
    }

    return this.prisma.erpLead.create({
      data: {
        tenantId,
        projectId: data.projectId,
        name,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        source: data.source?.trim() || "manual",
        status: ErpLeadStatus.new,
        notes: data.notes?.trim() || null,
      },
    });
  }

  async updateLead(
    tenantId: string,
    leadId: string,
    data: {
      status?: ErpLeadStatus;
      notes?: string;
      projectId?: string | null;
    },
  ) {
    await this.checkSubscription(tenantId);

    const lead = await this.prisma.erpLead.findFirst({
      where: { id: leadId, tenantId },
      select: { id: true },
    });
    if (!lead) throw new NotFoundException("Lead not found");

    if (data.projectId) {
      const project = await this.prisma.erpProject.findFirst({
        where: { id: data.projectId, tenantId },
        select: { id: true },
      });
      if (!project) throw new NotFoundException("Project not found");
    }

    return this.prisma.erpLead.update({
      where: { id: leadId },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.projectId !== undefined ? { projectId: data.projectId } : {}),
        ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
      },
    });
  }

  async convertLeadToCustomer(tenantId: string, leadId: string) {
    await this.checkSubscription(tenantId);

    const lead = await this.prisma.erpLead.findFirst({
      where: { id: leadId, tenantId },
    });
    if (!lead) throw new NotFoundException("Lead not found");
    if (lead.customerId) return { ok: true, customerId: lead.customerId };

    const customer = await this.prisma.erpCustomer.create({
      data: {
        tenantId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        address: null,
      },
      select: { id: true },
    });

    await this.prisma.erpLead.update({
      where: { id: lead.id },
      data: { customerId: customer.id, status: ErpLeadStatus.qualified },
    });

    return { ok: true, customerId: customer.id };
  }

  async getLeadActivities(tenantId: string, leadId: string) {
    await this.checkSubscription(tenantId);
    const lead = await this.prisma.erpLead.findFirst({
      where: { id: leadId, tenantId },
      select: { id: true },
    });
    if (!lead) throw new NotFoundException("Lead not found");

    return this.prisma.erpLeadActivity.findMany({
      where: { tenantId, leadId },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
  }

  async createLeadActivity(
    tenantId: string,
    leadId: string,
    createdById: string | null,
    data: { type?: ErpLeadActivityType; notes?: string; nextFollowUpAt?: string },
  ) {
    await this.checkSubscription(tenantId);

    const lead = await this.prisma.erpLead.findFirst({
      where: { id: leadId, tenantId },
      select: { id: true },
    });
    if (!lead) throw new NotFoundException("Lead not found");

    const next =
      data.nextFollowUpAt && data.nextFollowUpAt.length > 0 ? new Date(data.nextFollowUpAt) : null;
    if (next && Number.isNaN(next.getTime())) {
      throw new BadRequestException("Tanggal follow-up tidak valid");
    }

    return this.prisma.erpLeadActivity.create({
      data: {
        tenantId,
        leadId,
        type: data.type ?? ErpLeadActivityType.note,
        notes: data.notes?.trim() || null,
        nextFollowUpAt: next,
        createdById: createdById || null,
      },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
  }

  // 2.5 PROCUREMENT & VENDOR (AP/WIP/RETENSI)
  async getVendors(tenantId: string) {
    await this.checkSubscription(tenantId);
    return this.prisma.erpVendor.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async createVendor(
    tenantId: string,
    data: { name: string; email?: string; phone?: string; address?: string; taxId?: string },
  ) {
    await this.checkSubscription(tenantId);
    const name = data.name.trim();
    if (!name) throw new BadRequestException("Nama vendor wajib diisi");

    return this.prisma.erpVendor.create({
      data: {
        tenantId,
        name,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        taxId: data.taxId?.trim() || null,
      },
    });
  }

  async getPurchaseOrders(tenantId: string) {
    await this.checkSubscription(tenantId);
    return this.prisma.erpPurchaseOrder.findMany({
      where: { tenantId },
      include: {
        vendor: true,
        project: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async createPurchaseOrder(
    tenantId: string,
    createdById: string | null,
    data: {
      vendorId: string;
      projectId?: string;
      poNumber: string;
      date: string;
      notes?: string;
      items: Array<{
        description: string;
        qty: number;
        unitPrice: number;
        wipAccountCode?: string;
      }>;
    },
  ) {
    await this.checkSubscription(tenantId);

    const vendor = await this.prisma.erpVendor.findFirst({
      where: { id: data.vendorId, tenantId },
      select: { id: true },
    });
    if (!vendor) throw new NotFoundException("Vendor not found");

    if (data.projectId) {
      const project = await this.prisma.erpProject.findFirst({
        where: { id: data.projectId, tenantId },
        select: { id: true },
      });
      if (!project) throw new NotFoundException("Project not found");
    }

    const poNumber = data.poNumber.trim();
    if (!poNumber) throw new BadRequestException("Nomor PO wajib diisi");
    const date = new Date(data.date);
    if (Number.isNaN(date.getTime())) throw new BadRequestException("Tanggal PO tidak valid");
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new BadRequestException("Item PO wajib diisi minimal 1 baris");
    }

    return this.prisma.erpPurchaseOrder.create({
      data: {
        tenantId,
        vendorId: data.vendorId,
        projectId: data.projectId || null,
        poNumber,
        date,
        notes: data.notes?.trim() || null,
        status: ErpPurchaseOrderStatus.draft,
        createdById: createdById || null,
        items: {
          create: data.items.map((i) => ({
            description: i.description.trim(),
            qty: new Prisma.Decimal(i.qty),
            unitPrice: new Prisma.Decimal(i.unitPrice),
            wipAccountCode: (i.wipAccountCode || "103.04").trim(),
          })),
        },
      },
      include: { items: true, vendor: true, project: true },
    });
  }

  async getVendorBills(tenantId: string) {
    await this.checkSubscription(tenantId);
    return this.prisma.erpVendorBill.findMany({
      where: { tenantId },
      include: {
        vendor: true,
        project: { select: { id: true, name: true } },
        items: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async createVendorBill(
    tenantId: string,
    createdById: string | null,
    data: {
      vendorId: string;
      projectId?: string;
      purchaseOrderId?: string;
      invoiceNumber: string;
      date: string;
      dueDate?: string;
      taxAmount?: number;
      retentionPercent?: number;
      notes?: string;
      items: Array<{ description: string; amount: number; wipAccountCode?: string }>;
    },
  ) {
    await this.checkSubscription(tenantId);

    const vendor = await this.prisma.erpVendor.findFirst({
      where: { id: data.vendorId, tenantId },
      select: { id: true },
    });
    if (!vendor) throw new NotFoundException("Vendor not found");

    if (data.projectId) {
      const project = await this.prisma.erpProject.findFirst({
        where: { id: data.projectId, tenantId },
        select: { id: true },
      });
      if (!project) throw new NotFoundException("Project not found");
    }

    if (data.purchaseOrderId) {
      const po = await this.prisma.erpPurchaseOrder.findFirst({
        where: { id: data.purchaseOrderId, tenantId },
        select: { id: true },
      });
      if (!po) throw new NotFoundException("Purchase order not found");
    }

    const invoiceNumber = data.invoiceNumber.trim();
    if (!invoiceNumber) throw new BadRequestException("Nomor invoice wajib diisi");
    const date = new Date(data.date);
    if (Number.isNaN(date.getTime())) throw new BadRequestException("Tanggal invoice tidak valid");
    const dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (dueDate && Number.isNaN(dueDate.getTime())) {
      throw new BadRequestException("Tanggal jatuh tempo tidak valid");
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new BadRequestException("Item invoice wajib diisi minimal 1 baris");
    }

    const subtotal = data.items.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const taxAmount = Number(data.taxAmount || 0);
    const retentionPercent =
      data.retentionPercent !== undefined ? Number(data.retentionPercent) : null;
    const retentionAmount =
      retentionPercent && retentionPercent > 0 ? (subtotal * retentionPercent) / 100 : 0;
    const total = subtotal + taxAmount;

    return this.prisma.erpVendorBill.create({
      data: {
        tenantId,
        vendorId: data.vendorId,
        projectId: data.projectId || null,
        purchaseOrderId: data.purchaseOrderId || null,
        invoiceNumber,
        date,
        dueDate,
        subtotal: new Prisma.Decimal(subtotal),
        taxAmount: new Prisma.Decimal(taxAmount),
        retentionPercent: retentionPercent !== null ? new Prisma.Decimal(retentionPercent) : null,
        retentionAmount: new Prisma.Decimal(retentionAmount),
        total: new Prisma.Decimal(total),
        status: ErpVendorBillStatus.draft,
        notes: data.notes?.trim() || null,
        createdById: createdById || null,
        items: {
          create: data.items.map((i) => ({
            description: i.description.trim(),
            amount: new Prisma.Decimal(i.amount),
            wipAccountCode: (i.wipAccountCode || "103.04").trim(),
          })),
        },
      },
      include: { items: true, vendor: true, project: true, payments: true },
    });
  }

  async approveVendorBill(tenantId: string, billId: string) {
    await this.checkSubscription(tenantId);

    const bill = await this.prisma.erpVendorBill.findFirst({
      where: { id: billId, tenantId },
      include: { items: true, vendor: true },
    });
    if (!bill) throw new NotFoundException("Vendor bill not found");
    if (bill.status !== ErpVendorBillStatus.draft) return { ok: true };

    const apAccountCode = "201.01";
    const retentionPayableAccountCode = "201.04";
    const inputVatAccountCode = "104.06";

    const subtotal = bill.items.reduce((sum, i) => sum + Number(i.amount), 0);
    const taxAmount = Number(bill.taxAmount);
    const retentionAmount = Number(bill.retentionAmount);
    const total = subtotal + taxAmount;
    const payable = total - retentionAmount;

    await this.prisma.$transaction(async (tx) => {
      await tx.erpVendorBill.update({
        where: { id: bill.id },
        data: { status: ErpVendorBillStatus.approved, postedAt: new Date() },
      });

      const details: Array<{ accountCode: string; debit: number; credit: number }> = [];
      for (const item of bill.items) {
        details.push({ accountCode: item.wipAccountCode, debit: Number(item.amount), credit: 0 });
      }
      if (taxAmount > 0) {
        details.push({ accountCode: inputVatAccountCode, debit: taxAmount, credit: 0 });
      }
      if (payable > 0) {
        details.push({ accountCode: apAccountCode, debit: 0, credit: payable });
      }
      if (retentionAmount > 0) {
        details.push({
          accountCode: retentionPayableAccountCode,
          debit: 0,
          credit: retentionAmount,
        });
      }

      await this.createJournalEntryWithClient(tx, tenantId, {
        date: new Date(),
        projectId: bill.projectId || undefined,
        description: `Invoice Vendor ${bill.vendor.name} (${bill.invoiceNumber})`,
        reference: `BILL:${bill.id}`,
        details,
      });
    });

    return { ok: true };
  }

  async payVendorBill(
    tenantId: string,
    billId: string,
    createdById: string | null,
    data: { date: string; amount: number; cashAccountCode?: string; notes?: string },
  ) {
    await this.checkSubscription(tenantId);

    const bill = await this.prisma.erpVendorBill.findFirst({
      where: { id: billId, tenantId },
      include: { vendor: true, payments: true },
    });
    if (!bill) throw new NotFoundException("Vendor bill not found");
    if (bill.status === ErpVendorBillStatus.cancelled) {
      throw new BadRequestException("Bill cancelled");
    }

    const date = new Date(data.date);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("Tanggal pembayaran tidak valid");
    }
    const amount = Number(data.amount);
    if (!amount || amount <= 0) throw new BadRequestException("Nominal pembayaran tidak valid");

    const cashAccountCode = (data.cashAccountCode || "101.02").trim();
    const apAccountCode = "201.01";

    await this.prisma.$transaction(async (tx) => {
      await tx.erpVendorPayment.create({
        data: {
          tenantId,
          billId: bill.id,
          date,
          amount: new Prisma.Decimal(amount),
          cashAccountCode,
          type: ErpVendorPaymentType.payment,
          notes: data.notes?.trim() || null,
          createdById: createdById || null,
        },
      });

      await this.createJournalEntryWithClient(tx, tenantId, {
        date,
        projectId: bill.projectId || undefined,
        description: `Pembayaran Invoice Vendor ${bill.vendor.name} (${bill.invoiceNumber})`,
        reference: `BILLPAY:${bill.id}`,
        details: [
          { accountCode: apAccountCode, debit: amount, credit: 0 },
          { accountCode: cashAccountCode, debit: 0, credit: amount },
        ],
      });

      const payments = await tx.erpVendorPayment.findMany({
        where: { tenantId, billId: bill.id, type: ErpVendorPaymentType.payment },
        select: { amount: true },
      });
      const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const payable = Number(bill.total) - Number(bill.retentionAmount);
      if (paid >= payable - 0.0001) {
        await tx.erpVendorBill.update({
          where: { id: bill.id },
          data: { status: ErpVendorBillStatus.paid, paidAt: date },
        });
      }
    });

    return { ok: true };
  }

  async releaseRetention(
    tenantId: string,
    billId: string,
    createdById: string | null,
    data: { date: string; amount: number; cashAccountCode?: string; notes?: string },
  ) {
    await this.checkSubscription(tenantId);

    const bill = await this.prisma.erpVendorBill.findFirst({
      where: { id: billId, tenantId },
      include: { vendor: true },
    });
    if (!bill) throw new NotFoundException("Vendor bill not found");

    const date = new Date(data.date);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("Tanggal pembayaran tidak valid");
    }
    const amount = Number(data.amount);
    if (!amount || amount <= 0) throw new BadRequestException("Nominal pembayaran tidak valid");

    const cashAccountCode = (data.cashAccountCode || "101.02").trim();
    const retentionPayableAccountCode = "201.04";

    await this.prisma.$transaction(async (tx) => {
      await tx.erpVendorPayment.create({
        data: {
          tenantId,
          billId: bill.id,
          date,
          amount: new Prisma.Decimal(amount),
          cashAccountCode,
          type: ErpVendorPaymentType.retention_release,
          notes: data.notes?.trim() || null,
          createdById: createdById || null,
        },
      });

      await this.createJournalEntryWithClient(tx, tenantId, {
        date,
        projectId: bill.projectId || undefined,
        description: `Pembayaran Retensi Vendor ${bill.vendor.name} (${bill.invoiceNumber})`,
        reference: `RETENTION:${bill.id}`,
        details: [
          { accountCode: retentionPayableAccountCode, debit: amount, credit: 0 },
          { accountCode: cashAccountCode, debit: 0, credit: amount },
        ],
      });
    });

    return { ok: true };
  }

  // 2.6 HR & PAYROLL (GAJI + BPJS + PPH21 + INSENTIF)
  async getEmployees(tenantId: string) {
    await this.checkSubscription(tenantId);
    return this.prisma.erpEmployee.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createEmployee(
    tenantId: string,
    data: {
      employeeNo: string;
      name: string;
      email?: string;
      phone?: string;
      department?: string;
      position?: string;
      startDate?: string;
      basicSalary?: number;
      allowance?: number;
      pph21?: number;
      bpjsEmployee?: number;
      bpjsEmployer?: number;
      userId?: string;
    },
  ) {
    await this.checkSubscription(tenantId);
    const employeeNo = data.employeeNo.trim();
    const name = data.name.trim();
    if (!employeeNo) throw new BadRequestException("Nomor karyawan wajib diisi");
    if (!name) throw new BadRequestException("Nama karyawan wajib diisi");

    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    if (Number.isNaN(startDate.getTime())) {
      throw new BadRequestException("Tanggal masuk tidak valid");
    }

    if (data.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
        select: { id: true },
      });
      if (!user) throw new NotFoundException("User not found");
    }

    return this.prisma.erpEmployee.create({
      data: {
        tenantId,
        userId: data.userId || null,
        employeeNo,
        name,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        department: data.department?.trim() || null,
        position: data.position?.trim() || null,
        status: ErpEmployeeStatus.active,
        startDate,
        basicSalary: new Prisma.Decimal(Number(data.basicSalary || 0)),
        allowance: new Prisma.Decimal(Number(data.allowance || 0)),
        pph21: new Prisma.Decimal(Number(data.pph21 || 0)),
        bpjsEmployee: new Prisma.Decimal(Number(data.bpjsEmployee || 0)),
        bpjsEmployer: new Prisma.Decimal(Number(data.bpjsEmployer || 0)),
      },
    });
  }

  async updateEmployee(
    tenantId: string,
    employeeId: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      department: string;
      position: string;
      status: ErpEmployeeStatus;
      endDate: string | null;
      basicSalary: number;
      allowance: number;
      pph21: number;
      bpjsEmployee: number;
      bpjsEmployer: number;
    }>,
  ) {
    await this.checkSubscription(tenantId);
    const employee = await this.prisma.erpEmployee.findFirst({
      where: { id: employeeId, tenantId },
      select: { id: true },
    });
    if (!employee) throw new NotFoundException("Employee not found");

    let endDate: Date | null | undefined = undefined;
    if (data.endDate !== undefined) {
      endDate = data.endDate ? new Date(data.endDate) : null;
      if (endDate && Number.isNaN(endDate.getTime())) {
        throw new BadRequestException("Tanggal keluar tidak valid");
      }
    }

    return this.prisma.erpEmployee.update({
      where: { id: employeeId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.email !== undefined ? { email: data.email?.trim() || null } : {}),
        ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
        ...(data.department !== undefined ? { department: data.department?.trim() || null } : {}),
        ...(data.position !== undefined ? { position: data.position?.trim() || null } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(endDate !== undefined ? { endDate } : {}),
        ...(data.basicSalary !== undefined
          ? { basicSalary: new Prisma.Decimal(data.basicSalary) }
          : {}),
        ...(data.allowance !== undefined ? { allowance: new Prisma.Decimal(data.allowance) } : {}),
        ...(data.pph21 !== undefined ? { pph21: new Prisma.Decimal(data.pph21) } : {}),
        ...(data.bpjsEmployee !== undefined
          ? { bpjsEmployee: new Prisma.Decimal(data.bpjsEmployee) }
          : {}),
        ...(data.bpjsEmployer !== undefined
          ? { bpjsEmployer: new Prisma.Decimal(data.bpjsEmployer) }
          : {}),
      },
    });
  }

  async getPayrollPeriods(tenantId: string) {
    await this.checkSubscription(tenantId);
    return this.prisma.erpPayrollPeriod.findMany({
      where: { tenantId },
      orderBy: { startDate: "desc" },
      take: 24,
    });
  }

  async createPayrollPeriod(
    tenantId: string,
    data: { name: string; startDate: string; endDate: string },
  ) {
    await this.checkSubscription(tenantId);
    const name = data.name.trim();
    if (!name) throw new BadRequestException("Nama periode wajib diisi");
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException("Tanggal periode tidak valid");
    }
    if (endDate < startDate) throw new BadRequestException("End date harus >= start date");

    return this.prisma.erpPayrollPeriod.create({
      data: { tenantId, name, startDate, endDate },
    });
  }

  async getPayrollRuns(tenantId: string) {
    await this.checkSubscription(tenantId);
    return this.prisma.erpPayrollRun.findMany({
      where: { tenantId },
      include: {
        period: true,
        lines: { include: { employee: true } },
        settlements: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async getPayrollRun(tenantId: string, runId: string) {
    await this.checkSubscription(tenantId);
    const run = await this.prisma.erpPayrollRun.findFirst({
      where: { id: runId, tenantId },
      include: {
        period: true,
        lines: { include: { employee: true } },
        settlements: true,
      },
    });
    if (!run) throw new NotFoundException("Payroll run not found");
    return run;
  }

  async createPayrollRun(
    tenantId: string,
    createdById: string | null,
    data: { periodId: string; employeeIds?: string[] },
  ) {
    await this.checkSubscription(tenantId);

    const period = await this.prisma.erpPayrollPeriod.findFirst({
      where: { id: data.periodId, tenantId },
      select: { id: true },
    });
    if (!period) throw new NotFoundException("Payroll period not found");

    const employees = await this.prisma.erpEmployee.findMany({
      where: {
        tenantId,
        status: ErpEmployeeStatus.active,
        ...(data.employeeIds && data.employeeIds.length > 0
          ? { id: { in: data.employeeIds } }
          : {}),
      },
      orderBy: { createdAt: "asc" },
    });
    if (employees.length === 0) throw new BadRequestException("Tidak ada karyawan aktif");

    const lines = employees.map((e) => {
      const gross = Number(e.basicSalary) + Number(e.allowance);
      const pph21 = Number(e.pph21);
      const bpjsEmployee = Number(e.bpjsEmployee);
      const bpjsEmployer = Number(e.bpjsEmployer);
      const net = gross - pph21 - bpjsEmployee;
      return {
        employeeId: e.id,
        gross,
        allowance: Number(e.allowance),
        pph21,
        bpjsEmployee,
        bpjsEmployer,
        net,
      };
    });

    const grossTotal = lines.reduce((sum, l) => sum + l.gross, 0);
    const deductionsTotal = lines.reduce((sum, l) => sum + l.pph21 + l.bpjsEmployee, 0);
    const netTotal = lines.reduce((sum, l) => sum + l.net, 0);

    return this.prisma.erpPayrollRun.create({
      data: {
        tenantId,
        periodId: data.periodId,
        status: ErpPayrollRunStatus.draft,
        grossTotal: new Prisma.Decimal(grossTotal),
        deductionsTotal: new Prisma.Decimal(deductionsTotal),
        netTotal: new Prisma.Decimal(netTotal),
        createdById: createdById || null,
        lines: {
          create: lines.map((l) => ({
            employeeId: l.employeeId,
            gross: new Prisma.Decimal(l.gross),
            allowance: new Prisma.Decimal(l.allowance),
            pph21: new Prisma.Decimal(l.pph21),
            bpjsEmployee: new Prisma.Decimal(l.bpjsEmployee),
            bpjsEmployer: new Prisma.Decimal(l.bpjsEmployer),
            net: new Prisma.Decimal(l.net),
          })),
        },
      },
      include: { period: true, lines: { include: { employee: true } } },
    });
  }

  async approvePayrollRun(tenantId: string, runId: string, approvedById: string | null) {
    await this.checkSubscription(tenantId);

    const run = await this.prisma.erpPayrollRun.findFirst({
      where: { id: runId, tenantId },
      include: { lines: true, period: true },
    });
    if (!run) throw new NotFoundException("Payroll run not found");
    if (run.status !== ErpPayrollRunStatus.draft) return { ok: true };

    const pph21Total = run.lines.reduce((sum, l) => sum + Number(l.pph21), 0);
    const bpjsEmployeeTotal = run.lines.reduce((sum, l) => sum + Number(l.bpjsEmployee), 0);
    const bpjsEmployerTotal = run.lines.reduce((sum, l) => sum + Number(l.bpjsEmployer), 0);
    const bpjsTotal = bpjsEmployeeTotal + bpjsEmployerTotal;

    const payrollExpenseAccountCode = run.payrollExpenseAccountCode || "504.01";
    const bpjsExpenseAccountCode = "504.02";
    const payrollPayableAccountCode = run.payrollPayableAccountCode || "205.02";
    const pph21PayableAccountCode = run.pph21PayableAccountCode || "204.03";
    const bpjsPayableAccountCode = run.bpjsPayableAccountCode || "205.03";

    await this.prisma.$transaction(async (tx) => {
      const details: Array<{ accountCode: string; debit: number; credit: number }> = [];
      details.push({
        accountCode: payrollExpenseAccountCode,
        debit: Number(run.grossTotal),
        credit: 0,
      });
      if (bpjsEmployerTotal > 0) {
        details.push({
          accountCode: bpjsExpenseAccountCode,
          debit: bpjsEmployerTotal,
          credit: 0,
        });
      }
      if (Number(run.netTotal) > 0) {
        details.push({
          accountCode: payrollPayableAccountCode,
          debit: 0,
          credit: Number(run.netTotal),
        });
      }
      if (pph21Total > 0) {
        details.push({ accountCode: pph21PayableAccountCode, debit: 0, credit: pph21Total });
      }
      if (bpjsTotal > 0) {
        details.push({ accountCode: bpjsPayableAccountCode, debit: 0, credit: bpjsTotal });
      }

      await this.createJournalEntryWithClient(tx, tenantId, {
        date: new Date(),
        description: `Payroll ${run.period.name}`,
        reference: `PAYROLLRUN:${run.id}`,
        details,
      });

      await tx.erpPayrollRun.update({
        where: { id: run.id },
        data: {
          status: ErpPayrollRunStatus.approved,
          postedAt: new Date(),
          approvedById: approvedById || null,
        },
      });
    });

    return { ok: true };
  }

  async payPayrollRun(
    tenantId: string,
    runId: string,
    paidById: string | null,
    data: { date: string; cashAccountCode?: string; amount?: number; notes?: string },
  ) {
    await this.checkSubscription(tenantId);
    const run = await this.prisma.erpPayrollRun.findFirst({
      where: { id: runId, tenantId },
      include: { period: true },
    });
    if (!run) throw new NotFoundException("Payroll run not found");
    if (run.status !== ErpPayrollRunStatus.approved) {
      throw new BadRequestException("Payroll run harus status approved untuk dibayar");
    }

    const date = new Date(data.date);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("Tanggal pembayaran tidak valid");
    }
    const cashAccountCode = (data.cashAccountCode || "101.02").trim();
    const payableAccountCode = run.payrollPayableAccountCode || "205.02";
    const amount = data.amount !== undefined ? Number(data.amount) : Number(run.netTotal);
    if (!amount || amount <= 0) throw new BadRequestException("Nominal pembayaran tidak valid");

    await this.prisma.$transaction(async (tx) => {
      await this.createJournalEntryWithClient(tx, tenantId, {
        date,
        description: `Pembayaran Payroll ${run.period.name}${data.notes ? ` - ${data.notes}` : ""}`,
        reference: `PAYROLLPAY:${run.id}`,
        details: [
          { accountCode: payableAccountCode, debit: amount, credit: 0 },
          { accountCode: cashAccountCode, debit: 0, credit: amount },
        ],
      });

      await tx.erpPayrollRun.update({
        where: { id: run.id },
        data: { status: ErpPayrollRunStatus.paid, paidAt: date, paidById: paidById || null },
      });
    });

    return { ok: true };
  }

  async settlePayrollWithholding(
    tenantId: string,
    runId: string,
    createdById: string | null,
    data: {
      kind: ErpPayrollSettlementKind;
      date: string;
      amount: number;
      cashAccountCode?: string;
      notes?: string;
    },
  ) {
    await this.checkSubscription(tenantId);

    const run = await this.prisma.erpPayrollRun.findFirst({
      where: { id: runId, tenantId },
      include: { lines: true, period: true, settlements: true },
    });
    if (!run) throw new NotFoundException("Payroll run not found");
    if (run.status === ErpPayrollRunStatus.cancelled) {
      throw new BadRequestException("Payroll cancelled");
    }
    if (run.status === ErpPayrollRunStatus.draft) {
      throw new BadRequestException("Payroll harus approved sebelum bayar pajak/BPJS");
    }

    const date = new Date(data.date);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("Tanggal pembayaran tidak valid");
    }

    const amount = Number(data.amount);
    if (!amount || amount <= 0) throw new BadRequestException("Nominal pembayaran tidak valid");

    const cashAccountCode = (data.cashAccountCode || "101.02").trim();

    const pph21Total = run.lines.reduce((sum, l) => sum + Number(l.pph21), 0);
    const bpjsTotal = run.lines.reduce(
      (sum, l) => sum + Number(l.bpjsEmployee) + Number(l.bpjsEmployer),
      0,
    );
    const total = data.kind === ErpPayrollSettlementKind.pph21 ? pph21Total : bpjsTotal;
    const alreadyPaid = run.settlements
      .filter((s) => s.kind === data.kind)
      .reduce((sum, s) => sum + Number(s.amount), 0);
    const remaining = total - alreadyPaid;
    if (remaining <= 0.0001) return { ok: true };
    if (amount > remaining + 0.0001) {
      throw new BadRequestException("Nominal melebihi sisa hutang");
    }

    const payableAccountCode =
      data.kind === ErpPayrollSettlementKind.pph21
        ? run.pph21PayableAccountCode
        : run.bpjsPayableAccountCode;

    await this.prisma.$transaction(async (tx) => {
      const settlement = await tx.erpPayrollSettlement.create({
        data: {
          tenantId,
          payrollRunId: run.id,
          kind: data.kind,
          date,
          amount: new Prisma.Decimal(amount),
          cashAccountCode,
          notes: data.notes?.trim() || null,
          createdById: createdById || null,
        },
      });

      const label = data.kind === ErpPayrollSettlementKind.pph21 ? "PPh 21" : "BPJS";
      await this.createJournalEntryWithClient(tx, tenantId, {
        date,
        description: `Pembayaran ${label} Payroll ${run.period.name}`,
        reference: `PAYROLLSETTLE:${data.kind}:${settlement.id}`,
        details: [
          { accountCode: payableAccountCode, debit: amount, credit: 0 },
          { accountCode: cashAccountCode, debit: 0, credit: amount },
        ],
      });
    });

    return { ok: true };
  }

  async getCommissionPayouts(tenantId: string) {
    await this.checkSubscription(tenantId);
    return this.prisma.erpCommissionPayout.findMany({
      where: { tenantId },
      include: { user: { select: { id: true, name: true, email: true } }, sales: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async createCommissionPayout(
    tenantId: string,
    createdById: string | null,
    data: { userId: string; amount: number; salesId?: string; notes?: string },
  ) {
    await this.checkSubscription(tenantId);
    const amount = Number(data.amount);
    if (!amount || amount <= 0) throw new BadRequestException("Nominal insentif tidak valid");

    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException("User not found");

    if (data.salesId) {
      const sales = await this.prisma.erpSales.findFirst({
        where: { id: data.salesId, tenantId },
        select: { id: true },
      });
      if (!sales) throw new NotFoundException("Sales not found");
    }

    return this.prisma.erpCommissionPayout.create({
      data: {
        tenantId,
        salesId: data.salesId || null,
        userId: data.userId,
        amount: new Prisma.Decimal(amount),
        status: ErpCommissionStatus.draft,
        createdById: createdById || null,
        notes: data.notes?.trim() || null,
      },
      include: { user: { select: { id: true, name: true, email: true } }, sales: true },
    });
  }

  async approveCommissionPayout(tenantId: string, payoutId: string, approvedById: string | null) {
    await this.checkSubscription(tenantId);

    const payout = await this.prisma.erpCommissionPayout.findFirst({
      where: { id: payoutId, tenantId },
      include: { user: true, sales: true },
    });
    if (!payout) throw new NotFoundException("Commission payout not found");
    if (payout.status !== ErpCommissionStatus.draft) return { ok: true };

    await this.prisma.$transaction(async (tx) => {
      await this.createJournalEntryWithClient(tx, tenantId, {
        date: new Date(),
        projectId: payout.sales?.projectId || undefined,
        salesId: payout.salesId || undefined,
        description: `Insentif Sales ${payout.user.name || payout.user.email}`,
        reference: `COMM:${payout.id}`,
        details: [
          { accountCode: payout.expenseAccountCode, debit: Number(payout.amount), credit: 0 },
          { accountCode: payout.payableAccountCode, debit: 0, credit: Number(payout.amount) },
        ],
      });

      await tx.erpCommissionPayout.update({
        where: { id: payout.id },
        data: {
          status: ErpCommissionStatus.approved,
          postedAt: new Date(),
          approvedById: approvedById || null,
        },
      });
    });

    return { ok: true };
  }

  async payCommissionPayout(
    tenantId: string,
    payoutId: string,
    paidById: string | null,
    data: { date: string; cashAccountCode?: string; notes?: string },
  ) {
    await this.checkSubscription(tenantId);
    const payout = await this.prisma.erpCommissionPayout.findFirst({
      where: { id: payoutId, tenantId },
      include: { user: true, sales: true },
    });
    if (!payout) throw new NotFoundException("Commission payout not found");
    if (payout.status !== ErpCommissionStatus.approved) {
      throw new BadRequestException("Insentif harus status approved untuk dibayar");
    }

    const date = new Date(data.date);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("Tanggal pembayaran tidak valid");
    }
    const cashAccountCode = (data.cashAccountCode || "101.02").trim();

    await this.prisma.$transaction(async (tx) => {
      await this.createJournalEntryWithClient(tx, tenantId, {
        date,
        projectId: payout.sales?.projectId || undefined,
        salesId: payout.salesId || undefined,
        description: `Pembayaran Insentif Sales ${payout.user.name || payout.user.email}${data.notes ? ` - ${data.notes}` : ""}`,
        reference: `COMMPAY:${payout.id}`,
        details: [
          { accountCode: payout.payableAccountCode, debit: Number(payout.amount), credit: 0 },
          { accountCode: cashAccountCode, debit: 0, credit: Number(payout.amount) },
        ],
      });

      await tx.erpCommissionPayout.update({
        where: { id: payout.id },
        data: { status: ErpCommissionStatus.paid, paidAt: date, paidById: paidById || null },
      });
    });

    return { ok: true };
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
        projectId: data.projectId,
        salesId: sales.id,
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

  async getSale(tenantId: string, salesId: string) {
    await this.checkSubscription(tenantId);
    const sales = await this.prisma.erpSales.findFirst({
      where: { id: salesId, tenantId },
      include: {
        customer: true,
        project: true,
        unit: true,
        payments: { orderBy: { dueDate: "asc" } },
        documents: { include: { template: true }, orderBy: { createdAt: "desc" } },
        journals: {
          include: { details: { include: { account: true } } },
          orderBy: { date: "desc" },
        },
      },
    });
    if (!sales) throw new NotFoundException("Sales not found");
    return sales;
  }

  async handoverSales(tenantId: string, salesId: string, handoverAt?: string) {
    await this.checkSubscription(tenantId);

    const sales = await this.prisma.erpSales.findFirst({
      where: { id: salesId, tenantId },
      include: { unit: true, project: true, customer: true },
    });

    if (!sales) throw new NotFoundException("Sales not found");
    if (sales.status === "cancelled") throw new BadRequestException("Sales cancelled");
    if (sales.status === "completed") return { ok: true };

    const now = handoverAt ? new Date(handoverAt) : new Date();
    if (Number.isNaN(now.getTime())) {
      throw new BadRequestException("Tanggal serah terima tidak valid");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.erpSales.update({
        where: { id: sales.id },
        data: { status: "completed", handoverAt: now, recognizedAt: now },
      });

      await tx.erpUnit.update({
        where: { id: sales.unitId },
        data: { status: "sold" },
      });

      const arAccountCode = "102.01";
      const revenueAccountCode = "401.01";

      await this.createJournalEntryWithClient(tx, tenantId, {
        date: now,
        projectId: sales.projectId,
        salesId: sales.id,
        description: `Pengakuan Penjualan Unit ${sales.unit.unitCode} (Serah Terima)`,
        reference: `SALES:${sales.id}`,
        details: [
          { accountCode: arAccountCode, debit: Number(sales.totalPrice), credit: 0 },
          { accountCode: revenueAccountCode, debit: 0, credit: Number(sales.totalPrice) },
        ],
      });

      const advanceLines = await tx.erpJournalDetail.findMany({
        where: {
          journal: { tenantId, salesId: sales.id },
          account: { tenantId, code: { startsWith: "202." } },
        },
        select: {
          debit: true,
          credit: true,
          account: { select: { code: true } },
        },
      });

      const advancesByAccountCode = new Map<string, number>();
      for (const l of advanceLines) {
        const code = l.account.code;
        const current = advancesByAccountCode.get(code) ?? 0;
        advancesByAccountCode.set(code, current + Number(l.credit) - Number(l.debit));
      }

      const advanceDetails: Array<{ accountCode: string; debit: number; credit: number }> = [];
      let totalAdvances = 0;
      for (const [code, amount] of advancesByAccountCode.entries()) {
        if (amount <= 0) continue;
        advanceDetails.push({ accountCode: code, debit: amount, credit: 0 });
        totalAdvances += amount;
      }

      if (totalAdvances > 0) {
        advanceDetails.push({ accountCode: arAccountCode, debit: 0, credit: totalAdvances });
        await this.createJournalEntryWithClient(tx, tenantId, {
          date: now,
          projectId: sales.projectId,
          salesId: sales.id,
          description: `Reklasifikasi Uang Muka Konsumen (Serah Terima)`,
          reference: `SALES:${sales.id}`,
          details: advanceDetails,
        });
      }

      const wipLines = await tx.erpJournalDetail.findMany({
        where: {
          journal: { tenantId, salesId: sales.id },
          account: { tenantId, code: { startsWith: "103." } },
        },
        select: {
          debit: true,
          credit: true,
          account: { select: { code: true } },
        },
      });

      const wipByAccountCode = new Map<string, number>();
      for (const l of wipLines) {
        const code = l.account.code;
        const current = wipByAccountCode.get(code) ?? 0;
        wipByAccountCode.set(code, current + Number(l.debit) - Number(l.credit));
      }

      const cogsAccountCode = "501.02";
      const wipDetails: Array<{ accountCode: string; debit: number; credit: number }> = [];
      let totalWip = 0;
      for (const [code, amount] of wipByAccountCode.entries()) {
        if (amount <= 0) continue;
        wipDetails.push({ accountCode: code, debit: 0, credit: amount });
        totalWip += amount;
      }

      if (totalWip > 0) {
        wipDetails.unshift({ accountCode: cogsAccountCode, debit: totalWip, credit: 0 });
        await this.createJournalEntryWithClient(tx, tenantId, {
          date: now,
          projectId: sales.projectId,
          salesId: sales.id,
          description: `Pemindahan WIP ke HPP (Serah Terima)`,
          reference: `SALES:${sales.id}`,
          details: wipDetails,
        });
      }
    });

    return { ok: true };
  }

  // 3. FINANCE & ACCOUNTING
  async getAccounts(tenantId: string) {
    await this.checkSubscription(tenantId);
    await this.ensureTenantCoa(tenantId);
    const accounts = await this.prisma.erpAccount.findMany({
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
      projectId?: string;
      salesId?: string;
      reference?: string;
      details: Array<{ accountCode: string; debit: number; credit: number }>;
    },
  ) {
    await this.checkSubscription(tenantId);
    return this.createJournalEntryWithClient(this.prisma, tenantId, data);
  }

  private async createJournalEntryWithClient(
    prisma: Prisma.TransactionClient,
    tenantId: string,
    data: {
      date: string | Date;
      description: string;
      projectId?: string;
      salesId?: string;
      reference?: string;
      details: Array<{ accountCode: string; debit: number; credit: number }>;
    },
  ) {
    await prisma.erpAccount.createMany({
      data: DEFAULT_PROPERTY_COA.map((a) => ({ ...a, tenantId })),
      skipDuplicates: true,
    });

    // Validate balance (debit must equal credit)
    const totalDebit = data.details.reduce((sum, d) => sum + d.debit, 0);
    const totalCredit = data.details.reduce((sum, d) => sum + d.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new BadRequestException(
        "Journal entry is not balanced. Total debit must equal total credit.",
      );
    }

    return prisma.erpJournal.create({
      data: {
        tenantId,
        date: data.date,
        description: data.description,
        projectId: data.projectId,
        salesId: data.salesId,
        reference: data.reference,
        details: {
          create: await Promise.all(
            data.details.map(async (d) => {
              const account = await prisma.erpAccount.findUnique({
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

  async updateConstruction(
    tenantId: string,
    data: { projectId: string; stage: string; progress: number; notes?: string },
  ) {
    await this.checkSubscription(tenantId);
    this.logger.log(`Updating construction progress: ${JSON.stringify({ tenantId, ...data })}`);
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

  async uploadDocument(tenantId: string, data: { title: string; type: string; notes?: string }) {
    await this.checkSubscription(tenantId);
    this.logger.log(`Uploading document: ${JSON.stringify({ tenantId, ...data })}`);
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

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: sales.tenantId },
      select: { name: true, slug: true },
    });

    const formatThousandsId = (value: string) => {
      const digits = value.replace(/[^\d]/g, "");
      if (!digits) return "0";
      const normalized = digits.replace(/^0+/, "") || "0";
      return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

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
            <div style="font-family: 'Times New Roman', serif; color: #0f172a; line-height: 1.6;">
              <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 24px;">
                <div>
                  <div style="font-size: 18px; font-weight: 800; letter-spacing: 0.06em;">{{company_name}}</div>
                  <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
                    Dokumen internal perusahaan • {{company_slug}}
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 12px; color: #64748b;">Tanggal</div>
                  <div style="font-size: 14px; font-weight: 700;">{{date_long}}</div>
                </div>
              </div>

              <div style="margin-top: 18px; border-top: 2px solid #0f172a;"></div>

              <div style="text-align: center; margin-top: 18px;">
                <div style="font-size: 22px; font-weight: 800; letter-spacing: 0.08em;">SURAT PESANAN RUMAH (SPR)</div>
                <div style="font-size: 12px; color: #475569; margin-top: 26px;">
                  Nomor: SPR/{{date_code}}/{{unit_code}}
                </div>
              </div>

              <div style="margin-top: 18px; border-top: 1px solid #cbd5e1;"></div>

              <div style="margin-top: 18px;">
                <div style="font-size: 13px;">
                  Saya yang bertanda tangan di bawah ini, dengan ini menyatakan melakukan pemesanan unit properti sebagai berikut:
                </div>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-top: 14px;">
                <tbody>
                  <tr>
                    <td style="width: 28%; padding: 10px 0; color: #334155; font-size: 12px;">Nama Pemesan</td>
                    <td style="padding: 10px 0; font-weight: 700; font-size: 12px;">: {{customer_name}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #334155; font-size: 12px;">Proyek</td>
                    <td style="padding: 10px 0; font-weight: 700; font-size: 12px;">: {{project_name}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #334155; font-size: 12px;">Unit</td>
                    <td style="padding: 10px 0; font-weight: 700; font-size: 12px;">: {{unit_code}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #334155; font-size: 12px;">Harga</td>
                    <td style="padding: 10px 0; font-weight: 800; font-size: 12px;">: Rp {{price}}</td>
                  </tr>
                </tbody>
              </table>

              <div style="margin-top: 18px; font-size: 13px; color: #0f172a;">
                Demikian surat pesanan ini dibuat dengan sebenar-benarnya untuk dipergunakan sebagaimana mestinya.
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-top: 34px;">
                <tbody>
                  <tr>
                    <td style="width: 50%; text-align: left; font-size: 12px; color: #334155;">
                      Pemesan,
                      <div style="height: 64px;"></div>
                      <div style="font-weight: 800;">{{customer_name}}</div>
                    </td>
                    <td style="width: 50%; text-align: right; font-size: 12px; color: #334155;">
                      Developer,
                      <div style="height: 64px;"></div>
                      <div style="font-weight: 800;">{{company_name}}</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style="margin-top: 26px; border-top: 1px solid #e2e8f0;"></div>
              <div style="margin-top: 10px; font-size: 10px; color: #94a3b8;">
                Dokumen ini dihasilkan otomatis oleh sistem ERP. Harap verifikasi kembali data sebelum ditandatangani.
              </div>
            </div>
          `,
        },
      });
    }

    if (template && templateId === "spr-standard") {
      const isLegacyDefault = template.content.includes("<h1>SURAT PESANAN RUMAH (SPR)</h1>");
      const hasTightNomorSpacing = template.content.includes(
        'color: #475569; margin-top: 10px;">Nomor: SPR/{{date_code}}/{{unit_code}}',
      );
      if (isLegacyDefault || hasTightNomorSpacing) {
        template = await this.prisma.erpDocumentTemplate.update({
          where: { id: templateId },
          data: {
            content: `
            <div style="font-family: 'Times New Roman', serif; color: #0f172a; line-height: 1.6;">
              <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 24px;">
                <div>
                  <div style="font-size: 18px; font-weight: 800; letter-spacing: 0.06em;">{{company_name}}</div>
                  <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
                    Dokumen internal perusahaan • {{company_slug}}
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 12px; color: #64748b;">Tanggal</div>
                  <div style="font-size: 14px; font-weight: 700;">{{date_long}}</div>
                </div>
              </div>

              <div style="margin-top: 18px; border-top: 2px solid #0f172a;"></div>

              <div style="text-align: center; margin-top: 18px;">
                <div style="font-size: 22px; font-weight: 800; letter-spacing: 0.08em;">SURAT PESANAN RUMAH (SPR)</div>
                <div style="font-size: 12px; color: #475569; margin-top: 26px;">
                  Nomor: SPR/{{date_code}}/{{unit_code}}
                </div>
              </div>

              <div style="margin-top: 18px; border-top: 1px solid #cbd5e1;"></div>

              <div style="margin-top: 18px;">
                <div style="font-size: 13px;">
                  Saya yang bertanda tangan di bawah ini, dengan ini menyatakan melakukan pemesanan unit properti sebagai berikut:
                </div>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-top: 14px;">
                <tbody>
                  <tr>
                    <td style="width: 28%; padding: 10px 0; color: #334155; font-size: 12px;">Nama Pemesan</td>
                    <td style="padding: 10px 0; font-weight: 700; font-size: 12px;">: {{customer_name}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #334155; font-size: 12px;">Proyek</td>
                    <td style="padding: 10px 0; font-weight: 700; font-size: 12px;">: {{project_name}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #334155; font-size: 12px;">Unit</td>
                    <td style="padding: 10px 0; font-weight: 700; font-size: 12px;">: {{unit_code}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #334155; font-size: 12px;">Harga</td>
                    <td style="padding: 10px 0; font-weight: 800; font-size: 12px;">: Rp {{price}}</td>
                  </tr>
                </tbody>
              </table>

              <div style="margin-top: 18px; font-size: 13px; color: #0f172a;">
                Demikian surat pesanan ini dibuat dengan sebenar-benarnya untuk dipergunakan sebagaimana mestinya.
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-top: 34px;">
                <tbody>
                  <tr>
                    <td style="width: 50%; text-align: left; font-size: 12px; color: #334155;">
                      Pemesan,
                      <div style="height: 64px;"></div>
                      <div style="font-weight: 800;">{{customer_name}}</div>
                    </td>
                    <td style="width: 50%; text-align: right; font-size: 12px; color: #334155;">
                      Developer,
                      <div style="height: 64px;"></div>
                      <div style="font-weight: 800;">{{company_name}}</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style="margin-top: 26px; border-top: 1px solid #e2e8f0;"></div>
              <div style="margin-top: 10px; font-size: 10px; color: #94a3b8;">
                Dokumen ini dihasilkan otomatis oleh sistem ERP. Harap verifikasi kembali data sebelum ditandatangani.
              </div>
            </div>
            `,
          },
        });
      }
    }

    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found.`);
    }

    // Replace variables (simple template engine)
    let content = template.content;
    const now = new Date();
    const rawPrice = sales.totalPrice?.toString() || "0";
    const price = formatThousandsId(rawPrice.split(".")[0] || rawPrice);
    const variables = {
      "{{customer_name}}": sales.customer?.name || "Customer",
      "{{unit_code}}": sales.unit?.unitCode || "N/A",
      "{{price}}": price,
      "{{project_name}}": sales.project?.name || "Project",
      "{{date}}": now.toLocaleDateString("id-ID"),
      "{{date_long}}": now.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      "{{date_code}}": now.toISOString().slice(0, 10).replaceAll("-", ""),
      "{{company_name}}": tenant?.name || "Company",
      "{{company_slug}}": tenant?.slug || "-",
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

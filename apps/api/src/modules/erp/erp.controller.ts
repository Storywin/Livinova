import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
  Delete,
} from "@nestjs/common";
import type { Prisma, SubscriptionStatus } from "@prisma/client";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/roles.decorator";

import { ErpService } from "./erp.service";

type RequestWithContext = {
  user: { id: string };
  tenant: { id: string };
};

@Controller("api/erp")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ErpController {
  constructor(private readonly erpService: ErpService) {}

  // --- Super Admin Management ---
  @Get("admin/stats")
  @Roles("super_admin", "admin")
  async getGlobalStats() {
    return this.erpService.getGlobalStats();
  }

  @Get("admin/partners")
  @Roles("super_admin", "admin")
  async getAllPartners() {
    return this.erpService.getAllPartners();
  }

  @Get("admin/tenants")
  @Roles("super_admin", "admin")
  async getAllTenants() {
    return this.erpService.getAllTenants();
  }

  @Get("admin/licenses")
  @Roles("super_admin", "admin")
  async getAllLicenses() {
    return this.erpService.getAllLicensesDetailed();
  }

  @Post("admin/licenses")
  @Roles("super_admin", "admin")
  async createLicense(
    @Body()
    body: {
      tenantId: string;
      userId: string;
      durationDays: number;
      deviceName?: string;
    },
  ) {
    return this.erpService.createLicense(body);
  }

  @Post("admin/partners")
  @Roles("super_admin", "admin")
  async createPartner(@Body() body: { name: string; email: string; phone?: string }) {
    return this.erpService.createPartner(body);
  }

  @Patch("admin/partners/:id")
  @Roles("super_admin", "admin")
  async updatePartner(
    @Param("id") id: string,
    @Body() body: { name?: string; email?: string; phone?: string },
  ) {
    return this.erpService.updatePartner(id, body);
  }

  @Delete("admin/partners/:id")
  @Roles("super_admin", "admin")
  async deletePartner(@Param("id") id: string) {
    return this.erpService.deletePartner(id);
  }

  @Post("admin/tenants")
  @Roles("super_admin", "admin")
  async createTenantByAdmin(@Body() body: { name: string; slug: string; email: string }) {
    return this.erpService.createTenantByAdmin(body);
  }

  @Patch("admin/tenants/:id/status")
  @Roles("super_admin", "admin")
  async updateTenantStatusByAdmin(
    @Param("id") id: string,
    @Body() body: { status: SubscriptionStatus },
  ) {
    return this.erpService.updateTenantStatus(id, body.status);
  }

  @Get("admin/pricing")
  @Roles("super_admin", "admin")
  async getPricingPlans() {
    return this.erpService.getPricingPlans();
  }

  @Post("admin/pricing")
  @Roles("super_admin", "admin")
  async createPricingPlan(
    @Body()
    body: {
      name: string;
      description?: string;
      durationDays: number;
      price: number;
    },
  ) {
    return this.erpService.createPricingPlan(body);
  }

  @Patch("admin/licenses/:id/extend")
  @Roles("super_admin", "admin")
  async extendLicense(@Param("id") id: string, @Body() body: { durationDays: number }) {
    return this.erpService.extendLicense(id, body.durationDays);
  }

  // --- Partner Management ---
  @Get("partner/stats")
  @Roles("partner")
  async getPartnerStats(@Request() req: RequestWithContext) {
    const user = await this.erpService.getUserWithPartner(req.user.id);
    return this.erpService.getPartnerStats(user.partnerId);
  }

  @Post("partner/tenants")
  @Roles("partner")
  async createTenant(
    @Request() req: RequestWithContext,
    @Body() body: { name: string; slug: string; email: string },
  ) {
    const user = await this.erpService.getUserWithPartner(req.user.id);
    return this.erpService.createTenant(user.partnerId, body);
  }

  @Patch("partner/tenants/:id/status")
  @Roles("partner")
  async updateTenantStatusByPartner(
    @Param("id") id: string,
    @Body() body: { status: SubscriptionStatus },
  ) {
    return this.erpService.updateTenantStatusByPartner(id, body.status);
  }

  @Post("partner/orders")
  @Roles("partner")
  async submitOrder(
    @Request() req: RequestWithContext,
    @Body() body: { quantity: number; notes: string },
  ) {
    const user = await this.erpService.getUserWithPartner(req.user.id);
    return this.erpService.submitOrder(user.partnerId, body);
  }

  @Get("partner/pricing")
  @Roles("partner")
  async getPartnerPricingPlans(@Request() req: RequestWithContext) {
    const user = await this.erpService.getUserWithPartner(req.user.id);
    return this.erpService.getPartnerPricingPlans(user.partnerId);
  }

  @Post("partner/pricing")
  @Roles("partner")
  async createPartnerPricingPlan(
    @Request() req: RequestWithContext,
    @Body() body: { name: string; description?: string; durationDays: number; price: number },
  ) {
    const user = await this.erpService.getUserWithPartner(req.user.id);
    return this.erpService.createPartnerPricingPlan(user.partnerId, body);
  }

  @Delete("partner/pricing/:id")
  @Roles("partner")
  async deletePartnerPricingPlan(@Request() req: RequestWithContext, @Param("id") id: string) {
    const user = await this.erpService.getUserWithPartner(req.user.id);
    return this.erpService.deletePartnerPricingPlan(user.partnerId, id);
  }

  @Patch("partner/profile")
  @Roles("partner")
  async updatePartnerProfile(
    @Request() req: RequestWithContext,
    @Body() body: { name?: string; email?: string; phone?: string },
  ) {
    const user = await this.erpService.getUserWithPartner(req.user.id);
    return this.erpService.updatePartnerProfile(user.partnerId, body);
  }

  @Get("partner/invoices")
  @Roles("partner")
  async getPartnerInvoices(@Request() req: RequestWithContext) {
    const user = await this.erpService.getUserWithPartner(req.user.id);
    return this.erpService.getPartnerInvoices(user.partnerId);
  }

  @Post("partner/generate-license")
  @Roles("partner")
  async generateLicenseByPartner(
    @Request() req: RequestWithContext,
    @Body() body: { tenantId: string; planId: string },
  ) {
    const user = await this.erpService.getUserWithPartner(req.user.id);
    return this.erpService.generateLicenseByPartner(user.partnerId, body);
  }

  @Post("partner/purchase-quota")
  @Roles("partner")
  async purchasePartnerQuota(@Request() req: RequestWithContext, @Body() body: { amount: number }) {
    const user = await this.erpService.getUserWithPartner(req.user.id);
    return this.erpService.purchasePartnerQuota(user.partnerId, body.amount);
  }

  @Get("partner/quota")
  @Roles("partner")
  async getPartnerLicenseQuota(@Request() req: RequestWithContext) {
    const user = await this.erpService.getUserWithPartner(req.user.id);
    return this.erpService.getPartnerLicenseQuota(user.partnerId);
  }

  // --- Tenant/Developer Management ---
  @Get("tenant/stats")
  @Roles("tenant_admin", "erp_user")
  async getTenantStats(@Request() req: RequestWithContext) {
    return this.erpService.getTenantStats(req.tenant.id);
  }

  @Get("tenant/inventory")
  @Roles("tenant_admin", "erp_user")
  async getInventory(@Request() req: RequestWithContext) {
    return this.erpService.getInventory(req.tenant.id);
  }

  // --- Projects ---
  @Get("projects")
  @Roles("erp_user", "tenant_admin")
  async getProjects(@Request() req: RequestWithContext) {
    return this.erpService.getProjects(req.tenant.id);
  }

  @Post("projects")
  @Roles("tenant_admin")
  async createProject(
    @Request() req: RequestWithContext,
    @Body() body: Prisma.ErpProjectCreateInput,
  ) {
    return this.erpService.createProject(req.tenant.id, body);
  }

  @Post("projects/:projectId/units")
  @Roles("tenant_admin")
  async createUnit(
    @Param("projectId") projectId: string,
    @Body() body: Prisma.ErpUnitCreateWithoutProjectInput,
  ) {
    return this.erpService.createUnit(projectId, body);
  }

  // --- Customers ---
  @Get("customers")
  @Roles("erp_user", "tenant_admin")
  async getCustomers(@Request() req: RequestWithContext) {
    return this.erpService.getCustomers(req.tenant.id);
  }

  @Post("customers")
  @Roles("erp_user", "tenant_admin")
  async createCustomer(
    @Request() req: RequestWithContext,
    @Body() body: Prisma.ErpCustomerCreateInput,
  ) {
    return this.erpService.createCustomer(req.tenant.id, body);
  }

  // --- Sales ---
  @Post("sales")
  @Roles("erp_user", "tenant_admin")
  async createSales(
    @Request() req: RequestWithContext,
    @Body() body: { projectId: string; unitId: string; customerId: string; totalPrice: number },
  ) {
    return this.erpService.createSales(req.tenant.id, body);
  }

  // --- Accounting ---
  @Get("accounts")
  @Roles("tenant_admin")
  async getAccounts(@Request() req: RequestWithContext) {
    return this.erpService.getAccounts(req.tenant.id);
  }

  @Get("tenant/subscription")
  @Roles("tenant_admin")
  async getTenantSubscription(@Request() req: RequestWithContext) {
    return this.erpService.getTenantSubscription(req.tenant.id);
  }

  @Get("tenant/pricing")
  @Roles("tenant_admin")
  async getTenantPricingPlans(@Request() req: RequestWithContext) {
    return this.erpService.getTenantPricingPlans(req.tenant.id);
  }

  @Post("tenant/renew")
  @Roles("tenant_admin")
  async renewLicense(@Request() req: RequestWithContext, @Body() body: { planId: string }) {
    return this.erpService.renewLicense(req.tenant.id, req.user.id, body.planId);
  }
}

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
  BadRequestException,
} from "@nestjs/common";
import type {
  ErpEmployeeStatus,
  ErpLeadActivityType,
  ErpLeadStatus,
  ErpPayrollSettlementKind,
  Prisma,
  SubscriptionStatus,
} from "@prisma/client";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/roles.decorator";

import { ErpService } from "./erp.service";

type RequestWithContext = {
  user: unknown;
  tenant?: { id: string } | null;
};

function extractUserId(user: unknown): string | null {
  if (user && typeof user === "object") {
    const u = user as Record<string, unknown>;
    return (u.id as string) ?? (u.userId as string) ?? (u.sub as string) ?? null;
  }
  return null;
}

function requireTenantId(req: RequestWithContext): string {
  const tenantId = req.tenant?.id;
  if (!tenantId) throw new BadRequestException("Tenant context tidak ditemukan");
  return tenantId;
}

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
    const userId = extractUserId(req.user) || undefined;
    if (!userId) throw new BadRequestException("User ID tidak valid");
    const user = await this.erpService.getUserWithPartner(userId);
    return this.erpService.getPartnerStats(user.partnerId);
  }

  @Post("partner/tenants")
  @Roles("partner")
  async createTenant(
    @Request() req: RequestWithContext,
    @Body() body: { name: string; slug: string; email: string },
  ) {
    const userId = extractUserId(req.user) || undefined;
    if (!userId) throw new BadRequestException("User ID tidak valid");
    const user = await this.erpService.getUserWithPartner(userId);
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
    const userId = extractUserId(req.user) || undefined;
    if (!userId) throw new BadRequestException("User ID tidak valid");
    const user = await this.erpService.getUserWithPartner(userId);
    return this.erpService.submitOrder(user.partnerId, body);
  }

  @Get("partner/pricing")
  @Roles("partner")
  async getPartnerPricingPlans(@Request() req: RequestWithContext) {
    const userId = extractUserId(req.user) || undefined;
    if (!userId) throw new BadRequestException("User ID tidak valid");
    const user = await this.erpService.getUserWithPartner(userId);
    return this.erpService.getPartnerPricingPlans(user.partnerId);
  }

  @Post("partner/pricing")
  @Roles("partner")
  async createPartnerPricingPlan(
    @Request() req: RequestWithContext,
    @Body() body: { name: string; description?: string; durationDays: number; price: number },
  ) {
    const userId = extractUserId(req.user) || undefined;
    if (!userId) throw new BadRequestException("User ID tidak valid");
    const user = await this.erpService.getUserWithPartner(userId);
    return this.erpService.createPartnerPricingPlan(user.partnerId, body);
  }

  @Delete("partner/pricing/:id")
  @Roles("partner")
  async deletePartnerPricingPlan(@Request() req: RequestWithContext, @Param("id") id: string) {
    const userId = extractUserId(req.user) || undefined;
    if (!userId) throw new BadRequestException("User ID tidak valid");
    const user = await this.erpService.getUserWithPartner(userId);
    return this.erpService.deletePartnerPricingPlan(user.partnerId, id);
  }

  @Patch("partner/profile")
  @Roles("partner")
  async updatePartnerProfile(
    @Request() req: RequestWithContext,
    @Body() body: { name?: string; email?: string; phone?: string },
  ) {
    const userId = extractUserId(req.user) || undefined;
    if (!userId) throw new BadRequestException("User ID tidak valid");
    const user = await this.erpService.getUserWithPartner(userId);
    return this.erpService.updatePartnerProfile(user.partnerId, body);
  }

  @Get("partner/invoices")
  @Roles("partner")
  async getPartnerInvoices(@Request() req: RequestWithContext) {
    const userId = extractUserId(req.user) || undefined;
    if (!userId) throw new BadRequestException("User ID tidak valid");
    const user = await this.erpService.getUserWithPartner(userId);
    return this.erpService.getPartnerInvoices(user.partnerId);
  }

  @Post("partner/generate-license")
  @Roles("partner")
  async generateLicenseByPartner(
    @Request() req: RequestWithContext,
    @Body() body: { tenantId: string; planId: string },
  ) {
    const userId = extractUserId(req.user) || undefined;
    if (!userId) throw new BadRequestException("User ID tidak valid");
    const user = await this.erpService.getUserWithPartner(userId);
    return this.erpService.generateLicenseByPartner(user.partnerId, body);
  }

  @Post("partner/purchase-quota")
  @Roles("partner")
  async purchasePartnerQuota(@Request() req: RequestWithContext, @Body() body: { amount: number }) {
    const userId = extractUserId(req.user) || undefined;
    if (!userId) throw new BadRequestException("User ID tidak valid");
    const user = await this.erpService.getUserWithPartner(userId);
    return this.erpService.purchasePartnerQuota(user.partnerId, body.amount);
  }

  @Get("partner/quota")
  @Roles("partner")
  async getPartnerLicenseQuota(@Request() req: RequestWithContext) {
    const userId = extractUserId(req.user) || undefined;
    if (!userId) throw new BadRequestException("User ID tidak valid");
    const user = await this.erpService.getUserWithPartner(userId);
    return this.erpService.getPartnerLicenseQuota(user.partnerId);
  }

  // --- Tenant/Developer Management ---
  @Get("tenant/stats")
  @Roles("tenant_admin", "erp_user")
  async getTenantStats(@Request() req: RequestWithContext) {
    return this.erpService.getTenantStats(requireTenantId(req));
  }

  @Get("tenant/inventory")
  @Roles("tenant_admin", "erp_user")
  async getInventory(@Request() req: RequestWithContext) {
    return this.erpService.getInventory(requireTenantId(req));
  }

  // --- Projects ---
  @Get("projects")
  @Roles("erp_user", "tenant_admin")
  async getProjects(@Request() req: RequestWithContext) {
    return this.erpService.getProjects(requireTenantId(req));
  }

  @Post("projects")
  @Roles("tenant_admin")
  async createProject(
    @Request() req: RequestWithContext,
    @Body() body: Prisma.ErpProjectCreateInput,
  ) {
    return this.erpService.createProject(requireTenantId(req), body);
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
    return this.erpService.getCustomers(requireTenantId(req));
  }

  @Get("customers/:id")
  @Roles("erp_user", "tenant_admin")
  async getCustomer(@Request() req: RequestWithContext, @Param("id") id: string) {
    return this.erpService.getCustomer(requireTenantId(req), id);
  }

  @Post("customers")
  @Roles("erp_user", "tenant_admin")
  async createCustomer(
    @Request() req: RequestWithContext,
    @Body() body: Prisma.ErpCustomerCreateInput,
  ) {
    return this.erpService.createCustomer(requireTenantId(req), body);
  }

  @Get("leads")
  @Roles("erp_user", "tenant_admin")
  async getLeads(@Request() req: RequestWithContext) {
    return this.erpService.getLeads(requireTenantId(req));
  }

  @Post("leads")
  @Roles("erp_user", "tenant_admin")
  async createLead(
    @Request() req: RequestWithContext,
    @Body()
    body: {
      name: string;
      email?: string;
      phone?: string;
      source?: string;
      projectId?: string;
      notes?: string;
    },
  ) {
    return this.erpService.createLead(requireTenantId(req), body);
  }

  @Patch("leads/:id")
  @Roles("erp_user", "tenant_admin")
  async updateLead(
    @Request() req: RequestWithContext,
    @Param("id") id: string,
    @Body() body: { status?: ErpLeadStatus; notes?: string; projectId?: string | null },
  ) {
    return this.erpService.updateLead(requireTenantId(req), id, body);
  }

  @Post("leads/:id/convert")
  @Roles("erp_user", "tenant_admin")
  async convertLead(@Request() req: RequestWithContext, @Param("id") id: string) {
    return this.erpService.convertLeadToCustomer(requireTenantId(req), id);
  }

  @Get("leads/:id/activities")
  @Roles("erp_user", "tenant_admin")
  async getLeadActivities(@Request() req: RequestWithContext, @Param("id") id: string) {
    return this.erpService.getLeadActivities(requireTenantId(req), id);
  }

  @Post("leads/:id/activities")
  @Roles("erp_user", "tenant_admin")
  async createLeadActivity(
    @Request() req: RequestWithContext,
    @Param("id") id: string,
    @Body() body: { type?: ErpLeadActivityType; notes?: string; nextFollowUpAt?: string },
  ) {
    const userId = extractUserId(req.user) || undefined;
    if (!userId) throw new BadRequestException("User ID tidak valid");
    return this.erpService.createLeadActivity(requireTenantId(req), id, userId, body);
  }

  // --- Vendors ---
  @Get("vendors")
  @Roles("erp_user", "tenant_admin")
  async getVendors(@Request() req: RequestWithContext) {
    return this.erpService.getVendors(requireTenantId(req));
  }

  @Post("vendors")
  @Roles("erp_user", "tenant_admin")
  async createVendor(
    @Request() req: RequestWithContext,
    @Body()
    body: { name: string; email?: string; phone?: string; address?: string; taxId?: string },
  ) {
    return this.erpService.createVendor(requireTenantId(req), body);
  }

  // --- Procurement ---
  @Get("procurement/purchase-orders")
  @Roles("erp_user", "tenant_admin")
  async getPurchaseOrders(@Request() req: RequestWithContext) {
    return this.erpService.getPurchaseOrders(requireTenantId(req));
  }

  @Post("procurement/purchase-orders")
  @Roles("erp_user", "tenant_admin")
  async createPurchaseOrder(
    @Request() req: RequestWithContext,
    @Body()
    body: {
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
    const userId = extractUserId(req.user) || null;
    return this.erpService.createPurchaseOrder(requireTenantId(req), userId, body);
  }

  @Get("procurement/bills")
  @Roles("erp_user", "tenant_admin")
  async getVendorBills(@Request() req: RequestWithContext) {
    return this.erpService.getVendorBills(requireTenantId(req));
  }

  @Post("procurement/bills")
  @Roles("erp_user", "tenant_admin")
  async createVendorBill(
    @Request() req: RequestWithContext,
    @Body()
    body: {
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
    const userId = extractUserId(req.user) || null;
    return this.erpService.createVendorBill(requireTenantId(req), userId, body);
  }

  @Post("procurement/bills/:id/approve")
  @Roles("tenant_admin")
  async approveVendorBill(@Request() req: RequestWithContext, @Param("id") id: string) {
    return this.erpService.approveVendorBill(requireTenantId(req), id);
  }

  @Post("procurement/bills/:id/pay")
  @Roles("tenant_admin")
  async payVendorBill(
    @Request() req: RequestWithContext,
    @Param("id") id: string,
    @Body() body: { date: string; amount: number; cashAccountCode?: string; notes?: string },
  ) {
    const userId = extractUserId(req.user) || null;
    return this.erpService.payVendorBill(requireTenantId(req), id, userId, body);
  }

  @Post("procurement/bills/:id/release-retention")
  @Roles("tenant_admin")
  async releaseRetention(
    @Request() req: RequestWithContext,
    @Param("id") id: string,
    @Body() body: { date: string; amount: number; cashAccountCode?: string; notes?: string },
  ) {
    const userId = extractUserId(req.user) || null;
    return this.erpService.releaseRetention(requireTenantId(req), id, userId, body);
  }

  @Get("hr/employees")
  @Roles("tenant_admin", "erp_user")
  async getEmployees(@Request() req: RequestWithContext) {
    return this.erpService.getEmployees(requireTenantId(req));
  }

  @Post("hr/employees")
  @Roles("tenant_admin")
  async createEmployee(
    @Request() req: RequestWithContext,
    @Body()
    body: {
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
    return this.erpService.createEmployee(requireTenantId(req), body);
  }

  @Patch("hr/employees/:id")
  @Roles("tenant_admin")
  async updateEmployee(
    @Request() req: RequestWithContext,
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      email?: string;
      phone?: string;
      department?: string;
      position?: string;
      status?: ErpEmployeeStatus;
      endDate?: string | null;
      basicSalary?: number;
      allowance?: number;
      pph21?: number;
      bpjsEmployee?: number;
      bpjsEmployer?: number;
    },
  ) {
    return this.erpService.updateEmployee(requireTenantId(req), id, body);
  }

  @Get("payroll/periods")
  @Roles("tenant_admin")
  async getPayrollPeriods(@Request() req: RequestWithContext) {
    return this.erpService.getPayrollPeriods(requireTenantId(req));
  }

  @Post("payroll/periods")
  @Roles("tenant_admin")
  async createPayrollPeriod(
    @Request() req: RequestWithContext,
    @Body() body: { name: string; startDate: string; endDate: string },
  ) {
    return this.erpService.createPayrollPeriod(requireTenantId(req), body);
  }

  @Get("payroll/runs")
  @Roles("tenant_admin")
  async getPayrollRuns(@Request() req: RequestWithContext) {
    return this.erpService.getPayrollRuns(requireTenantId(req));
  }

  @Get("payroll/runs/:id")
  @Roles("tenant_admin")
  async getPayrollRun(@Request() req: RequestWithContext, @Param("id") id: string) {
    return this.erpService.getPayrollRun(requireTenantId(req), id);
  }

  @Post("payroll/runs")
  @Roles("tenant_admin")
  async createPayrollRun(
    @Request() req: RequestWithContext,
    @Body() body: { periodId: string; employeeIds?: string[] },
  ) {
    const userId = extractUserId(req.user) || null;
    return this.erpService.createPayrollRun(requireTenantId(req), userId, body);
  }

  @Post("payroll/runs/:id/approve")
  @Roles("tenant_admin")
  async approvePayrollRun(@Request() req: RequestWithContext, @Param("id") id: string) {
    const userId = extractUserId(req.user) || null;
    return this.erpService.approvePayrollRun(requireTenantId(req), id, userId);
  }

  @Post("payroll/runs/:id/pay")
  @Roles("tenant_admin")
  async payPayrollRun(
    @Request() req: RequestWithContext,
    @Param("id") id: string,
    @Body() body: { date: string; cashAccountCode?: string; amount?: number; notes?: string },
  ) {
    const userId = extractUserId(req.user) || null;
    return this.erpService.payPayrollRun(requireTenantId(req), id, userId, body);
  }

  @Post("payroll/runs/:id/settle")
  @Roles("tenant_admin")
  async settlePayrollWithholding(
    @Request() req: RequestWithContext,
    @Param("id") id: string,
    @Body()
    body: {
      kind: ErpPayrollSettlementKind;
      date: string;
      amount: number;
      cashAccountCode?: string;
      notes?: string;
    },
  ) {
    const userId = extractUserId(req.user) || null;
    return this.erpService.settlePayrollWithholding(requireTenantId(req), id, userId, body);
  }

  @Get("payroll/commissions")
  @Roles("tenant_admin")
  async getCommissionPayouts(@Request() req: RequestWithContext) {
    return this.erpService.getCommissionPayouts(requireTenantId(req));
  }

  @Post("payroll/commissions")
  @Roles("tenant_admin")
  async createCommissionPayout(
    @Request() req: RequestWithContext,
    @Body() body: { userId: string; amount: number; salesId?: string; notes?: string },
  ) {
    const userId = extractUserId(req.user) || null;
    return this.erpService.createCommissionPayout(requireTenantId(req), userId, body);
  }

  @Post("payroll/commissions/:id/approve")
  @Roles("tenant_admin")
  async approveCommissionPayout(@Request() req: RequestWithContext, @Param("id") id: string) {
    const userId = extractUserId(req.user) || null;
    return this.erpService.approveCommissionPayout(requireTenantId(req), id, userId);
  }

  @Post("payroll/commissions/:id/pay")
  @Roles("tenant_admin")
  async payCommissionPayout(
    @Request() req: RequestWithContext,
    @Param("id") id: string,
    @Body() body: { date: string; cashAccountCode?: string; notes?: string },
  ) {
    const userId = extractUserId(req.user) || null;
    return this.erpService.payCommissionPayout(requireTenantId(req), id, userId, body);
  }

  // --- Sales ---
  @Post("sales")
  @Roles("erp_user", "tenant_admin")
  async createSales(
    @Request() req: RequestWithContext,
    @Body() body: { projectId: string; unitId: string; customerId: string; totalPrice: number },
  ) {
    return this.erpService.createSales(requireTenantId(req), body);
  }

  @Post("sales/:id/handover")
  @Roles("tenant_admin")
  async handoverSales(
    @Request() req: RequestWithContext,
    @Param("id") id: string,
    @Body() body: { handoverAt?: string },
  ) {
    return this.erpService.handoverSales(requireTenantId(req), id, body.handoverAt);
  }

  // --- Legal & Documents ---
  @Get("legal/stats")
  @Roles("erp_user", "tenant_admin")
  async getLegalStats(@Request() req: RequestWithContext) {
    return this.erpService.getLegalStats(requireTenantId(req));
  }

  @Get("documents")
  @Roles("erp_user", "tenant_admin")
  async getDocuments(@Request() req: RequestWithContext) {
    return this.erpService.getDocuments(requireTenantId(req));
  }

  @Post("documents/generate")
  @Roles("erp_user", "tenant_admin")
  async generateDocument(@Body() body: { salesId: string; templateId: string }) {
    return this.erpService.generateDocument(body.salesId, body.templateId);
  }

  @Post("documents/upload")
  @Roles("erp_user", "tenant_admin")
  async uploadDocument(
    @Request() req: RequestWithContext,
    @Body() body: { title: string; type: string; notes?: string },
  ) {
    return this.erpService.uploadDocument(requireTenantId(req), body);
  }

  // --- Accounting ---
  @Get("accounts")
  @Roles("tenant_admin")
  async getAccounts(@Request() req: RequestWithContext) {
    return this.erpService.getAccounts(requireTenantId(req));
  }

  @Get("journals")
  @Roles("tenant_admin")
  async getJournals(@Request() req: RequestWithContext) {
    return this.erpService.getJournals(requireTenantId(req));
  }

  @Post("journals")
  @Roles("tenant_admin")
  async createJournal(
    @Request() req: RequestWithContext,
    @Body()
    body: {
      date: string;
      description: string;
      projectId?: string;
      salesId?: string;
      reference?: string;
      details: Array<{ accountCode: string; debit: number; credit: number }>;
    },
  ) {
    return this.erpService.createJournalEntry(requireTenantId(req), body);
  }

  // --- Construction ---
  @Get("construction/stats")
  @Roles("tenant_admin", "erp_user")
  async getConstructionStats(@Request() req: RequestWithContext) {
    return this.erpService.getConstructionStats(requireTenantId(req));
  }

  @Post("construction/update")
  @Roles("tenant_admin")
  async updateConstruction(
    @Request() req: RequestWithContext,
    @Body()
    body: {
      projectId: string;
      stage: string;
      progress: number;
      notes?: string;
    },
  ) {
    return this.erpService.updateConstruction(requireTenantId(req), body);
  }

  @Get("tenant/subscription")
  @Roles("tenant_admin")
  async getTenantSubscription(@Request() req: RequestWithContext) {
    return this.erpService.getTenantSubscription(requireTenantId(req));
  }

  @Get("tenant/pricing")
  @Roles("tenant_admin")
  async getTenantPricingPlans(@Request() req: RequestWithContext) {
    return this.erpService.getTenantPricingPlans(requireTenantId(req));
  }

  @Post("tenant/renew")
  @Roles("tenant_admin")
  async renewLicense(
    @Request() req: RequestWithContext,
    @Body() body: { planId: string; paymentMethod?: string },
  ) {
    const userId = extractUserId(req.user);
    if (!userId) throw new BadRequestException("User ID tidak valid");
    return this.erpService.renewLicense(
      requireTenantId(req),
      userId,
      body.planId,
      body.paymentMethod,
    );
  }

  @Get("tenant/settings")
  @Roles("tenant_admin", "erp_user")
  async getTenantSettings(@Request() req: RequestWithContext) {
    const userId = extractUserId(req.user);
    if (!userId) throw new BadRequestException("User ID tidak valid");
    return this.erpService.getTenantSettings(requireTenantId(req), userId);
  }

  @Patch("tenant/settings/tenant")
  @Roles("tenant_admin")
  async updateTenantSettings(@Request() req: RequestWithContext, @Body() body: { name: string }) {
    return this.erpService.updateTenantSettings(requireTenantId(req), body);
  }

  @Patch("tenant/settings/profile")
  @Roles("tenant_admin", "erp_user")
  async updateMyProfile(
    @Request() req: RequestWithContext,
    @Body() body: { name?: string; phone?: string },
  ) {
    const userId = extractUserId(req.user);
    if (!userId) throw new BadRequestException("User ID tidak valid");
    return this.erpService.updateMyProfile(userId, body);
  }

  @Post("tenant/settings/users")
  @Roles("tenant_admin")
  async createTenantUser(
    @Request() req: RequestWithContext,
    @Body()
    body: {
      email: string;
      name: string;
      phone?: string;
      role?: "erp_user" | "tenant_admin";
    },
  ) {
    return this.erpService.createTenantUser(requireTenantId(req), body);
  }

  @Post("tenant/settings/password")
  @Roles("tenant_admin", "erp_user")
  async changeMyPassword(
    @Request() req: RequestWithContext,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const userId = extractUserId(req.user);
    if (!userId) throw new BadRequestException("User ID tidak valid");
    return this.erpService.changeMyPassword(userId, body);
  }
}

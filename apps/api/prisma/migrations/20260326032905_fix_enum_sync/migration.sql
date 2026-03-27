-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'expired', 'trial', 'trial_expired', 'inactive', 'cancelled');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('active', 'expired', 'revoked');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "PricingPlanOwnerType" AS ENUM ('SYSTEM', 'PARTNER');

-- CreateEnum
CREATE TYPE "ErpSalesStatus" AS ENUM ('draft', 'pending', 'approved', 'cancelled');

-- CreateEnum
CREATE TYPE "ErpPaymentStatus" AS ENUM ('pending', 'paid', 'partial', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "ErpDocumentStatus" AS ENUM ('draft', 'pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ErpWorkflowStatus" AS ENUM ('active', 'inactive');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RoleName" ADD VALUE 'partner';
ALTER TYPE "RoleName" ADD VALUE 'tenant_admin';
ALTER TYPE "RoleName" ADD VALUE 'erp_user';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tenantId" TEXT;

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'trial',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingPlan" (
    "id" TEXT NOT NULL,
    "ownerType" "PricingPlanOwnerType" NOT NULL,
    "ownerId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationDays" INTEGER NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerLicenseQuota" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "totalQuota" INTEGER NOT NULL,
    "usedQuota" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerLicenseQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pricingPlanId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpSubscription" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "package" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "deviceHash" TEXT,
    "deviceName" TEXT,
    "status" "LicenseStatus" NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceLog" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "deviceHash" TEXT NOT NULL,
    "ipAddress" TEXT,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,

    CONSTRAINT "DeviceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseReset" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "resetCount" INTEGER NOT NULL DEFAULT 0,
    "lastResetAt" TIMESTAMP(3),

    CONSTRAINT "LicenseReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "ErpProject" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpUnit" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "unitCode" TEXT NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpCustomer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpLead" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpSales" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "ErpSalesStatus" NOT NULL DEFAULT 'draft',
    "totalPrice" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpSales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpPayment" (
    "id" TEXT NOT NULL,
    "salesId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "status" "ErpPaymentStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpJournal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpJournal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpJournalDetail" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT "ErpJournalDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpWarehouse" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpWarehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpMaterial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpStockMovement" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" DECIMAL(18,2) NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErpStockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpVendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpPurchaseOrder" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "total" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpPurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpDocumentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "variables" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpDocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpGeneratedDocument" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "salesId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ErpDocumentStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpGeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyRating" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "name" TEXT,
    "comment" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_email_key" ON "Partner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_partnerId_idx" ON "Tenant"("partnerId");

-- CreateIndex
CREATE INDEX "PricingPlan_ownerId_idx" ON "PricingPlan"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerLicenseQuota_partnerId_key" ON "PartnerLicenseQuota"("partnerId");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_idx" ON "Invoice"("tenantId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_invoiceId_key" ON "Payment"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "ErpSubscription_partnerId_idx" ON "ErpSubscription"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "License_deviceHash_key" ON "License"("deviceHash");

-- CreateIndex
CREATE INDEX "License_userId_idx" ON "License"("userId");

-- CreateIndex
CREATE INDEX "License_tenantId_idx" ON "License"("tenantId");

-- CreateIndex
CREATE INDEX "DeviceLog_licenseId_idx" ON "DeviceLog"("licenseId");

-- CreateIndex
CREATE UNIQUE INDEX "LicenseReset_licenseId_key" ON "LicenseReset"("licenseId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE INDEX "ErpProject_tenantId_idx" ON "ErpProject"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ErpUnit_projectId_unitCode_key" ON "ErpUnit"("projectId", "unitCode");

-- CreateIndex
CREATE INDEX "ErpCustomer_tenantId_idx" ON "ErpCustomer"("tenantId");

-- CreateIndex
CREATE INDEX "ErpSales_tenantId_idx" ON "ErpSales"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ErpAccount_tenantId_code_key" ON "ErpAccount"("tenantId", "code");

-- CreateIndex
CREATE INDEX "ErpJournal_tenantId_idx" ON "ErpJournal"("tenantId");

-- CreateIndex
CREATE INDEX "ErpJournalDetail_journalId_idx" ON "ErpJournalDetail"("journalId");

-- CreateIndex
CREATE INDEX "ErpJournalDetail_accountId_idx" ON "ErpJournalDetail"("accountId");

-- CreateIndex
CREATE INDEX "ErpWarehouse_tenantId_idx" ON "ErpWarehouse"("tenantId");

-- CreateIndex
CREATE INDEX "ErpStockMovement_warehouseId_idx" ON "ErpStockMovement"("warehouseId");

-- CreateIndex
CREATE INDEX "ErpStockMovement_materialId_idx" ON "ErpStockMovement"("materialId");

-- CreateIndex
CREATE INDEX "ErpPurchaseOrder_vendorId_idx" ON "ErpPurchaseOrder"("vendorId");

-- CreateIndex
CREATE INDEX "ErpGeneratedDocument_templateId_idx" ON "ErpGeneratedDocument"("templateId");

-- CreateIndex
CREATE INDEX "ErpGeneratedDocument_salesId_idx" ON "ErpGeneratedDocument"("salesId");

-- CreateIndex
CREATE INDEX "PropertyRating_listingId_idx" ON "PropertyRating"("listingId");

-- CreateIndex
CREATE INDEX "PropertyRating_createdAt_idx" ON "PropertyRating"("createdAt");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingPlan" ADD CONSTRAINT "PricingPlan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerLicenseQuota" ADD CONSTRAINT "PartnerLicenseQuota_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_pricingPlanId_fkey" FOREIGN KEY ("pricingPlanId") REFERENCES "PricingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpSubscription" ADD CONSTRAINT "ErpSubscription_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceLog" ADD CONSTRAINT "DeviceLog_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseReset" ADD CONSTRAINT "LicenseReset_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpProject" ADD CONSTRAINT "ErpProject_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpUnit" ADD CONSTRAINT "ErpUnit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ErpProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpCustomer" ADD CONSTRAINT "ErpCustomer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpLead" ADD CONSTRAINT "ErpLead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "ErpCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpSales" ADD CONSTRAINT "ErpSales_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ErpProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpSales" ADD CONSTRAINT "ErpSales_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "ErpUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpSales" ADD CONSTRAINT "ErpSales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "ErpCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpPayment" ADD CONSTRAINT "ErpPayment_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "ErpSales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpAccount" ADD CONSTRAINT "ErpAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpJournalDetail" ADD CONSTRAINT "ErpJournalDetail_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "ErpJournal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpJournalDetail" ADD CONSTRAINT "ErpJournalDetail_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ErpAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpWarehouse" ADD CONSTRAINT "ErpWarehouse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpStockMovement" ADD CONSTRAINT "ErpStockMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "ErpWarehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpStockMovement" ADD CONSTRAINT "ErpStockMovement_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "ErpMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpPurchaseOrder" ADD CONSTRAINT "ErpPurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "ErpVendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpGeneratedDocument" ADD CONSTRAINT "ErpGeneratedDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ErpDocumentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpGeneratedDocument" ADD CONSTRAINT "ErpGeneratedDocument_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "ErpSales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyRating" ADD CONSTRAINT "PropertyRating_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "PropertyListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

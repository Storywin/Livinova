/*
  Warnings:

  - You are about to drop the column `total` on the `ErpPurchaseOrder` table. All the data in the column will be lost.
  - The `status` column on the `ErpPurchaseOrder` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[tenantId,poNumber]` on the table `ErpPurchaseOrder` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `date` to the `ErpPurchaseOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `poNumber` to the `ErpPurchaseOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `ErpPurchaseOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `ErpVendor` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ErpPurchaseOrderStatus" AS ENUM ('draft', 'approved', 'closed', 'cancelled');

-- CreateEnum
CREATE TYPE "ErpVendorBillStatus" AS ENUM ('draft', 'approved', 'paid', 'cancelled');

-- CreateEnum
CREATE TYPE "ErpVendorPaymentType" AS ENUM ('payment', 'retention_release');

-- DropIndex
DROP INDEX "ErpPurchaseOrder_vendorId_idx";

-- AlterTable
ALTER TABLE "ErpPurchaseOrder" DROP COLUMN "total",
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "poNumber" TEXT NOT NULL,
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ErpPurchaseOrderStatus" NOT NULL DEFAULT 'draft';

-- AlterTable
ALTER TABLE "ErpVendor" ADD COLUMN     "address" TEXT,
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ErpPurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qty" DECIMAL(18,2) NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "wipAccountCode" TEXT NOT NULL DEFAULT '103.04',

    CONSTRAINT "ErpPurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpVendorBill" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "vendorId" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "subtotal" DECIMAL(18,2) NOT NULL,
    "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "retentionPercent" DECIMAL(5,2),
    "retentionAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL,
    "status" "ErpVendorBillStatus" NOT NULL DEFAULT 'draft',
    "postedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpVendorBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpVendorBillItem" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "wipAccountCode" TEXT NOT NULL DEFAULT '103.04',

    CONSTRAINT "ErpVendorBillItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpVendorPayment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "cashAccountCode" TEXT NOT NULL DEFAULT '101.02',
    "type" "ErpVendorPaymentType" NOT NULL DEFAULT 'payment',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErpVendorPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ErpPurchaseOrderItem_purchaseOrderId_idx" ON "ErpPurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "ErpVendorBill_tenantId_idx" ON "ErpVendorBill"("tenantId");

-- CreateIndex
CREATE INDEX "ErpVendorBill_tenantId_status_idx" ON "ErpVendorBill"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ErpVendorBill_tenantId_vendorId_idx" ON "ErpVendorBill"("tenantId", "vendorId");

-- CreateIndex
CREATE INDEX "ErpVendorBill_tenantId_projectId_idx" ON "ErpVendorBill"("tenantId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ErpVendorBill_tenantId_invoiceNumber_key" ON "ErpVendorBill"("tenantId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "ErpVendorBillItem_billId_idx" ON "ErpVendorBillItem"("billId");

-- CreateIndex
CREATE INDEX "ErpVendorPayment_tenantId_idx" ON "ErpVendorPayment"("tenantId");

-- CreateIndex
CREATE INDEX "ErpVendorPayment_tenantId_billId_idx" ON "ErpVendorPayment"("tenantId", "billId");

-- CreateIndex
CREATE INDEX "ErpPurchaseOrder_tenantId_idx" ON "ErpPurchaseOrder"("tenantId");

-- CreateIndex
CREATE INDEX "ErpPurchaseOrder_tenantId_status_idx" ON "ErpPurchaseOrder"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ErpPurchaseOrder_tenantId_vendorId_idx" ON "ErpPurchaseOrder"("tenantId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "ErpPurchaseOrder_tenantId_poNumber_key" ON "ErpPurchaseOrder"("tenantId", "poNumber");

-- CreateIndex
CREATE INDEX "ErpVendor_tenantId_idx" ON "ErpVendor"("tenantId");

-- CreateIndex
CREATE INDEX "ErpVendor_tenantId_name_idx" ON "ErpVendor"("tenantId", "name");

-- AddForeignKey
ALTER TABLE "ErpVendor" ADD CONSTRAINT "ErpVendor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpPurchaseOrder" ADD CONSTRAINT "ErpPurchaseOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpPurchaseOrder" ADD CONSTRAINT "ErpPurchaseOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ErpProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpPurchaseOrder" ADD CONSTRAINT "ErpPurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpPurchaseOrderItem" ADD CONSTRAINT "ErpPurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "ErpPurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpVendorBill" ADD CONSTRAINT "ErpVendorBill_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpVendorBill" ADD CONSTRAINT "ErpVendorBill_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ErpProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpVendorBill" ADD CONSTRAINT "ErpVendorBill_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "ErpVendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpVendorBill" ADD CONSTRAINT "ErpVendorBill_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "ErpPurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpVendorBill" ADD CONSTRAINT "ErpVendorBill_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpVendorBillItem" ADD CONSTRAINT "ErpVendorBillItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES "ErpVendorBill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpVendorPayment" ADD CONSTRAINT "ErpVendorPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpVendorPayment" ADD CONSTRAINT "ErpVendorPayment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "ErpVendorBill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpVendorPayment" ADD CONSTRAINT "ErpVendorPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

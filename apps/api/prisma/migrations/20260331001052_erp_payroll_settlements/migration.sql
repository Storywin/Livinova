-- CreateEnum
CREATE TYPE "ErpPayrollSettlementKind" AS ENUM ('pph21', 'bpjs');

-- CreateTable
CREATE TABLE "ErpPayrollSettlement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "kind" "ErpPayrollSettlementKind" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "cashAccountCode" TEXT NOT NULL DEFAULT '101.02',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErpPayrollSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ErpPayrollSettlement_tenantId_idx" ON "ErpPayrollSettlement"("tenantId");

-- CreateIndex
CREATE INDEX "ErpPayrollSettlement_tenantId_payrollRunId_idx" ON "ErpPayrollSettlement"("tenantId", "payrollRunId");

-- CreateIndex
CREATE INDEX "ErpPayrollSettlement_tenantId_kind_idx" ON "ErpPayrollSettlement"("tenantId", "kind");

-- AddForeignKey
ALTER TABLE "ErpPayrollSettlement" ADD CONSTRAINT "ErpPayrollSettlement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpPayrollSettlement" ADD CONSTRAINT "ErpPayrollSettlement_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "ErpPayrollRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpPayrollSettlement" ADD CONSTRAINT "ErpPayrollSettlement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

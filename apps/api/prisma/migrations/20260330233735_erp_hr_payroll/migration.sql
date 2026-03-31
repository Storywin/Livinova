-- CreateEnum
CREATE TYPE "ErpEmployeeStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "ErpPayrollRunStatus" AS ENUM ('draft', 'approved', 'paid', 'cancelled');

-- CreateEnum
CREATE TYPE "ErpCommissionStatus" AS ENUM ('draft', 'approved', 'paid', 'cancelled');

-- CreateTable
CREATE TABLE "ErpEmployee" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "employeeNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "department" TEXT,
    "position" TEXT,
    "status" "ErpEmployeeStatus" NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "basicSalary" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "allowance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "pph21" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "bpjsEmployee" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "bpjsEmployer" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpPayrollPeriod" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpPayrollPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpPayrollRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "status" "ErpPayrollRunStatus" NOT NULL DEFAULT 'draft',
    "payrollExpenseAccountCode" TEXT NOT NULL DEFAULT '504.01',
    "payrollPayableAccountCode" TEXT NOT NULL DEFAULT '205.02',
    "pph21PayableAccountCode" TEXT NOT NULL DEFAULT '204.03',
    "bpjsPayableAccountCode" TEXT NOT NULL DEFAULT '205.03',
    "grossTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "deductionsTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "postedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdById" TEXT,
    "approvedById" TEXT,
    "paidById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpPayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpPayrollLine" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "gross" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "allowance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "pph21" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "bpjsEmployee" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "bpjsEmployer" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "net" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "ErpPayrollLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpCommissionPayout" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "salesId" TEXT,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" "ErpCommissionStatus" NOT NULL DEFAULT 'draft',
    "payableAccountCode" TEXT NOT NULL DEFAULT '205.05',
    "expenseAccountCode" TEXT NOT NULL DEFAULT '503.04',
    "postedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdById" TEXT,
    "approvedById" TEXT,
    "paidById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpCommissionPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ErpEmployee_tenantId_idx" ON "ErpEmployee"("tenantId");

-- CreateIndex
CREATE INDEX "ErpEmployee_tenantId_status_idx" ON "ErpEmployee"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ErpEmployee_tenantId_employeeNo_key" ON "ErpEmployee"("tenantId", "employeeNo");

-- CreateIndex
CREATE INDEX "ErpPayrollPeriod_tenantId_idx" ON "ErpPayrollPeriod"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ErpPayrollPeriod_tenantId_name_key" ON "ErpPayrollPeriod"("tenantId", "name");

-- CreateIndex
CREATE INDEX "ErpPayrollRun_tenantId_idx" ON "ErpPayrollRun"("tenantId");

-- CreateIndex
CREATE INDEX "ErpPayrollRun_tenantId_status_idx" ON "ErpPayrollRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ErpPayrollRun_tenantId_periodId_idx" ON "ErpPayrollRun"("tenantId", "periodId");

-- CreateIndex
CREATE INDEX "ErpPayrollLine_payrollRunId_idx" ON "ErpPayrollLine"("payrollRunId");

-- CreateIndex
CREATE INDEX "ErpPayrollLine_employeeId_idx" ON "ErpPayrollLine"("employeeId");

-- CreateIndex
CREATE INDEX "ErpCommissionPayout_tenantId_idx" ON "ErpCommissionPayout"("tenantId");

-- CreateIndex
CREATE INDEX "ErpCommissionPayout_tenantId_status_idx" ON "ErpCommissionPayout"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ErpCommissionPayout_tenantId_userId_idx" ON "ErpCommissionPayout"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "ErpCommissionPayout_tenantId_salesId_idx" ON "ErpCommissionPayout"("tenantId", "salesId");

-- AddForeignKey
ALTER TABLE "ErpEmployee" ADD CONSTRAINT "ErpEmployee_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpEmployee" ADD CONSTRAINT "ErpEmployee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpPayrollPeriod" ADD CONSTRAINT "ErpPayrollPeriod_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpPayrollRun" ADD CONSTRAINT "ErpPayrollRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpPayrollRun" ADD CONSTRAINT "ErpPayrollRun_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ErpPayrollPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpPayrollRun" ADD CONSTRAINT "ErpPayrollRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpPayrollRun" ADD CONSTRAINT "ErpPayrollRun_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpPayrollRun" ADD CONSTRAINT "ErpPayrollRun_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpPayrollLine" ADD CONSTRAINT "ErpPayrollLine_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "ErpPayrollRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpPayrollLine" ADD CONSTRAINT "ErpPayrollLine_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "ErpEmployee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpCommissionPayout" ADD CONSTRAINT "ErpCommissionPayout_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpCommissionPayout" ADD CONSTRAINT "ErpCommissionPayout_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "ErpSales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpCommissionPayout" ADD CONSTRAINT "ErpCommissionPayout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpCommissionPayout" ADD CONSTRAINT "ErpCommissionPayout_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpCommissionPayout" ADD CONSTRAINT "ErpCommissionPayout_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpCommissionPayout" ADD CONSTRAINT "ErpCommissionPayout_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

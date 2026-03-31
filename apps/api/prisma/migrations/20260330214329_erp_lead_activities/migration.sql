-- CreateEnum
CREATE TYPE "ErpLeadActivityType" AS ENUM ('call', 'whatsapp', 'meeting', 'site_visit', 'note');

-- CreateTable
CREATE TABLE "ErpLeadActivity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "ErpLeadActivityType" NOT NULL DEFAULT 'note',
    "notes" TEXT,
    "nextFollowUpAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErpLeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ErpLeadActivity_tenantId_idx" ON "ErpLeadActivity"("tenantId");

-- CreateIndex
CREATE INDEX "ErpLeadActivity_tenantId_leadId_idx" ON "ErpLeadActivity"("tenantId", "leadId");

-- CreateIndex
CREATE INDEX "ErpLeadActivity_tenantId_nextFollowUpAt_idx" ON "ErpLeadActivity"("tenantId", "nextFollowUpAt");

-- AddForeignKey
ALTER TABLE "ErpLeadActivity" ADD CONSTRAINT "ErpLeadActivity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpLeadActivity" ADD CONSTRAINT "ErpLeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "ErpLead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpLeadActivity" ADD CONSTRAINT "ErpLeadActivity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

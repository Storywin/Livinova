/*
  Warnings:

  - The `status` column on the `ErpLead` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `name` to the `ErpLead` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `ErpLead` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ErpLeadStatus" AS ENUM ('new', 'contacted', 'qualified', 'booked', 'lost');

-- AlterTable
ALTER TABLE "ErpLead" ADD COLUMN     "email" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ErpLeadStatus" NOT NULL DEFAULT 'new';

-- CreateIndex
CREATE INDEX "ErpLead_tenantId_idx" ON "ErpLead"("tenantId");

-- CreateIndex
CREATE INDEX "ErpLead_tenantId_status_idx" ON "ErpLead"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "ErpLead" ADD CONSTRAINT "ErpLead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpLead" ADD CONSTRAINT "ErpLead_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ErpProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "ErpRevenueRecognition" AS ENUM ('point_in_time', 'over_time');

-- AlterEnum
ALTER TYPE "ErpSalesStatus" ADD VALUE 'completed';

-- AlterTable
ALTER TABLE "ErpJournal" ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "salesId" TEXT;

-- AlterTable
ALTER TABLE "ErpProject" ADD COLUMN     "revenueRecognitionMethod" "ErpRevenueRecognition" NOT NULL DEFAULT 'point_in_time';

-- AlterTable
ALTER TABLE "ErpSales" ADD COLUMN     "handoverAt" TIMESTAMP(3),
ADD COLUMN     "recognizedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ErpJournal_tenantId_projectId_idx" ON "ErpJournal"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "ErpJournal_tenantId_salesId_idx" ON "ErpJournal"("tenantId", "salesId");

-- AddForeignKey
ALTER TABLE "ErpJournal" ADD CONSTRAINT "ErpJournal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ErpProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpJournal" ADD CONSTRAINT "ErpJournal_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "ErpSales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

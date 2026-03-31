-- AlterTable
ALTER TABLE "ErpProject" ADD COLUMN     "heroMediaAssetId" TEXT;

-- AddForeignKey
ALTER TABLE "ErpProject" ADD CONSTRAINT "ErpProject_heroMediaAssetId_fkey" FOREIGN KEY ("heroMediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

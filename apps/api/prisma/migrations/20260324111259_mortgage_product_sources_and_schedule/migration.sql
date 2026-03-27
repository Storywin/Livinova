-- AlterTable
ALTER TABLE "MortgageProduct" ADD COLUMN     "minTenorMonths" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "rateSchedule" JSONB,
ADD COLUMN     "sourceCheckedAt" TIMESTAMP(3),
ADD COLUMN     "sourceTitle" TEXT,
ADD COLUMN     "sourceUrl" TEXT;

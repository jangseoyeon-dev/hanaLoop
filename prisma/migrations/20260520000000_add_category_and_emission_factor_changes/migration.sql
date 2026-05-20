-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('ELECTRICITY', 'MATERIAL', 'TRANSPORT');

-- AlterTable
ALTER TABLE "activity_types" ADD COLUMN     "category" "ActivityCategory" NOT NULL;

-- AlterTable
ALTER TABLE "emission_factors" DROP COLUMN "factor_name",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "activity_types_category_name_key" ON "activity_types"("category", "name");

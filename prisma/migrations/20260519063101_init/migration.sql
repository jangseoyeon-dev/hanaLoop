-- CreateTable
CREATE TABLE "activity_types" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "activity_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_histories" (
    "id" SERIAL NOT NULL,
    "file_name" VARCHAR(255),
    "uploaded_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_data" (
    "id" SERIAL NOT NULL,
    "upload_history_id" INTEGER,
    "activity_date" DATE NOT NULL,
    "activity_type_id" INTEGER NOT NULL,
    "description" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "unit" VARCHAR(50) NOT NULL,
    "row_hash" VARCHAR(255),
    "is_duplicate" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_factors" (
    "id" SERIAL NOT NULL,
    "activity_type_id" INTEGER NOT NULL,
    "factor_name" TEXT NOT NULL,
    "factor" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emission_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pcf_results" (
    "id" SERIAL NOT NULL,
    "activity_data_id" INTEGER NOT NULL,
    "emission_factor_id" INTEGER NOT NULL,
    "carbon_emission" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pcf_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_types_code_key" ON "activity_types"("code");

-- AddForeignKey
ALTER TABLE "activity_data" ADD CONSTRAINT "activity_data_upload_history_id_fkey" FOREIGN KEY ("upload_history_id") REFERENCES "upload_histories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_data" ADD CONSTRAINT "activity_data_activity_type_id_fkey" FOREIGN KEY ("activity_type_id") REFERENCES "activity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emission_factors" ADD CONSTRAINT "emission_factors_activity_type_id_fkey" FOREIGN KEY ("activity_type_id") REFERENCES "activity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pcf_results" ADD CONSTRAINT "pcf_results_activity_data_id_fkey" FOREIGN KEY ("activity_data_id") REFERENCES "activity_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pcf_results" ADD CONSTRAINT "pcf_results_emission_factor_id_fkey" FOREIGN KEY ("emission_factor_id") REFERENCES "emission_factors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

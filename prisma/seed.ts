import { ActivityCategory, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ACTIVITY_TYPES = [
  {
    code: "KEPCO",
    name: "한국전력",
    category: ActivityCategory.ELECTRICITY,
    unit: "kWh",
  },
  {
    code: "PLASTIC_1",
    name: "플라스틱 1",
    category: ActivityCategory.MATERIAL,
    unit: "kg",
  },
  {
    code: "PLASTIC_2",
    name: "플라스틱 2",
    category: ActivityCategory.MATERIAL,
    unit: "kg",
  },
  {
    code: "TRUCK",
    name: "트럭",
    category: ActivityCategory.TRANSPORT,
    unit: "ton-km",
  },
] as const;

const EMISSION_FACTORS = [
  { typeCode: "KEPCO", factor: 0.456, unit: "kgCO2e/kWh" },
  { typeCode: "PLASTIC_1", factor: 2.3, unit: "kgCO2e/kg" },
  { typeCode: "PLASTIC_2", factor: 3.2, unit: "kgCO2e/kg" },
  { typeCode: "TRUCK", factor: 3.5, unit: "kgCO2e/ton-km" },
] as const;

async function main() {
  for (const t of ACTIVITY_TYPES) {
    await prisma.activityType.upsert({
      where: { code: t.code },
      update: { name: t.name, category: t.category, unit: t.unit },
      create: t,
    });
  }

  const typeMap = new Map(
    (await prisma.activityType.findMany()).map((t) => [t.code, t.id]),
  );

  for (const f of EMISSION_FACTORS) {
    const activityTypeId = typeMap.get(f.typeCode);
    if (!activityTypeId) continue;

    const existing = await prisma.emissionFactor.findFirst({
      where: { activityTypeId },
      orderBy: { version: "desc" },
    });
    if (existing) continue;

    await prisma.emissionFactor.create({
      data: {
        activityTypeId,
        factor: f.factor,
        unit: f.unit,
        version: 1,
        startDate: new Date("2025-01-01"),
      },
    });
  }

  const typeCount = await prisma.activityType.count();
  const factorCount = await prisma.emissionFactor.count();
  console.log(`Seed 완료: activity_types ${typeCount}건, emission_factors ${factorCount}건`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

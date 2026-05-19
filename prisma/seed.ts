import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ACTIVITY_TYPES = [
  { code: "ELECTRICITY", name: "전기", unit: "kWh" },
  { code: "MATERIAL", name: "원소재", unit: "kg" },
  { code: "TRANSPORT", name: "운송", unit: "ton-km" },
] as const;

const EMISSION_FACTORS = [
  {
    typeCode: "ELECTRICITY",
    factorName: "한국전력 기본값",
    factor: 0.456,
    unit: "kgCO2e/kWh",
  },
  {
    typeCode: "MATERIAL",
    factorName: "플라스틱 1",
    factor: 2.3,
    unit: "kgCO2e/kg",
  },
  {
    typeCode: "MATERIAL",
    factorName: "플라스틱 2",
    factor: 3.2,
    unit: "kgCO2e/kg",
  },
  {
    typeCode: "TRANSPORT",
    factorName: "트럭",
    factor: 3.5,
    unit: "kgCO2e/ton-km",
  },
] as const;

async function main() {
  for (const t of ACTIVITY_TYPES) {
    await prisma.activityType.upsert({
      where: { code: t.code },
      update: { name: t.name, unit: t.unit },
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
      where: { activityTypeId, factorName: f.factorName },
      orderBy: { version: "desc" },
    });
    if (existing) continue;

    await prisma.emissionFactor.create({
      data: {
        activityTypeId,
        factorName: f.factorName,
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

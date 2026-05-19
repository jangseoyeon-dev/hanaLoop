import { prisma } from "@/shared/lib/prisma";

export async function findEmissionFactor(params: {
  activityTypeId: number;
  factorName: string;
  activityDate: Date;
}) {
  const { activityTypeId, factorName, activityDate } = params;
  return prisma.emissionFactor.findFirst({
    where: {
      activityTypeId,
      factorName,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: activityDate } }] },
        { OR: [{ endDate: null }, { endDate: { gte: activityDate } }] },
      ],
    },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
  });
}

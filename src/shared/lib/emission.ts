import { prisma } from "@/shared/lib/prisma";

export async function findEmissionFactor(params: { activityTypeId: number }) {
  return prisma.emissionFactor.findFirst({
    where: { activityTypeId: params.activityTypeId, isActive: true },
  });
}

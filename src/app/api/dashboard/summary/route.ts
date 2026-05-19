import type { NextRequest } from "next/server";
import { ActivityCategory, Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams;
  const startStr = sp.get("startDate");
  const endStr = sp.get("endDate");

  const where: Prisma.ActivityDataWhereInput = { isDuplicate: false };
  if (startStr || endStr) {
    where.activityDate = {};
    if (startStr) where.activityDate.gte = new Date(startStr);
    if (endStr) where.activityDate.lte = new Date(endStr);
  }

  const rows = await prisma.activityData.findMany({
    where,
    select: {
      activityType: { select: { category: true } },
      pcfResults: { select: { carbonEmission: true } },
    },
  });

  const totalsByCategory = new Map<ActivityCategory, number>();
  let total = 0;

  for (const r of rows) {
    const emission = r.pcfResults.reduce((s, p) => s + p.carbonEmission, 0);
    total += emission;
    const cat = r.activityType.category;
    totalsByCategory.set(cat, (totalsByCategory.get(cat) ?? 0) + emission);
  }

  const typeTotals = Array.from(totalsByCategory.entries()).map(
    ([category, value]) => ({
      category,
      total: Number(value.toFixed(2)),
    }),
  );

  return Response.json({
    data: {
      total: Number(total.toFixed(2)),
      typeTotals,
    },
  });
}

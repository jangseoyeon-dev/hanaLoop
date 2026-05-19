import { ActivityCategory, type Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import type { ActivityTotal, DashboardSummary } from "./types";

export type DashboardFilters = {
  startDate?: string;
  endDate?: string;
  typeCode?: string;
  factorName?: string;
};

const TOP_ACTIVITIES_LIMIT = 5;

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function isCategory(v: string | undefined): v is ActivityCategory {
  return !!v && v in ActivityCategory;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function monthKey(d: Date): string {
  const m = d.getUTCMonth() + 1;
  return `${d.getUTCFullYear()}-${m < 10 ? `0${m}` : m}`;
}

function buildActivityDataWhere(
  filters: DashboardFilters,
): Prisma.ActivityDataWhereInput {
  const where: Prisma.ActivityDataWhereInput = { isDuplicate: false };

  const gte = parseDate(filters.startDate);
  const lte = parseDate(filters.endDate);
  if (gte || lte) {
    where.activityDate = { ...(gte && { gte }), ...(lte && { lte }) };
  }

  const typeWhere: Prisma.ActivityTypeWhereInput = {};
  if (isCategory(filters.typeCode)) typeWhere.category = filters.typeCode;
  if (filters.factorName) typeWhere.name = filters.factorName;
  if (Object.keys(typeWhere).length > 0) where.activityType = typeWhere;

  return where;
}

export async function loadDashboardSummary(
  filters: DashboardFilters,
): Promise<DashboardSummary> {
  const rows = await prisma.pcfResult.findMany({
    where: { activityData: buildActivityDataWhere(filters) },
    select: {
      carbonEmission: true,
      activityData: {
        select: {
          activityDate: true,
          activityType: { select: { name: true, category: true } },
        },
      },
    },
  });

  const byCategory = new Map<ActivityCategory, number>();
  const byMonth = new Map<string, number>();
  const byActivity = new Map<string, ActivityTotal>();
  let total = 0;

  for (const r of rows) {
    const emission = r.carbonEmission;
    const { category, name } = r.activityData.activityType;
    total += emission;

    byCategory.set(category, (byCategory.get(category) ?? 0) + emission);

    const mKey = monthKey(r.activityData.activityDate);
    byMonth.set(mKey, (byMonth.get(mKey) ?? 0) + emission);

    const aKey = `${category}::${name}`;
    const existing = byActivity.get(aKey);
    if (existing) existing.total += emission;
    else byActivity.set(aKey, { name, category, total: emission });
  }

  return {
    total: round2(total),
    typeTotals: Array.from(byCategory, ([category, value]) => ({
      category,
      total: round2(value),
    })),
    monthlyTotals: Array.from(byMonth, ([month, value]) => ({
      month,
      total: round2(value),
    })).sort((a, b) => a.month.localeCompare(b.month)),
    topActivities: Array.from(byActivity.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, TOP_ACTIVITIES_LIMIT)
      .map((a) => ({ ...a, total: round2(a.total) })),
  };
}

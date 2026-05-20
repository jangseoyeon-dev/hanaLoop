import { ActivityCategory, type Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import type { FilterValues } from "@/shared/components/filter/types";
import type {
  ActivityDataResult,
  ActivityRow,
  ActivitySearchParams,
  ActivityStats,
} from "./types";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function isCategory(v: string | undefined): v is ActivityCategory {
  return !!v && v in ActivityCategory;
}

function parsePositiveInt(
  value: string | undefined,
  fallback: number,
  max?: number
): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return fallback;
  return max ? Math.min(n, max) : n;
}

/** 필터를 Prisma where 절로 변환 (행 조회·통계 집계가 동일 조건을 공유) */
function buildWhere(filters: FilterValues): Prisma.ActivityDataWhereInput {
  const where: Prisma.ActivityDataWhereInput = {};

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

async function fetchRows(
  where: Prisma.ActivityDataWhereInput,
  skip: number,
  take: number
): Promise<ActivityRow[]> {
  const records = await prisma.activityData.findMany({
    where,
    orderBy: [{ activityDate: "desc" }, { id: "desc" }],
    skip,
    take,
    include: {
      activityType: { select: { code: true, name: true, category: true } },
      pcfResults: {
        select: {
          carbonEmission: true,
          emissionFactor: { select: { factor: true, unit: true } },
        },
      },
    },
  });

  return records.map((r) => ({
    id: r.id,
    activityDate: r.activityDate.toISOString().slice(0, 10),
    category: r.activityType.category,
    typeName: r.activityType.name,
    description: r.description,
    amount: Number(r.amount),
    unit: r.unit,
    co2e: Number(
      r.pcfResults.reduce((sum, p) => sum + p.carbonEmission, 0).toFixed(2)
    ),
    factor: r.pcfResults[0]?.emissionFactor?.factor ?? null,
    factorUnit: r.pcfResults[0]?.emissionFactor?.unit ?? null,
    isDuplicate: r.isDuplicate,
    rowHash: r.rowHash ?? "",
  }));
}

/** 상단 통계: 현재 페이지가 아닌 필터 전체 기준으로 집계 */
async function fetchStats(
  where: Prisma.ActivityDataWhereInput
): Promise<ActivityStats> {
  const [total, flaggedCount, co2eAgg] = await Promise.all([
    prisma.activityData.count({ where }),
    prisma.activityData.count({ where: { ...where, isDuplicate: true } }),
    prisma.pcfResult.aggregate({
      _sum: { carbonEmission: true },
      where: { activityData: { ...where, isDuplicate: false } },
    }),
  ]);
  return {
    total,
    flaggedCount,
    totalCo2e: co2eAgg._sum.carbonEmission ?? 0,
  };
}

/**
 * 데이터관리 페이지 데이터 로딩 일체.
 * 통계를 먼저 집계해 전체 건수를 구한 뒤, 필터·표시 개수 변경으로
 * 마지막 페이지를 넘어선 요청 페이지를 범위 안으로 보정해 행을 조회한다.
 */
export async function loadActivityData(
  params: ActivitySearchParams
): Promise<ActivityDataResult> {
  const requestedPage = parsePositiveInt(params.page, 1);
  const size = parsePositiveInt(params.size, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

  const where = buildWhere(params);
  const stats = await fetchStats(where);

  const totalPages = Math.max(1, Math.ceil(stats.total / size));
  const page = Math.min(requestedPage, totalPages);

  const rows = await fetchRows(where, (page - 1) * size, size);

  return { rows, stats, page, size };
}

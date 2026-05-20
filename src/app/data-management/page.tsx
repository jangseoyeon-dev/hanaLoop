import type { Prisma } from "@prisma/client";
import type { ActivityRow } from "./_lib/types";
import { ActivityTable } from "./_components/table/ActivityTable";
import { AddDataButton } from "./_components/button/AddDataButton";
import { UploadButton } from "./_components/button/UploadButton";
import { FilterBox } from "@/shared/components/filter/FilterBox";
import type { FilterValues } from "@/shared/components/filter/types";
import { StatTile } from "@/shared/components/card/StatTile";
import { formatNumber } from "@/shared/lib/format";
import { prisma } from "@/shared/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

type PageSearchParams = FilterValues & { page?: string; size?: string };

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
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
  const startDate = parseDate(filters.startDate);
  const endDate = parseDate(filters.endDate);

  const where: Prisma.ActivityDataWhereInput = {};
  if (startDate || endDate) {
    where.activityDate = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };
  }
  if (filters.typeCode) {
    where.activityType = {
      category: filters.typeCode as Prisma.EnumActivityCategoryFilter,
    };
  }
  if (filters.factorName) {
    where.activityType = {
      ...((where.activityType as object) ?? {}),
      name: filters.factorName,
    };
  }
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
async function fetchStats(where: Prisma.ActivityDataWhereInput) {
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

export default async function DataManagement({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const filters = await searchParams;
  const requestedPage = parsePositiveInt(filters.page, 1);
  const size = parsePositiveInt(filters.size, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

  const where = buildWhere(filters);
  const stats = await fetchStats(where);
  const { total, flaggedCount, totalCo2e } = stats;

  // 필터·표시 개수 변경으로 마지막 페이지를 넘어선 경우 범위 안으로 보정
  const totalPages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(requestedPage, totalPages);

  const rows = await fetchRows(where, (page - 1) * size, size);

  return (
    <div className="space-y-6 p-6 md:p-5">
      <header className="flex justify-between content-between space-y-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            데이터 관리
          </h1>
          <p className="text-sm text-slate-500">
            탄소 배출 활동 데이터를 등록·수정·삭제하고 중복 항목을 검토합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <UploadButton />
          <AddDataButton />
        </div>
      </header>

      <section className="mb-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="유효 건수 (집계 대상)"
          value={`${total - flaggedCount}`}
          sub="플래그 제외"
          tone="brand"
        />
        <StatTile
          label="플래그 건수"
          value={`${flaggedCount}`}
          sub={flaggedCount > 0 ? "검증 필요" : "이상 없음"}
          tone={flaggedCount > 0 ? "warning" : "muted"}
        />
        <StatTile
          label="필터 적용 CO₂e"
          value={`${formatNumber(totalCo2e)} kg CO₂e`}
          sub="플래그 제외 누계"
          tone="muted"
        />
      </section>

      <FilterBox />
      <ActivityTable rows={rows} page={page} pageSize={size} total={total} />
    </div>
  );
}

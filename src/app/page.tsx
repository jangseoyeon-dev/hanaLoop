import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import type { DashboardSummary } from "@/features/dashboard/types";
import type { ActivityType } from "@/shared/components/card/TypeCard";
import { FilterBox } from "@/shared/components/filter/FilterBox";
import { TotalCard } from "@/shared/components/card/TotalCard";
import { TypeCard } from "@/shared/components/card/TypeCard";
import { EmptyState } from "@/shared/components/empty/EmptyState";

const KNOWN_TYPES: ReadonlySet<ActivityType> = new Set([
  "ELECTRICITY",
  "MATERIAL",
  "TRANSPORT",
]);

type DashboardFilters = {
  startDate?: string;
  endDate?: string;
  typeCode?: string;
  factorName?: string;
};

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function loadDashboardSummary(
  filters: DashboardFilters,
): Promise<DashboardSummary> {
  const startDate = parseDate(filters.startDate);
  const endDate = parseDate(filters.endDate);

  const activityDataWhere: Prisma.ActivityDataWhereInput = {
    isDuplicate: false,
  };
  if (startDate || endDate) {
    activityDataWhere.activityDate = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };
  }
  if (filters.typeCode) {
    activityDataWhere.activityType = { code: filters.typeCode };
  }

  const where: Prisma.PcfResultWhereInput = { activityData: activityDataWhere };
  if (filters.factorName) {
    where.emissionFactor = { factorName: filters.factorName };
  }

  const rows = await prisma.pcfResult.findMany({
    where,
    select: {
      carbonEmission: true,
      activityData: { select: { activityType: { select: { code: true } } } },
    },
  });

  const totalsByCode = new Map<string, number>();
  let total = 0;

  for (const r of rows) {
    total += r.carbonEmission;
    const code = r.activityData.activityType.code;
    totalsByCode.set(code, (totalsByCode.get(code) ?? 0) + r.carbonEmission);
  }

  const typeTotals = Array.from(totalsByCode.entries())
    .filter(([code]) => KNOWN_TYPES.has(code as ActivityType))
    .map(([code, value]) => ({
      type: code as ActivityType,
      total: Number(value.toFixed(2)),
    }));

  return { total: Number(total.toFixed(2)), typeTotals };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<DashboardFilters>;
}) {
  const filters = await searchParams;
  const data = await loadDashboardSummary(filters);
  const isEmpty = data.total === 0 && data.typeTotals.length === 0;
  return (
    <div className="space-y-6 p-6 md:p-5">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          제품별 탄소 발자국 현황
        </h1>
        <p className="text-sm text-slate-500">
          전과정 (LCA) 단계별 탄소 배출량을 한눈에 — 중복 후보 행은 집계에서
          제외
        </p>
      </header>
      <FilterBox />
      {isEmpty ? (
        <EmptyState
          icon="📊"
          title="표시할 배출량 데이터가 없습니다"
          description="필터 조건을 변경하거나 데이터 관리 페이지에서 활동 데이터를 먼저 등록해 주세요."
        />
      ) : (
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TotalCard total={data.total} />
          {data.typeTotals.map((t) => (
            <TypeCard
              key={t.type}
              type={t.type}
              value={t.total}
              ratio={data.total > 0 ? (t.total / data.total) * 100 : 0}
            />
          ))}
        </section>
      )}
    </div>
  );
}

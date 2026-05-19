import { ActivityCategory, type Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import type { DashboardSummary } from "@/features/dashboard/types";
import { FilterBox } from "@/shared/components/filter/FilterBox";
import { TotalCard } from "@/shared/components/card/TotalCard";
import { TypeCard } from "@/shared/components/card/TypeCard";
import { EmptyState } from "@/shared/components/empty/EmptyState";

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

function isCategory(v: string | undefined): v is ActivityCategory {
  return !!v && v in ActivityCategory;
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
  const typeFilter: Prisma.ActivityTypeWhereInput = {};
  if (isCategory(filters.typeCode)) typeFilter.category = filters.typeCode;
  if (filters.factorName) typeFilter.name = filters.factorName;
  if (Object.keys(typeFilter).length > 0) {
    activityDataWhere.activityType = typeFilter;
  }

  const rows = await prisma.pcfResult.findMany({
    where: { activityData: activityDataWhere },
    select: {
      carbonEmission: true,
      activityData: {
        select: { activityType: { select: { category: true } } },
      },
    },
  });

  const totalsByCategory = new Map<ActivityCategory, number>();
  let total = 0;

  for (const r of rows) {
    total += r.carbonEmission;
    const cat = r.activityData.activityType.category;
    totalsByCategory.set(cat, (totalsByCategory.get(cat) ?? 0) + r.carbonEmission);
  }

  const typeTotals = Array.from(totalsByCategory.entries()).map(
    ([category, value]) => ({
      category,
      total: Number(value.toFixed(2)),
    }),
  );

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
              key={t.category}
              category={t.category}
              value={t.total}
              ratio={data.total > 0 ? (t.total / data.total) * 100 : 0}
            />
          ))}
        </section>
      )}
    </div>
  );
}

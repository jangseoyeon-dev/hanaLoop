import { FilterBox } from "@/shared/components/filter/FilterBox";
import { TotalCard } from "@/shared/components/card/TotalCard";
import { TypeCard } from "@/shared/components/card/TypeCard";
import { EmptyState } from "@/shared/components/empty/EmptyState";
import { CategoryDonutChart } from "@/shared/components/charts/CategoryDonutChart";
import { CategoryBarChart } from "@/shared/components/charts/CategoryBarChart";
import { MonthlyTrendChart } from "@/shared/components/charts/MonthlyTrendChart";
import { TopActivitiesChart } from "@/shared/components/charts/TopActivitiesChart";
import {
  loadDashboardSummary,
  type DashboardFilters,
} from "@/features/dashboard/queries";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<DashboardFilters>;
}) {
  const filters = await searchParams;
  const { total, typeTotals, monthlyTotals, topActivities } =
    await loadDashboardSummary(filters);
  const isEmpty = typeTotals.length === 0;

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
        <>
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TotalCard total={total} />
            {typeTotals.map((t) => (
              <TypeCard
                key={t.category}
                category={t.category}
                value={t.total}
                ratio={total > 0 ? (t.total / total) * 100 : 0}
              />
            ))}
          </section>
          <section className="space-y-4">
            <MonthlyTrendChart monthlyTotals={monthlyTotals} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <CategoryDonutChart typeTotals={typeTotals} />
              <CategoryBarChart typeTotals={typeTotals} />
              <TopActivitiesChart topActivities={topActivities} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

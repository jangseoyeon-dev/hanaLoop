import type { DashboardSummary } from "@/features/dashboard/types";
import { FilterBox } from "@/shared/components/filter/FilterBox";
import { TotalCard } from "@/shared/components/card/TotalCard";
import { TypeCard } from "@/shared/components/card/TypeCard";
import { EmptyState } from "@/shared/components/empty/EmptyState";

export default function Home() {
  const data: DashboardSummary = { total: 0, typeTotals: [] };
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

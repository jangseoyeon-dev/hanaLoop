import { dashboardMock } from "@/features/dashboard/mock";
import { FilterBox } from "@/shared/components/filter/FilterBox";
import { TotalCard } from "@/shared/components/card/TotalCard";
import { TypeCard } from "@/shared/components/card/TypeCard";

export default function Home() {
  const data = dashboardMock;
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
    </div>
  );
}

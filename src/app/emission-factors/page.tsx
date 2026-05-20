import { loadEmissionFactorData } from "./_lib/queries";
import { EmissionFactorTable } from "./_components/table/EmissionFactorTable";
import { AddVersionButton } from "./_components/button/AddVersionButton";
import { StatTile } from "@/shared/components/card/StatTile";

export const dynamic = "force-dynamic";

export default async function EmissionFactorsPage() {
  const { rows, stats } = await loadEmissionFactorData();
  const { totalVersions, activeCount, factorGroups } = stats;

  return (
    <div className="space-y-6 p-6 md:p-5">
      <header className="flex justify-between content-between space-y-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            배출계수 목록
          </h1>
          <p className="text-sm text-slate-500">
            활동별로 배출계수의 버전 이력을 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddVersionButton />
        </div>
      </header>

      <section className="mb-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="전체 버전"
          value={`${totalVersions}`}
          sub="누적 등록 건수"
          tone="muted"
        />
        <StatTile
          label="활성 계수"
          value={`${activeCount}`}
          sub="현재 적용 중"
          tone="brand"
        />
        <StatTile
          label="계수 종류"
          value={`${factorGroups}`}
          sub="활동 기준"
          tone="muted"
        />
      </section>

      <EmissionFactorTable rows={rows} />
    </div>
  );
}

import type { ActivitySearchParams } from "./_lib/types";
import { loadActivityData } from "./_lib/queries";
import { ActivityTable } from "./_components/table/ActivityTable";
import { AddDataButton } from "./_components/button/AddDataButton";
import { UploadButton } from "./_components/button/UploadButton";
import { FilterBox } from "@/shared/components/filter/FilterBox";
import { StatTile } from "@/shared/components/card/StatTile";
import { formatNumber } from "@/shared/lib/format";

export const dynamic = "force-dynamic";

export default async function DataManagement({
  searchParams,
}: {
  searchParams: Promise<ActivitySearchParams>;
}) {
  const filters = await searchParams;
  const { rows, stats, page, size } = await loadActivityData(filters);
  const { total, flaggedCount, totalCo2e } = stats;

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

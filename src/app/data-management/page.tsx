import type { Prisma } from "@prisma/client";
import type { ActivityRow } from "@/features/data-management/types";
import { ActivityTable } from "@/features/data-management/components/table/ActivityTable";
import { AddDataButton } from "@/features/data-management/components/button/AddDataButton";
import { UploadButton } from "@/features/data-management/components/button/UploadButton";
import { FilterBox } from "@/shared/components/filter/FilterBox";
import { formatNumber } from "@/shared/lib/format";
import { prisma } from "@/shared/lib/prisma";

export const dynamic = "force-dynamic";

type ActivityFilters = {
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

async function fetchActivityRows(
  filters: ActivityFilters,
): Promise<ActivityRow[]> {
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
    where.activityType = { category: filters.typeCode as Prisma.EnumActivityCategoryFilter };
  }
  if (filters.factorName) {
    where.activityType = {
      ...((where.activityType as object) ?? {}),
      name: filters.factorName,
    };
  }

  const records = await prisma.activityData.findMany({
    where,
    orderBy: [{ activityDate: "desc" }, { id: "desc" }],
    include: {
      activityType: { select: { code: true, name: true, category: true } },
      pcfResults: { select: { carbonEmission: true } },
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
      r.pcfResults.reduce((sum, p) => sum + p.carbonEmission, 0).toFixed(2),
    ),
    isDuplicate: r.isDuplicate,
    rowHash: r.rowHash ?? "",
  }));
}

export default async function DataManagement({
  searchParams,
}: {
  searchParams: Promise<ActivityFilters>;
}) {
  const filters = await searchParams;
  const rows = await fetchActivityRows(filters);
  const total = rows.length;
  const flaggedCount = rows.filter((r) => r.isDuplicate).length;
  const totalCo2e = rows
    .filter((r) => !r.isDuplicate)
    .reduce((sum, r) => sum + r.co2e, 0);

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
      <ActivityTable rows={rows} />
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "brand" | "warning" | "muted";
}) {
  const accent =
    tone === "brand"
      ? "text-brand-700"
      : tone === "warning"
      ? "text-amber-700"
      : "text-slate-700";
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-400">{sub}</div>
    </div>
  );
}

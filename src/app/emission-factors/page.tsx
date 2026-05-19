import type { EmissionFactorRow } from "@/features/emission-factors/types";
import type { ActivityType } from "@/shared/components/card/TypeCard";
import { prisma } from "@/shared/lib/prisma";
import { EmissionFactorTable } from "@/features/emission-factors/components/table/EmissionFactorTable";
import { AddVersionButton } from "@/features/emission-factors/components/button/AddVersionButton";

export const dynamic = "force-dynamic";

const KNOWN_TYPES: ReadonlySet<ActivityType> = new Set([
  "ELECTRICITY",
  "MATERIAL",
  "TRANSPORT",
]);

async function fetchRows(): Promise<EmissionFactorRow[]> {
  const records = await prisma.emissionFactor.findMany({
    include: { activityType: { select: { code: true } } },
    orderBy: [
      { activityTypeId: "asc" },
      { factorName: "asc" },
      { version: "desc" },
    ],
  });

  return records
    .filter((r) => KNOWN_TYPES.has(r.activityType.code as ActivityType))
    .map((r) => ({
      id: r.id,
      type: r.activityType.code as ActivityType,
      factorName: r.factorName,
      factor: r.factor,
      unit: r.unit,
      version: r.version,
      startDate: r.startDate ? r.startDate.toISOString().slice(0, 10) : "",
      endDate: r.endDate ? r.endDate.toISOString().slice(0, 10) : null,
      createdAt: r.createdAt.toISOString().slice(0, 10),
    }));
}

export default async function EmissionFactorsPage() {
  const rows = await fetchRows();
  const totalVersions = rows.length;
  const activeCount = rows.filter((r) => r.endDate === null).length;
  const factorGroups = new Set(rows.map((r) => `${r.type}|${r.factorName}`))
    .size;

  return (
    <div className="space-y-6 p-6 md:p-5">
      <header className="flex justify-between content-between space-y-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            배출계수 이력
          </h1>
          <p className="text-sm text-slate-500">
            활동 유형/계수명별로 배출계수의 버전 이력과 적용 기간을 관리합니다.
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
          sub="유형·계수명 기준"
          tone="muted"
        />
      </section>

      <EmissionFactorTable rows={rows} />
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

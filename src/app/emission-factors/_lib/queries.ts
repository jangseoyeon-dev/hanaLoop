import { prisma } from "@/shared/lib/prisma";
import type {
  EmissionFactorDataResult,
  EmissionFactorRow,
  EmissionFactorStats,
} from "./types";

async function fetchRows(): Promise<EmissionFactorRow[]> {
  const records = await prisma.emissionFactor.findMany({
    include: {
      activityType: { select: { code: true, name: true, category: true } },
    },
    orderBy: [{ activityTypeId: "asc" }, { version: "desc" }],
  });

  return records.map((r) => ({
    id: r.id,
    category: r.activityType.category,
    typeCode: r.activityType.code,
    typeName: r.activityType.name,
    factor: r.factor,
    unit: r.unit,
    version: r.version,
    isActive: r.isActive,
    startDate: r.startDate ? r.startDate.toISOString().slice(0, 10) : "",
    endDate: r.endDate ? r.endDate.toISOString().slice(0, 10) : null,
    createdAt: r.createdAt.toISOString().slice(0, 10),
  }));
}

/** 통계는 전체 버전 목록을 한 번에 조회하므로 행에서 직접 집계 */
function buildStats(rows: EmissionFactorRow[]): EmissionFactorStats {
  return {
    totalVersions: rows.length,
    activeCount: rows.filter((r) => r.isActive).length,
    factorGroups: new Set(rows.map((r) => r.typeCode)).size,
  };
}

/** 배출계수 페이지 데이터 로딩 일체. */
export async function loadEmissionFactorData(): Promise<EmissionFactorDataResult> {
  const rows = await fetchRows();
  return { rows, stats: buildStats(rows) };
}

import type { ActivityCategory } from "@/app/(dashboard)/_components/TypeCard";

export type EmissionFactorRow = {
  id: number;
  category: ActivityCategory;
  typeCode: string;
  typeName: string;
  factor: number;
  unit: string;
  version: number;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  createdAt: string;
};

/** 상단 통계: 전체 버전 수·활성 계수 수·계수 종류 수 */
export type EmissionFactorStats = {
  totalVersions: number;
  activeCount: number;
  factorGroups: number;
};

/** 페이지 렌더에 필요한 행·통계 일체 */
export type EmissionFactorDataResult = {
  rows: EmissionFactorRow[];
  stats: EmissionFactorStats;
};

import type { ActivityCategory } from "@/app/(dashboard)/_components/TypeCard";
import type { FilterValues } from "@/shared/components/filter/types";

export type ActivityRow = {
  id: number;
  activityDate: string;
  category: ActivityCategory;
  typeName: string;
  description: string;
  amount: number;
  unit: string;
  co2e: number;
  factor: number | null;
  factorUnit: string | null;
  isDuplicate: boolean;
  rowHash: string;
};

/** FilterBox 필터에 페이지네이션 쿼리를 더한 페이지 검색 파라미터 */
export type ActivitySearchParams = FilterValues & {
  page?: string;
  size?: string;
};

/** 필터 전체(현재 페이지가 아닌) 기준으로 집계된 상단 통계 */
export type ActivityStats = {
  total: number;
  flaggedCount: number;
  totalCo2e: number;
};

/** 페이지 렌더에 필요한 행·통계·보정된 페이지 정보 일체 */
export type ActivityDataResult = {
  rows: ActivityRow[];
  stats: ActivityStats;
  page: number;
  size: number;
};

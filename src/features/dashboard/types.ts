import type { ActivityType } from "@/shared/components/card/TypeCard";

export type TypeTotal = {
  type: ActivityType;
  total: number;
};

export type DashboardSummary = {
  total: number;
  typeTotals: TypeTotal[];
};

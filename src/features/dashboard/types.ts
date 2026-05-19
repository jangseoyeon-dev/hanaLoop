import type { ActivityCategory } from "@/shared/components/card/TypeCard";

export type TypeTotal = {
  category: ActivityCategory;
  total: number;
};

export type DashboardSummary = {
  total: number;
  typeTotals: TypeTotal[];
};

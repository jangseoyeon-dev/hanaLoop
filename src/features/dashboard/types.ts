import type { ActivityCategory } from "@/shared/components/card/TypeCard";

export type TypeTotal = {
  category: ActivityCategory;
  total: number;
};

export type MonthlyTotal = {
  month: string;
  total: number;
};

export type ActivityTotal = {
  name: string;
  category: ActivityCategory;
  total: number;
};

export type DashboardSummary = {
  total: number;
  typeTotals: TypeTotal[];
  monthlyTotals: MonthlyTotal[];
  topActivities: ActivityTotal[];
};

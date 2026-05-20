import type { ActivityCategory } from "@/app/(dashboard)/_components/TypeCard";

export type TypeTotal = {
  category: ActivityCategory;
  total: number;
};

export type MonthlyTotal = {
  month: string;
  total: number;
  byCategory: Record<ActivityCategory, number>;
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

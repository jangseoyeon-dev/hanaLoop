import type { ActivityType } from "@/shared/components/card/TypeCard";

export type TypeTotal = {
  type: ActivityType;
  total: number;
};

export type DashboardSummary = {
  total: number;
  typeTotals: TypeTotal[];
};

export const dashboardMock: DashboardSummary = {
  total: 8500,
  typeTotals: [
    { type: "ELECTRICITY", total: 4200 },
    { type: "MATERIAL", total: 2850 },
    { type: "TRANSPORT", total: 1450 },
  ],
};

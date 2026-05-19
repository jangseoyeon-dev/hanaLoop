import type { ActivityType } from "@/shared/components/card/TypeCard";

export type EmissionFactorRow = {
  id: number;
  type: ActivityType;
  factorName: string;
  factor: number;
  unit: string;
  version: number;
  startDate: string;
  endDate: string | null;
  createdAt: string;
};

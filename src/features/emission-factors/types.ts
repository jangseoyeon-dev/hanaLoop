import type { ActivityCategory } from "@/shared/components/card/TypeCard";

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

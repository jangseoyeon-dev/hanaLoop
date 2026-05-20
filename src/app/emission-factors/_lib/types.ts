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

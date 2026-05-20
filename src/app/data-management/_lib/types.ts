import type { ActivityCategory } from "@/app/(dashboard)/_components/TypeCard";

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

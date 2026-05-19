import type { ActivityCategory } from "@/shared/components/card/TypeCard";

export type ActivityRow = {
  id: number;
  activityDate: string;
  category: ActivityCategory;
  typeName: string;
  description: string;
  amount: number;
  unit: string;
  co2e: number;
  isDuplicate: boolean;
  rowHash: string;
};

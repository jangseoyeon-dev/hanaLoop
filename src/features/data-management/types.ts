import type { ActivityType } from "@/shared/components/card/TypeCard";

export type ActivityRow = {
  id: number;
  activityDate: string;
  type: ActivityType;
  description: string;
  amount: number;
  unit: string;
  co2e: number;
  isDuplicate: boolean;
  rowHash: string;
};

import { ActivityCategory } from "@prisma/client";

const KOREAN_TO_CATEGORY: Record<string, ActivityCategory> = {
  전기: ActivityCategory.ELECTRICITY,
  원소재: ActivityCategory.MATERIAL,
  운송: ActivityCategory.TRANSPORT,
};

export const CATEGORY_TO_KOREAN: Record<ActivityCategory, string> = {
  [ActivityCategory.ELECTRICITY]: "전기",
  [ActivityCategory.MATERIAL]: "원소재",
  [ActivityCategory.TRANSPORT]: "운송",
};

export function resolveCategory(input: string): ActivityCategory | null {
  const trimmed = input.trim();
  if (trimmed in ActivityCategory) {
    return trimmed as ActivityCategory;
  }
  return KOREAN_TO_CATEGORY[trimmed] ?? null;
}

"use client";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterField } from "./FilterField";
import {
  TYPE_LABEL,
  type ActivityCategory,
} from "@/shared/components/card/TypeCard";

const CATEGORY_ORDER: ActivityCategory[] = [
  "ELECTRICITY",
  "MATERIAL",
  "TRANSPORT",
];

type ActivityTypeOption = {
  id: number;
  code: string;
  name: string;
  category: ActivityCategory;
};

export function FilterBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const selectedCategory = searchParams.get("typeCode") ?? "";
  const selectedName = searchParams.get("factorName") ?? "";

  const [types, setTypes] = useState<ActivityTypeOption[]>([]);

  const updateParam = (patch: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  };

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/activity-types", {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`activity-types HTTP ${res.status}`);
        const json = (await res.json().catch(() => null)) as {
          data?: ActivityTypeOption[];
        } | null;
        setTypes(json?.data ?? []);
      } catch (e) {
        if ((e as Error).name !== "AbortError") console.error(e);
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedName || types.length === 0) return;
    const stillValid = types.some(
      (t) =>
        t.name === selectedName &&
        (!selectedCategory || t.category === selectedCategory),
    );
    if (!stillValid) updateParam({ factorName: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedName, types]);

  const filteredNames = selectedCategory
    ? types.filter((t) => t.category === selectedCategory)
    : types;

  const hasActiveFilter = Boolean(
    startDate || endDate || selectedCategory || selectedName,
  );

  const resetFilters = () => {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <FilterField label="시작일">
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            className="w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            onChange={(e) => updateParam({ startDate: e.target.value })}
          />
        </FilterField>
        <FilterField label="종료일">
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            className="w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            onChange={(e) => updateParam({ endDate: e.target.value })}
          />
        </FilterField>
        <FilterField label="활동유형">
          <select
            value={selectedCategory}
            onChange={(e) =>
              updateParam({ typeCode: e.target.value, factorName: "" })
            }
            className="w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">전체</option>
            {CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>
                {TYPE_LABEL[cat]}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="활동">
          <select
            value={selectedName}
            onChange={(e) => updateParam({ factorName: e.target.value })}
            className="w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">전체</option>
            {filteredNames.map((t) => (
              <option key={t.code} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </FilterField>
        <button
          type="button"
          onClick={resetFilters}
          disabled={!hasActiveFilter}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
        >
          초기화
        </button>
      </div>
    </div>
  );
}

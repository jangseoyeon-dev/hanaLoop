"use client";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterField } from "./FilterField";

type ActivityTypeOption = { id: number; code: string; name: string };
type EmissionFactorOption = { factorName: string; typeCode: string };

export function FilterBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const selectedType = searchParams.get("typeCode") ?? "";
  const selectedProduct = searchParams.get("factorName") ?? "";

  const [types, setTypes] = useState<ActivityTypeOption[]>([]);
  const [factors, setFactors] = useState<EmissionFactorOption[]>([]);

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
        const [typesRes, factorsRes] = await Promise.all([
          fetch("/api/activity-types", { signal: controller.signal }),
          fetch("/api/emission-factors", { signal: controller.signal }),
        ]);
        if (!typesRes.ok) {
          throw new Error(`activity-types HTTP ${typesRes.status}`);
        }
        if (!factorsRes.ok) {
          throw new Error(`emission-factors HTTP ${factorsRes.status}`);
        }
        const typesJson = (await typesRes.json().catch(() => null)) as {
          data?: ActivityTypeOption[];
        } | null;
        const factorsJson = (await factorsRes.json().catch(() => null)) as {
          data?: EmissionFactorOption[];
        } | null;
        setTypes(typesJson?.data ?? []);
        setFactors(factorsJson?.data ?? []);
      } catch (e) {
        if ((e as Error).name !== "AbortError") console.error(e);
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedProduct || factors.length === 0) return;
    const stillValid = factors.some(
      (f) =>
        f.factorName === selectedProduct &&
        (!selectedType || f.typeCode === selectedType),
    );
    if (!stillValid) updateParam({ factorName: "" });
    // updateParam은 stable하지 않지만, 의존성에 넣으면 매 렌더마다 재실행 — selectedType/Product/factors 기준으로만 동작하면 충분.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, selectedProduct, factors]);

  const filteredProducts = selectedType
    ? factors.filter((f) => f.typeCode === selectedType)
    : factors;

  const hasActiveFilter = Boolean(
    startDate || endDate || selectedType || selectedProduct,
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
            value={selectedType}
            onChange={(e) =>
              updateParam({ typeCode: e.target.value, factorName: "" })
            }
            className="w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">전체</option>
            {types.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="제품/품목">
          <select
            value={selectedProduct}
            onChange={(e) => updateParam({ factorName: e.target.value })}
            className="w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">전체</option>
            {filteredProducts.map((p) => (
              <option
                key={`${p.typeCode}|${p.factorName}`}
                value={p.factorName}
              >
                {p.factorName}
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

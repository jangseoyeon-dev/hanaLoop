"use client";

import { useEffect, useMemo, useState } from "react";
import type { EmissionFactorRow } from "@/features/emission-factors/types";
import { TYPE_LABEL } from "@/shared/components/card/TypeCard";
import { formatNumber } from "@/shared/lib/format";
import { Pagination } from "@/features/data-management/components/table/Pagination";
import { Th } from "@/features/data-management/components/table/Th";

const DEFAULT_PAGE_SIZE = 8;

export function EmissionFactorTable({ rows }: { rows: EmissionFactorRow[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        if (a.factorName !== b.factorName)
          return a.factorName.localeCompare(b.factorName);
        return b.version - a.version;
      }),
    [rows],
  );

  useEffect(() => {
    setPage(1);
  }, [rows, pageSize]);

  const start = (page - 1) * pageSize;
  const paginated = sorted.slice(start, start + pageSize);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
      <div className="h-85 overflow-y-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <Th>유형</Th>
              <Th>계수명</Th>
              <Th align="right">factor</Th>
              <Th>단위</Th>
              <Th align="right">버전</Th>
              <Th>적용 시작일</Th>
              <Th>적용 종료일</Th>
              <Th>상태</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((r) => {
              const isActive = r.endDate === null;
              return (
                <tr
                  key={r.id}
                  className="text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <td className="px-3 py-2">{TYPE_LABEL[r.type]}</td>
                  <td className="px-3 py-2">{r.factorName}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatNumber(r.factor)}
                  </td>
                  <td className="px-3 py-2 text-slate-500">{r.unit}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    v{r.version}
                  </td>
                  <td className="px-3 py-2 text-slate-500">{r.startDate}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {r.endDate ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {isActive ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        활성
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        이전 버전
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={sorted.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}

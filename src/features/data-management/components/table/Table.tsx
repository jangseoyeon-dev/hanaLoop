"use client";

import { useEffect, useState } from "react";
import type { ActivityRow } from "@/features/data-management/mock";
import { formatNumber } from "@/shared/lib/format";
import { Pagination } from "./Pagination";
import { Th } from "./Th";

const DEFAULT_PAGE_SIZE = 8;

export function Table({
  rows,
  onRowClick,
}: {
  rows: ActivityRow[];
  onRowClick: (row: ActivityRow) => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [rows, pageSize]);

  const start = (page - 1) * pageSize;
  const paginated = rows.slice(start, start + pageSize);

  return (
    <>
      <div className="h-85 overflow-y-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <Th>발생일</Th>
              <Th>유형</Th>
              <Th>설명</Th>
              <Th align="right">수량</Th>
              <Th>단위</Th>
              <Th align="right">CO₂e (kg)</Th>
              <Th>상태</Th>
              <Th>rowHash</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((r) => (
              <tr
                key={r.id}
                onClick={() => onRowClick(r)}
                className="cursor-pointer text-slate-700 transition-colors hover:bg-slate-100"
              >
                <td className="px-3 py-2">{r.activityDate}</td>
                <td className="px-3 py-2">{r.type}</td>
                <td className="px-3 py-2">{r.description}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatNumber(r.amount)}
                </td>
                <td className="px-3 py-2 text-slate-500">{r.unit}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatNumber(r.co2e)}
                </td>
                <td className="px-3 py-2">
                  {r.isDuplicate ? (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      중복 후보
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      정상
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-400">
                  {r.rowHash}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={rows.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </>
  );
}

"use client";

import type { ActivityRow } from "@/features/data-management/mock";
import { formatNumber } from "@/shared/lib/format";
import { Th } from "./Th";

export function Table({
  rows,
  onRowClick,
}: {
  rows: ActivityRow[];
  onRowClick: (row: ActivityRow) => void;
}) {
  return (
    <>
      <table className="min-w-full text-sm">
        <thead>
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
          {rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => onRowClick(r)}
              className="cursor-pointer text-slate-700 transition-colors hover:bg-slate-50"
            >
              <td className="px-6 py-3">{r.activityDate}</td>
              <td className="px-6 py-3">{r.type}</td>
              <td className="px-6 py-3">{r.description}</td>
              <td className="px-6 py-3 text-right tabular-nums">
                {formatNumber(r.amount)}
              </td>
              <td className="px-6 py-3 text-slate-500">{r.unit}</td>
              <td className="px-6 py-3 text-right tabular-nums">
                {formatNumber(r.co2e)}
              </td>
              <td className="px-6 py-3">
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
              <td className="px-6 py-3 font-mono text-xs text-slate-400">
                {r.rowHash}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

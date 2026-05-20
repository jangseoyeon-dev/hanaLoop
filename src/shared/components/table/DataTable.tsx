"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Th } from "./Th";
import { Pagination } from "./Pagination";

export type Column<T> = {
  /** 헤더 셀 내용 */
  header: ReactNode;
  /** 셀 렌더러 */
  cell: (row: T) => ReactNode;
  /** 우측 정렬(숫자형). 헤더·셀에 text-right + tabular-nums 적용 */
  align?: "right";
  /** td에 추가할 클래스 */
  className?: string;
};

const DEFAULT_PAGE_SIZE = 8;

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  /** tr 클래스(기본 hover 포함). onRowClick이 있으면 cursor-pointer가 자동 추가됨 */
  rowClassName?: string;
  /** rows가 비었을 때 표시할 내용(없으면 빈 tbody) */
  emptyState?: ReactNode;
  /** 최외곽 래퍼 클래스 */
  className?: string;
};

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  rowClassName = "text-slate-700 transition-colors hover:bg-slate-50",
  emptyState,
  className,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [rows, pageSize]);

  const start = (page - 1) * pageSize;
  const paginated = rows.slice(start, start + pageSize);
  const isEmpty = rows.length === 0;

  return (
    <div className={className}>
      <div className="h-85 overflow-y-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              {columns.map((col, i) => (
                <Th key={i} align={col.align}>
                  {col.header}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isEmpty && emptyState ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-12">
                  {emptyState}
                </td>
              </tr>
            ) : (
              paginated.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`${onRowClick ? "cursor-pointer " : ""}${rowClassName}`}
                >
                  {columns.map((col, i) => (
                    <td
                      key={i}
                      className={`px-3 py-2${
                        col.align === "right" ? " text-right tabular-nums" : ""
                      }${col.className ? ` ${col.className}` : ""}`}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={rows.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}

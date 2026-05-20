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

/**
 * 서버 사이드 페이지네이션 설정. 지정하면 `rows`를 그대로(현재 페이지만 담겼다고
 * 가정) 렌더링하고, 페이지/표시 개수 변경은 콜백으로 위임한다. 미지정 시 기존처럼
 * `rows` 전체를 받아 클라이언트에서 잘라 보여준다.
 */
export type ServerPagination = {
  page: number;
  pageSize: number;
  /** 필터 전체 기준 총 건수 (현재 페이지 길이가 아님) */
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
};

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
  /** 지정 시 서버 사이드 페이지네이션 모드로 동작 */
  serverPagination?: ServerPagination;
};

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  rowClassName = "text-slate-700 transition-colors hover:bg-slate-50",
  emptyState,
  className,
  serverPagination,
}: DataTableProps<T>) {
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setClientPage(1);
  }, [rows, clientPageSize]);

  const isServer = Boolean(serverPagination);

  const page = serverPagination?.page ?? clientPage;
  const pageSize = serverPagination?.pageSize ?? clientPageSize;
  const total = serverPagination?.total ?? rows.length;
  const onPageChange = serverPagination?.onPageChange ?? setClientPage;
  const onPageSizeChange =
    serverPagination?.onPageSizeChange ?? setClientPageSize;

  // 서버 모드에서는 rows가 이미 현재 페이지만 담고 있으므로 자르지 않는다.
  const start = (page - 1) * pageSize;
  const paginated = isServer ? rows : rows.slice(start, start + pageSize);
  // 서버 모드: 현재 페이지가 비어도 다른 페이지엔 데이터가 있을 수 있으므로 total 기준.
  const isEmpty = isServer ? total === 0 : rows.length === 0;

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
      {total > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}

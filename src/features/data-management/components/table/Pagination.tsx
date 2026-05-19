"use client";

import { useState } from "react";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
};

const DEFAULT_OPTIONS = [5, 10, 20, 50];
const SIBLING_COUNT = 1;
const BOUNDARY_COUNT = 1;

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function buildPageItems(
  totalPages: number,
  current: number,
  siblings: number,
  boundaries: number,
): PageItem[] {
  const totalNumbers = boundaries * 2 + siblings * 2 + 3;
  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const startPages = Array.from({ length: boundaries }, (_, i) => i + 1);
  const endPages = Array.from(
    { length: boundaries },
    (_, i) => totalPages - boundaries + i + 1,
  );

  const siblingStart = Math.max(
    Math.min(current - siblings, totalPages - boundaries - siblings * 2 - 1),
    boundaries + 2,
  );
  const siblingEnd = Math.min(
    Math.max(current + siblings, boundaries + siblings * 2 + 2),
    totalPages - boundaries - 1,
  );

  const items: PageItem[] = [...startPages];
  if (siblingStart > boundaries + 2) {
    items.push("ellipsis-start");
  } else if (boundaries + 1 < totalPages - boundaries) {
    items.push(boundaries + 1);
  }

  for (let p = siblingStart; p <= siblingEnd; p++) {
    items.push(p);
  }

  if (siblingEnd < totalPages - boundaries - 1) {
    items.push("ellipsis-end");
  } else if (totalPages - boundaries > boundaries) {
    items.push(totalPages - boundaries);
  }

  items.push(...endPages);
  return items;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_OPTIONS,
}: Props) {
  const [selectedSize, setSelectedSize] = useState<string>("");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const pageItems = buildPageItems(
    totalPages,
    page,
    SIBLING_COUNT,
    BOUNDARY_COUNT,
  );

  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-100 py-3">
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <div>
          전체 <span className="font-medium text-slate-700">{total}</span>건 중{" "}
          <span className="font-medium text-slate-700">
            {startIdx}–{endIdx}
          </span>
        </div>
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5">
            <span>표시</span>
            <select
              value={selectedSize}
              onChange={(e) => {
                setSelectedSize(e.target.value);
                onPageSizeChange(Number(e.target.value));
              }}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              aria-label="페이지당 행 수"
            >
              <option value="" disabled hidden>
                선택
              </option>
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>개</span>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label="이전 페이지"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500"
        >
          ‹
        </button>
        {pageItems.map((item) => {
          if (item === "ellipsis-start" || item === "ellipsis-end") {
            return (
              <span
                key={item}
                aria-hidden="true"
                className="inline-flex h-8 min-w-8 items-center justify-center px-1 text-xs text-slate-400"
              >
                …
              </span>
            );
          }
          return (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
              className={
                "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors " +
                (item === page
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
              }
            >
              {item}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          aria-label="다음 페이지"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500"
        >
          ›
        </button>
      </div>
    </div>
  );
}

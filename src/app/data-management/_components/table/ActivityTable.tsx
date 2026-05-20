"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ActivityRow } from "../../_lib/types";
import { formatNumber } from "@/shared/lib/format";
import { TYPE_LABEL } from "@/app/(dashboard)/_components/TypeCard";
import { DataTable, type Column } from "@/shared/components/table/DataTable";
import { CalculationBasisModal } from "../modal/CalculationBasisModal";

const columns: Column<ActivityRow>[] = [
  { header: "발생일", cell: (r) => r.activityDate },
  { header: "유형", cell: (r) => TYPE_LABEL[r.category] },
  { header: "활동", cell: (r) => r.typeName },
  { header: "설명", className: "text-slate-500", cell: (r) => r.description },
  { header: "수량", align: "right", cell: (r) => formatNumber(r.amount) },
  { header: "단위", className: "text-slate-500", cell: (r) => r.unit },
  { header: "CO₂e (kg)", align: "right", cell: (r) => formatNumber(r.co2e) },
  {
    header: "상태",
    cell: (r) =>
      r.isDuplicate ? (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
          중복 후보
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
          정상
        </span>
      ),
  },
  {
    header: "rowHash",
    className: "font-mono text-xs text-slate-400",
    cell: (r) => r.rowHash,
  },
];

type ActivityTableProps = {
  rows: ActivityRow[];
  page: number;
  pageSize: number;
  total: number;
};

export function ActivityTable({
  rows,
  page,
  pageSize,
  total,
}: ActivityTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ActivityRow | null>(null);

  const openRow = (r: ActivityRow) => {
    setSelectedRow(r);
    setIsModalOpen(true);
  };

  // 페이지/표시 개수를 URL 쿼리에 반영 → 서버에서 해당 구간만 다시 조회
  const updateParams = (patch: Record<string, string>) => {
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

  return (
    <>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        onRowClick={openRow}
        rowClassName="text-slate-700 transition-colors hover:bg-slate-100"
        className="overflow-x-auto mt-5"
        serverPagination={{
          page,
          pageSize,
          total,
          onPageChange: (next) => updateParams({ page: String(next) }),
          // 표시 개수 변경 시 1페이지로 리셋
          onPageSizeChange: (size) =>
            updateParams({ size: String(size), page: "1" }),
        }}
        emptyState={
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-slate-50 text-2xl">
              📭
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-700">
              등록된 활동 데이터가 없습니다
            </h3>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              우측 상단의 &quot;데이터 추가&quot; 또는 &quot;엑셀 업로드&quot;
              버튼으로 데이터를 등록해 보세요.
            </p>
          </div>
        }
      />
      <CalculationBasisModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        selectedRow={selectedRow}
      />
    </>
  );
}

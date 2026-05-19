"use client";

import {
  type ActivityRow,
  activityRowsMock,
} from "@/features/data-management/mock";
import { FilterBox } from "@/shared/components/Filter/FilterBox";
import { Table } from "@/shared/components/Table/Table";
import { formatNumber } from "@/shared/lib/format";
import { useState } from "react";
import { CalculationBasisModal } from "@/shared/components/modal/CalculationBasisModal";

export default function DataManagement() {
  const rows = activityRowsMock;
  const total = rows.length;
  const flaggedCount = rows.filter((r) => r.isDuplicate).length;
  const totalCo2e = rows
    .filter((r) => !r.isDuplicate)
    .reduce((sum, r) => sum + r.co2e, 0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ActivityRow | null>(null);
  const openRow = (r: ActivityRow) => {
    setSelectedRow(r);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 p-6 md:p-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          데이터 관리
        </h1>
        <p className="text-sm text-slate-500">
          탄소 배출 활동 데이터를 등록·수정·삭제하고 중복 항목을 검토합니다.
        </p>
      </header>
      <section className="mb-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="유효 건수 (집계 대상)"
          value={`${total - flaggedCount}`}
          sub="플래그 제외"
          tone="brand"
        />
        <StatTile
          label="플래그 건수"
          value={`${flaggedCount}`}
          sub={flaggedCount > 0 ? "검증 필요" : "이상 없음"}
          tone={flaggedCount > 0 ? "warning" : "muted"}
        />
        <StatTile
          label="필터 적용 CO₂e"
          value={`${formatNumber(totalCo2e)} kg`}
          sub="플래그 제외 누계"
          tone="muted"
        />
      </section>
      <div>
        <FilterBox />
        <div className="overflow-x-auto mt-5">
          <Table rows={rows} onRowClick={openRow} />
        </div>
      </div>

      <CalculationBasisModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        selectedRow={selectedRow}
      />
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "brand" | "warning" | "muted";
}) {
  const accent =
    tone === "brand"
      ? "text-brand-700"
      : tone === "warning"
      ? "text-amber-700"
      : "text-slate-700";
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-400">{sub}</div>
    </div>
  );
}

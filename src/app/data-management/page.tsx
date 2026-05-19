"use client";

import {
  type ActivityRow,
  activityRowsMock,
} from "@/features/data-management/mock";
import { FilterBox } from "@/shared/components/Filter/FilterBox";
import { Table } from "@/shared/components/Table/Table";
import { formatNumber } from "@/shared/lib/format";
import { useState } from "react";
import { LuPlus, LuUpload } from "react-icons/lu";
import { CalculationBasisModal } from "@/shared/components/modal/CalculationBasisModal";
import { AddDataModal } from "@/shared/components/modal/AddDataModal";

import * as XLSX from "xlsx";

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

  // 데이터 추가 모달 여부
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // 엑셀 업로드한 데이터
  const [excelData, setExcelData] = useState([]);
  console.log("excelData", excelData);

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event: any) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json: any = XLSX.utils.sheet_to_json(worksheet);
      setExcelData(json);
      console.log("변환된 데이터:", json);
    };
    if (file) {
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="space-y-6 p-6 md:p-5">
      <header className="flex justify-between content-between space-y-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            데이터 관리
          </h1>
          <p className="text-sm text-slate-500">
            탄소 배출 활동 데이터를 등록·수정·삭제하고 중복 항목을 검토합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-slate-900/10">
            <LuUpload className="h-4 w-4 text-slate-500" />
            엑셀 업로드
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
            onClick={() => setIsAddModalOpen(true)}
          >
            <LuPlus className="h-4 w-4" />
            데이터 추가
          </button>
        </div>
      </header>

      {/* 카드 영역 */}
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

      <FilterBox />
      <div className="overflow-x-auto mt-5">
        <Table rows={rows} onRowClick={openRow} />
      </div>
      {/* 각 로우 클릭시 계산 근거 모달 */}
      <CalculationBasisModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        selectedRow={selectedRow}
      />
      {/* 데이터 추가 모달 */}
      <AddDataModal
        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
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

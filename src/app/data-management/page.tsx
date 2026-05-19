"use client";

import {
  type ActivityRow,
  activityRowsMock,
} from "@/features/data-management/mock";
import { TYPE_LABEL } from "@/shared/components/card/TypeCard";
import { FilterBox } from "@/shared/components/Filter/FilterBox";
import { Table } from "@/shared/components/Table/Table";
import { formatNumber } from "@/shared/lib/format";
import { useState } from "react";
import Modal from "react-modal";

if (typeof window !== "undefined") {
  Modal.setAppElement("body");
}

export default function DataManagement() {
  const rows = activityRowsMock;
  const total = rows.length;
  const flaggedCount = rows.filter((r) => r.isDuplicate).length;
  const totalCo2e = rows
    .filter((r) => !r.isDuplicate)
    .reduce((sum, r) => sum + r.co2e, 0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ActivityRow | null>(null);
  const closeModal = () => setIsModalOpen(false);
  const openRow = (r: ActivityRow) => {
    setSelectedRow(r);
    setIsModalOpen(true);
  };

  const factor =
    selectedRow && selectedRow.amount > 0
      ? selectedRow.co2e / selectedRow.amount
      : 0;

  return (
    <div className="space-y-6 p-6 md:p-8">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          데이터 관리
        </h1>
        <p className="text-sm text-slate-500">
          탄소 배출 활동 데이터를 등록·수정·삭제하고 중복 항목을 검토합니다.
        </p>
      </header>
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
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

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        shouldCloseOnOverlayClick
        shouldCloseOnEsc
        contentLabel="활동 데이터 상세"
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      >
        {selectedRow && (
          <>
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                    계산 근거
                  </h2>
                  {selectedRow.isDuplicate ? (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      중복 후보
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      정상
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="닫기"
                className="-mr-2 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto px-6 py-5">
              <div className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/40 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                  CO₂e 계산
                </div>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-slate-700">
                  <span className="font-medium tabular-nums">
                    {formatNumber(selectedRow.amount)} {selectedRow.unit}
                  </span>
                  <span className="text-slate-400">×</span>
                  <span className="tabular-nums">
                    {factor.toFixed(3)}
                    <span className="ml-1 text-xs text-slate-500">
                      kgCO₂e / {selectedRow.unit}
                    </span>
                  </span>
                  <span className="text-slate-400">=</span>
                  <span className="text-base font-semibold tabular-nums text-slate-900">
                    {formatNumber(selectedRow.co2e)} kg
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  활동 정보
                </h3>
                <dl className="mt-2 divide-y divide-slate-100 text-sm">
                  <DetailRow label="발생일" value={selectedRow.activityDate} />
                  <DetailRow
                    label="유형"
                    value={TYPE_LABEL[selectedRow.type]}
                  />
                  <DetailRow label="설명" value={selectedRow.description} />
                  <DetailRow
                    label="수량"
                    value={`${formatNumber(selectedRow.amount)} ${
                      selectedRow.unit
                    }`}
                  />
                </dl>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <span aria-hidden="true">ⓘ</span> PCF란?
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  <strong className="font-semibold text-slate-800">
                    PCF (Product Carbon Footprint)
                  </strong>
                  는 제품 한 단위가 원료 채취·생산·운송·사용·폐기 전 과정에서
                  배출하는 온실가스 총량을 kg CO₂e 로 환산한 값입니다.
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  각 행의 CO₂e는{" "}
                  <span className="font-medium text-slate-800">
                    활동량 × 발생일 시점의 유효 배출계수
                  </span>
                  로 계산되며, 중복 후보로 표시된 행은 집계에서 제외됩니다.
                </p>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

function DetailRow({
  label,
  value,
  tone,
  mono,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warning";
  mono?: boolean;
}) {
  const valueClass =
    tone === "warning"
      ? "text-amber-700"
      : tone === "ok"
      ? "text-emerald-700"
      : "text-slate-900";
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd
        className={`${valueClass} ${
          mono ? "font-mono text-xs" : "text-sm font-medium"
        }`}
      >
        {value}
      </dd>
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
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-400">{sub}</div>
    </div>
  );
}

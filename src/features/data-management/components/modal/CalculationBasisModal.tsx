"use client";
import Modal from "react-modal";
import { type ActivityRow } from "@/features/data-management/types";
import { TYPE_LABEL } from "@/shared/components/card/TypeCard";

import { formatNumber } from "@/shared/lib/format";

if (typeof window !== "undefined") {
  Modal.setAppElement("body");
}

export function CalculationBasisModal({
  isModalOpen,
  setIsModalOpen,
  selectedRow,
}: {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedRow: ActivityRow | null;
}) {
  const closeModal = () => setIsModalOpen(false);

  const factor =
    selectedRow && selectedRow.amount > 0
      ? selectedRow.co2e / selectedRow.amount
      : 0;

  return (
    <Modal
      isOpen={isModalOpen}
      onRequestClose={closeModal}
      shouldCloseOnOverlayClick
      shouldCloseOnEsc
      contentLabel="활동 데이터 상세"
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      preventScroll
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
                  value={TYPE_LABEL[selectedRow.category]}
                />
                <DetailRow label="활동" value={selectedRow.typeName} />
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

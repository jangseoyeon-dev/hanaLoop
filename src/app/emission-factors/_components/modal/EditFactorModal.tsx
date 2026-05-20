"use client";

import Modal from "react-modal";

if (typeof window !== "undefined") {
  Modal.setAppElement("#app-root");
}

export type EditTarget = {
  id: number;
  label: string;
  factor: string;
  unit: string;
  isActive: boolean;
};

type Props = {
  target: EditTarget | null;
  error: string | null;
  busy: boolean;
  onChange: (patch: Partial<EditTarget>) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function EditFactorModal({
  target,
  error,
  busy,
  onChange,
  onCancel,
  onSubmit,
}: Props) {
  return (
    <Modal
      isOpen={target !== null}
      onRequestClose={onCancel}
      shouldCloseOnOverlayClick={!busy}
      shouldCloseOnEsc={!busy}
      contentLabel="배출계수 수정"
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      preventScroll
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex flex-col"
      >
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            배출계수 수정
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {target?.isActive
              ? "활성 버전을 수정하면 해당 활동의 모든 PCF가 새 factor 기준으로 즉시 재계산됩니다."
              : "비활성 버전의 값만 수정합니다. PCF에는 영향이 없습니다."}
          </p>
        </div>
        <div className="space-y-4 px-6 py-5 text-sm">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              수정 대상
            </div>
            <div className="mt-1 font-medium text-slate-900">
              {target?.label}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_160px] gap-3">
            <label className="block">
              <span className="mb-1 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                factor <span className="text-rose-500">*</span>
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={target?.factor ?? ""}
                onChange={(e) =>
                  onChange({ factor: e.target.value.replace(/[^0-9.]/g, "") })
                }
                placeholder="0.000"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                단위 <span className="text-rose-500">*</span>
              </span>
              <input
                type="text"
                value={target?.unit ?? ""}
                onChange={(e) => onChange({ unit: e.target.value })}
                placeholder="kgCO₂e/kWh"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </label>
          </div>

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/40 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "저장 중…" : "저장"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

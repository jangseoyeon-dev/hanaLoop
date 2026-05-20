"use client";

import Modal from "react-modal";

if (typeof window !== "undefined") {
  Modal.setAppElement("#app-root");
}

export type DeleteTarget = {
  id: number;
  label: string;
  isActive: boolean;
  isLastVersion: boolean;
};

type Props = {
  target: DeleteTarget | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteFactorModal({ target, busy, onCancel, onConfirm }: Props) {
  return (
    <Modal
      isOpen={target !== null}
      onRequestClose={onCancel}
      shouldCloseOnOverlayClick={!busy}
      shouldCloseOnEsc={!busy}
      contentLabel="배출계수 삭제 확인"
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      preventScroll
    >
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          배출계수 삭제
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {target?.isActive
            ? "활성 버전을 삭제하면 가장 최근 버전이 자동으로 활성으로 승계되고, 해당 활동의 모든 PCF가 재계산됩니다."
            : "비활성 버전을 삭제합니다. PCF에는 영향이 없습니다."}
        </p>
      </div>
      <div className="space-y-3 px-6 py-5 text-sm">
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            삭제 대상
          </div>
          <div className="mt-1 font-medium text-slate-900">{target?.label}</div>
        </div>
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-700">
          삭제 후에는 되돌릴 수 없습니다.
        </p>
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
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "삭제 중…" : "삭제"}
        </button>
      </div>
    </Modal>
  );
}

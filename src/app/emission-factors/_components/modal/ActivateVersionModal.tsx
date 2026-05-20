"use client";

import Modal from "react-modal";

if (typeof window !== "undefined") {
  Modal.setAppElement("#app-root");
}

type Props = {
  isOpen: boolean;
  label?: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ActivateVersionModal({
  isOpen,
  label,
  busy,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onCancel}
      shouldCloseOnOverlayClick={!busy}
      shouldCloseOnEsc={!busy}
      contentLabel="활성 버전 전환 확인"
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      preventScroll
    >
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          활성 버전 전환
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          선택한 버전을 활성으로 전환하면 해당 활동의 모든 PCF가 즉시
          재계산됩니다.
        </p>
      </div>
      <div className="space-y-3 px-6 py-5 text-sm">
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            전환 대상
          </div>
          <div className="mt-1 font-medium text-slate-900">{label}</div>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          이전에 활성이었던 버전은 자동으로 비활성 처리되며, 비활성으로 바뀐
          버전을 다시 클릭하면 원래대로 되돌릴 수 있습니다.
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
          className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "전환 중…" : "활성화"}
        </button>
      </div>
    </Modal>
  );
}

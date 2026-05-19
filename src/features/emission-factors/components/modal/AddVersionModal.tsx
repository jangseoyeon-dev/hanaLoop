"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "react-modal";
import { TYPE_LABEL, type ActivityType } from "@/shared/components/card/TypeCard";

if (typeof window !== "undefined") {
  Modal.setAppElement("body");
}

const TYPE_OPTIONS: { value: ActivityType; label: string }[] = (
  Object.keys(TYPE_LABEL) as ActivityType[]
).map((code) => ({ value: code, label: TYPE_LABEL[code] }));

export function AddVersionModal({
  isAddModalOpen,
  setIsAddModalOpen,
}: {
  isAddModalOpen: boolean;
  setIsAddModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const closeModal = () => setIsAddModalOpen(false);

  const INITIAL_FORM = {
    type: "" as ActivityType | "",
    factorName: "",
    factor: "",
    unit: "",
    startDate: "",
  };

  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateField = <K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/emission-factors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          factorName: form.factorName.trim(),
          factor: Number(form.factor),
          unit: form.unit.trim(),
          startDate: form.startDate,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "버전 등록에 실패했습니다.");
      }
      setForm(INITIAL_FORM);
      closeModal();
      router.refresh();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "버전 등록에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isAddModalOpen}
      onRequestClose={closeModal}
      shouldCloseOnOverlayClick
      shouldCloseOnEsc
      contentLabel="배출계수 버전 등록"
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      preventScroll
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              배출계수 버전 등록
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              새 버전을 등록하면 동일 계수의 이전 버전은 자동으로 마감됩니다.
            </p>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          <Field label="활동 유형" required>
            <select
              value={form.type}
              onChange={(e) =>
                updateField("type", e.target.value as ActivityType)
              }
              required
              className={inputClass}
            >
              <option value="" disabled>
                선택
              </option>
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="계수명" required>
            <input
              type="text"
              value={form.factorName}
              onChange={(e) => updateField("factorName", e.target.value)}
              placeholder="예: 한국전력, 플라스틱 1, 트럭"
              required
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-[1fr_160px] gap-3">
            <Field label="factor" required>
              <input
                type="text"
                inputMode="decimal"
                value={form.factor}
                onChange={(e) =>
                  updateField("factor", e.target.value.replace(/[^0-9.]/g, ""))
                }
                placeholder="0.000"
                required
                className={`${inputClass} tabular-nums`}
              />
            </Field>
            <Field label="단위" required>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => updateField("unit", e.target.value)}
                placeholder="kgCO₂e/kWh"
                required
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="적용 시작일" required>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => updateField("startDate", e.target.value)}
              required
              className={inputClass}
            />
          </Field>

          {errorMessage && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/40 px-6 py-4">
          <button
            type="button"
            onClick={closeModal}
            disabled={isSubmitting}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "등록 중…" : "버전 등록"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

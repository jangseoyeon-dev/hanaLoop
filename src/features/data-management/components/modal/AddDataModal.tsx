"use client";

import { useState } from "react";
import Modal from "react-modal";

type ActivityTypeValue = "ELECTRICITY" | "MATERIAL" | "TRANSPORT";

const TYPE_OPTIONS: { value: ActivityTypeValue; label: string }[] = [
  { value: "ELECTRICITY", label: "전기" },
  { value: "MATERIAL", label: "원소재" },
  { value: "TRANSPORT", label: "운송" },
];

export function AddDataModal({
  isAddModalOpen,
  setIsAddModalOpen,
}: {
  isAddModalOpen: boolean;
  setIsAddModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const closeModal = () => setIsAddModalOpen(false);

  const INITIAL_FORM = {
    activity_date: "",
    activity_type: "" as ActivityTypeValue | "",
    description: "",
    amount: "",
    unit: "",
  };

  const [form, setForm] = useState(INITIAL_FORM);

  const updateField = <K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log({
      ...form,
      amount: Number(form.amount),
    });
    setForm(INITIAL_FORM);
    closeModal();
  };

  return (
    <Modal
      isOpen={isAddModalOpen}
      onRequestClose={closeModal}
      shouldCloseOnOverlayClick
      shouldCloseOnEsc
      contentLabel="데이터 추가"
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      preventScroll
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              데이터 추가
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              새로운 탄소 배출 활동 데이터를 입력합니다.
            </p>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          <Field label="발생일" required>
            <input
              type="date"
              value={form.activity_date}
              onChange={(e) => updateField("activity_date", e.target.value)}
              required
              className={inputClass}
            />
          </Field>

          <Field label="유형" required>
            <select
              value={form.activity_type}
              onChange={(e) =>
                updateField("activity_type", e.target.value as ActivityTypeValue)
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

          <Field label="설명" required>
            <input
              type="text"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="예: 한국전력, 플라스틱 1, 트럭"
              required
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-[1fr_140px] gap-3">
            <Field label="수량" required>
              <input
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) =>
                  updateField("amount", e.target.value.replace(/[^0-9.]/g, ""))
                }
                placeholder="0"
                required
                className={`${inputClass} tabular-nums`}
              />
            </Field>
            <Field label="단위" required>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => updateField("unit", e.target.value)}
                placeholder="kWh, kg, ton-km"
                required
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/40 px-6 py-4">
          <button
            type="button"
            onClick={closeModal}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10"
          >
            취소
          </button>
          <button
            type="submit"
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
            onClick={() => {
              console.log("추가");
            }}
          >
            추가
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

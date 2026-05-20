"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "react-modal";
import { CATEGORY_TO_KOREAN } from "@/features/activity/lib/category";
import {
  TYPE_LABEL,
  type ActivityCategory,
} from "@/shared/components/card/TypeCard";

if (typeof window !== "undefined") {
  Modal.setAppElement("#app-root");
}

const CATEGORY_ORDER: ActivityCategory[] = [
  "ELECTRICITY",
  "MATERIAL",
  "TRANSPORT",
];

type ActivityTypeOption = {
  code: string;
  name: string;
  category: ActivityCategory;
  unit: string;
};

export function AddVersionModal({
  isAddModalOpen,
  setIsAddModalOpen,
}: {
  isAddModalOpen: boolean;
  setIsAddModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const router = useRouter();

  const INITIAL_FORM = {
    category: "" as ActivityCategory | "",
    name: "",
    factor: "",
    unit: "",
  };

  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [typeOptions, setTypeOptions] = useState<ActivityTypeOption[]>([]);

  const closeModal = () => {
    setForm(INITIAL_FORM);
    setErrorMessage(null);
    setIsAddModalOpen(false);
  };

  useEffect(() => {
    if (!isAddModalOpen) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/emission-factors", {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`emission-factors HTTP ${res.status}`);
        const json = (await res.json().catch(() => null)) as {
          data?: ActivityTypeOption[];
        } | null;
        setTypeOptions(json?.data ?? []);
      } catch (e) {
        if ((e as Error).name !== "AbortError") console.error(e);
      }
    })();
    return () => controller.abort();
  }, [isAddModalOpen]);

  const namesByCategory = useMemo(() => {
    const m = new Map<ActivityCategory, ActivityTypeOption[]>();
    for (const opt of typeOptions) {
      const arr = m.get(opt.category) ?? [];
      arr.push(opt);
      m.set(opt.category, arr);
    }
    return m;
  }, [typeOptions]);

  const updateField = <K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K]
  ) =>
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "category" && prev.category !== value) {
        next.name = "";
        next.unit = "";
      }
      if (key === "name" && typeof value === "string") {
        const matched = typeOptions.find(
          (opt) => opt.category === prev.category && opt.name === value
        );
        next.unit = matched ? matched.unit : "";
      }
      return next;
    });

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
          type: form.category,
          name: form.name,
          factor: Number(form.factor),
          unit: form.unit.trim(),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "등록에 실패했습니다.");
      }
      setForm(INITIAL_FORM);
      closeModal();
      router.refresh();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "등록에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const namesForSelected =
    form.category && form.category in TYPE_LABEL
      ? namesByCategory.get(form.category as ActivityCategory) ?? []
      : [];

  return (
    <Modal
      isOpen={isAddModalOpen}
      onRequestClose={closeModal}
      shouldCloseOnOverlayClick
      shouldCloseOnEsc
      contentLabel="배출계수 등록"
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      preventScroll
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              배출계수 등록
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              새 버전을 등록하면 해당 활동의 이전 버전은 자동으로 마감됩니다.
            </p>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          <Field label="활동 유형" required>
            <select
              value={form.category}
              onChange={(e) =>
                updateField("category", e.target.value as ActivityCategory)
              }
              required
              className={inputClass}
            >
              <option value="" disabled>
                선택
              </option>
              {CATEGORY_ORDER.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_TO_KOREAN[cat]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="활동" required>
            <select
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              disabled={!form.category}
              required
              className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
            >
              <option value="" disabled>
                {form.category ? "선택" : "활동 유형을 먼저 선택"}
              </option>
              {namesForSelected.map((opt) => (
                <option key={opt.code} value={opt.name}>
                  {opt.name}
                </option>
              ))}
            </select>
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
            <Field label="단위">
              <div
                aria-readonly="true"
                className={`flex h-9.5 cursor-not-allowed select-none items-center truncate rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm ${
                  form.unit ? "font-medium text-slate-600" : "text-slate-400"
                }`}
                title={form.unit || undefined}
              >
                {form.unit || "활동 선택 시 자동"}
              </div>
            </Field>
          </div>

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
            {isSubmitting ? "등록 중…" : "등록"}
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

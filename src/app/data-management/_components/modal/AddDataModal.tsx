"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "react-modal";
import { toast } from "sonner";
import { CATEGORY_TO_KOREAN, resolveCategory } from "@/shared/lib/category";
import {
  TYPE_LABEL,
  type ActivityCategory,
} from "@/app/(dashboard)/_components/TypeCard";

if (typeof window !== "undefined") {
  Modal.setAppElement("#app-root");
}

type ActivityTypeOption = {
  id: number;
  code: string;
  name: string;
  category: ActivityCategory;
  unit: string;
};

const UNIT_FORMAT = /^[A-Za-z0-9·²³./\-]+$/;
const CATEGORY_ORDER: ActivityCategory[] = [
  "ELECTRICITY",
  "MATERIAL",
  "TRANSPORT",
];

export function AddDataModal({
  isAddModalOpen,
  setIsAddModalOpen,
}: {
  isAddModalOpen: boolean;
  setIsAddModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const router = useRouter();

  const INITIAL_FORM = {
    activity_date: "",
    category: "" as ActivityCategory | "",
    name: "",
    amount: "",
    unit: "",
  };

  type FormState = typeof INITIAL_FORM;
  type FieldErrors = Partial<Record<keyof FormState, string>>;

  const UNIT_MAX = 50;
  const AMOUNT_MAX = 1_000_000_000;

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [typeOptions, setTypeOptions] = useState<ActivityTypeOption[]>([]);

  const closeModal = () => {
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setIsAddModalOpen(false);
  };

  useEffect(() => {
    if (!isAddModalOpen) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/activity-types", {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`activity-types HTTP ${res.status}`);
        }
        const json = (await res.json().catch(() => null)) as {
          data?: ActivityTypeOption[];
        } | null;
        setTypeOptions(json?.data ?? []);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.error(e);
          toast.error("활동 유형을 불러오지 못했습니다.");
        }
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

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
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
        if (matched) next.unit = matched.unit;
      }
      return next;
    });
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const cp = { ...prev };
      delete cp[key];
      return cp;
    });
  };

  const validate = (state: FormState): FieldErrors => {
    const errors: FieldErrors = {};

    if (!state.activity_date) {
      errors.activity_date = "발생일을 선택해 주세요.";
    } else if (Number.isNaN(new Date(state.activity_date).getTime())) {
      errors.activity_date = "올바른 날짜 형식이 아닙니다.";
    }

    if (!state.category) {
      errors.category = "활동 유형을 선택해 주세요.";
    }

    if (!state.name) {
      errors.name = "활동을 선택해 주세요.";
    } else if (
      state.category &&
      !typeOptions.some(
        (opt) => opt.category === state.category && opt.name === state.name
      )
    ) {
      errors.name = "유형과 일치하는 활동이 없습니다.";
    }

    const amountStr = state.amount.trim();
    if (!amountStr) {
      errors.amount = "수량을 입력해 주세요.";
    } else if ((amountStr.match(/\./g) ?? []).length > 1) {
      errors.amount = "소수점은 하나만 사용할 수 있습니다.";
    } else {
      const amount = Number(amountStr);
      if (!Number.isFinite(amount)) {
        errors.amount = "수량은 숫자여야 합니다.";
      } else if (amount <= 0) {
        errors.amount = "수량은 0보다 커야 합니다.";
      } else if (amount > AMOUNT_MAX) {
        errors.amount = `수량은 ${AMOUNT_MAX.toLocaleString()} 이하여야 합니다.`;
      }
    }

    const unit = state.unit.trim();
    if (!unit) {
      errors.unit = "단위를 입력해 주세요.";
    } else if (unit.length > UNIT_MAX) {
      errors.unit = `단위는 ${UNIT_MAX}자 이하여야 합니다.`;
    } else if (!UNIT_FORMAT.test(unit)) {
      errors.unit = "단위는 영문/숫자/·/²/³/-/. 만 사용할 수 있습니다.";
    } else if (state.category && state.name) {
      const expected = typeOptions.find(
        (opt) => opt.category === state.category && opt.name === state.name
      )?.unit;
      if (expected && unit.toLowerCase() !== expected.toLowerCase()) {
        errors.unit = `해당 활동의 단위는 "${expected}" 여야 합니다.`;
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (!form.category) return;
    const category = resolveCategory(form.category);
    if (!category) return;

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const res = await fetch("/api/activity-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_date: form.activity_date,
          activity_type: form.category,
          description: form.name,
          amount: Number(form.amount),
          unit: form.unit.trim(),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "데이터 추가에 실패했습니다.");
      }

      setForm(INITIAL_FORM);
      closeModal();
      toast.success("데이터가 추가되었습니다.");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "데이터 추가에 실패했습니다."
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
      contentLabel="데이터 추가"
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      preventScroll
    >
      <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
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
          <Field label="발생일" required error={fieldErrors.activity_date}>
            <input
              type="date"
              value={form.activity_date}
              onChange={(e) => updateField("activity_date", e.target.value)}
              aria-invalid={Boolean(fieldErrors.activity_date)}
              className={inputClassFor(fieldErrors.activity_date)}
            />
          </Field>

          <Field label="활동 유형" required error={fieldErrors.category}>
            <select
              value={form.category}
              onChange={(e) =>
                updateField("category", e.target.value as ActivityCategory)
              }
              aria-invalid={Boolean(fieldErrors.category)}
              className={inputClassFor(fieldErrors.category)}
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

          <Field label="설명 (활동)" required error={fieldErrors.name}>
            <select
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              disabled={!form.category}
              aria-invalid={Boolean(fieldErrors.name)}
              className={`${inputClassFor(
                fieldErrors.name
              )} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
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

          <div className="grid grid-cols-[1fr_140px] gap-3">
            <Field label="수량" required error={fieldErrors.amount}>
              <input
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) =>
                  updateField("amount", e.target.value.replace(/[^0-9.]/g, ""))
                }
                placeholder="0"
                aria-invalid={Boolean(fieldErrors.amount)}
                className={`${inputClassFor(fieldErrors.amount)} tabular-nums`}
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
            {isSubmitting ? "추가 중…" : "추가"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const BASE_INPUT_CLASS =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:ring-2";
const INPUT_NORMAL =
  "border-slate-200 focus:border-brand-400 focus:ring-brand-100";
const INPUT_ERROR = "border-rose-300 focus:border-rose-400 focus:ring-rose-100";

function inputClassFor(error: string | undefined): string {
  return `${BASE_INPUT_CLASS} ${error ? INPUT_ERROR : INPUT_NORMAL}`;
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      )}
    </label>
  );
}

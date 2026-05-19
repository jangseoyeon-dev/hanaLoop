"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "react-modal";
import { toast } from "sonner";
import type { EmissionFactorRow } from "@/features/emission-factors/types";
import { TYPE_LABEL } from "@/shared/components/card/TypeCard";
import { formatNumber } from "@/shared/lib/format";
import { Pagination } from "@/features/data-management/components/table/Pagination";
import { Th } from "@/features/data-management/components/table/Th";

if (typeof window !== "undefined") {
  Modal.setAppElement("body");
}

const DEFAULT_PAGE_SIZE = 8;

type PendingActivation = { id: number; label: string };
type EditTarget = {
  id: number;
  label: string;
  factor: string;
  unit: string;
  isActive: boolean;
};
type DeleteTarget = {
  id: number;
  label: string;
  isActive: boolean;
  isLastVersion: boolean;
};

export function EmissionFactorTable({ rows }: { rows: EmissionFactorRow[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingActivation | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const versionsPerType = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.typeCode, (m.get(r.typeCode) ?? 0) + 1);
    return m;
  }, [rows]);

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        if (a.category !== b.category)
          return a.category.localeCompare(b.category);
        if (a.typeName !== b.typeName)
          return a.typeName.localeCompare(b.typeName);
        return b.version - a.version;
      }),
    [rows]
  );

  useEffect(() => {
    setPage(1);
  }, [rows, pageSize]);

  const start = (page - 1) * pageSize;
  const paginated = sorted.slice(start, start + pageSize);

  const requestActivate = (id: number, label: string) => {
    if (activatingId !== null) return;
    setPending({ id, label });
  };

  const cancelActivate = () => {
    if (activatingId !== null) return;
    setPending(null);
  };

  const confirmActivate = async () => {
    if (!pending || activatingId !== null) return;
    const { id, label } = pending;
    setActivatingId(id);
    try {
      const res = await fetch(`/api/emission-factors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "활성 전환에 실패했습니다.");
      }
      toast.success(`${label} 버전이 활성으로 전환되었습니다.`);
      setPending(null);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "활성 전환에 실패했습니다."
      );
    } finally {
      setActivatingId(null);
    }
  };

  const requestEdit = (r: EmissionFactorRow) => {
    if (editingId !== null) return;
    setEditError(null);
    setEditTarget({
      id: r.id,
      label: `${TYPE_LABEL[r.category]} / ${r.typeName} v${r.version}`,
      factor: String(r.factor),
      unit: r.unit,
      isActive: r.isActive,
    });
  };

  const cancelEdit = () => {
    if (editingId !== null) return;
    setEditTarget(null);
    setEditError(null);
  };

  const submitEdit = async () => {
    if (!editTarget || editingId !== null) return;
    const factorNum = Number(editTarget.factor);
    const unit = editTarget.unit.trim();
    if (!Number.isFinite(factorNum) || factorNum <= 0) {
      setEditError("factor는 0보다 큰 숫자여야 합니다.");
      return;
    }
    if (!unit) {
      setEditError("단위를 입력해 주세요.");
      return;
    }

    setEditingId(editTarget.id);
    setEditError(null);
    try {
      const res = await fetch(`/api/emission-factors/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factor: factorNum, unit }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "수정에 실패했습니다.");
      }
      toast.success(
        editTarget.isActive
          ? `${editTarget.label} 수정 완료 — PCF가 재계산되었습니다.`
          : `${editTarget.label} 수정 완료.`
      );
      setEditTarget(null);
      router.refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "수정에 실패했습니다.");
    } finally {
      setEditingId(null);
    }
  };

  const requestDelete = (r: EmissionFactorRow) => {
    if (deletingId !== null) return;
    const total = versionsPerType.get(r.typeCode) ?? 0;
    setDeleteTarget({
      id: r.id,
      label: `${TYPE_LABEL[r.category]} / ${r.typeName} v${r.version}`,
      isActive: r.isActive,
      isLastVersion: total <= 1,
    });
  };

  const cancelDelete = () => {
    if (deletingId !== null) return;
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deletingId !== null) return;
    if (deleteTarget.isLastVersion) return;
    const { id, label } = deleteTarget;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/emission-factors/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "삭제에 실패했습니다.");
      }
      toast.success(
        deleteTarget.isActive
          ? `${label} 삭제 완료 — 다음 버전이 활성으로 승계되었습니다.`
          : `${label} 삭제 완료.`,
      );
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "삭제에 실패했습니다.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="h-85 overflow-y-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <Th>유형</Th>
              <Th>활동</Th>
              <Th align="right">factor</Th>
              <Th>단위</Th>
              <Th align="right">버전</Th>
              <Th>상태</Th>
              <Th>작업</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((r) => {
              const label = `${TYPE_LABEL[r.category]} / ${r.typeName} v${
                r.version
              }`;
              const isBusyActivate = activatingId === r.id;
              const isBusyEdit = editingId === r.id;
              const isBusyDelete = deletingId === r.id;
              const anyBusy =
                activatingId !== null ||
                editingId !== null ||
                deletingId !== null;
              const isLast = (versionsPerType.get(r.typeCode) ?? 0) <= 1;
              return (
                <tr
                  key={r.id}
                  className="text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <td className="px-3 py-2">{TYPE_LABEL[r.category]}</td>
                  <td className="px-3 py-2">{r.typeName}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatNumber(r.factor)}
                  </td>
                  <td className="px-3 py-2 text-slate-500">{r.unit}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    v{r.version}
                  </td>
                  <td className="px-3 py-2">
                    {r.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        활성
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => requestActivate(r.id, label)}
                        disabled={anyBusy}
                        className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                        title="이 버전을 활성으로 전환"
                      >
                        {isBusyActivate ? "전환 중…" : "이전 버전 · 활성화"}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => requestEdit(r)}
                        disabled={anyBusy}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isBusyEdit ? "저장 중…" : "수정"}
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(r)}
                        disabled={anyBusy || isLast}
                        title={
                          isLast
                            ? "활동별 최소 1개 버전은 유지되어야 합니다"
                            : "이 버전 삭제"
                        }
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isBusyDelete ? "삭제 중…" : "삭제"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={sorted.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <Modal
        isOpen={pending !== null}
        onRequestClose={cancelActivate}
        shouldCloseOnOverlayClick={activatingId === null}
        shouldCloseOnEsc={activatingId === null}
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
            <div className="mt-1 font-medium text-slate-900">
              {pending?.label}
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            이전에 활성이었던 버전은 자동으로 비활성 처리되며, 비활성으로 바뀐
            버전을 다시 클릭하면 원래대로 되돌릴 수 있습니다.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/40 px-6 py-4">
          <button
            type="button"
            onClick={cancelActivate}
            disabled={activatingId !== null}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={confirmActivate}
            disabled={activatingId !== null}
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {activatingId !== null ? "전환 중…" : "활성화"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={editTarget !== null}
        onRequestClose={cancelEdit}
        shouldCloseOnOverlayClick={editingId === null}
        shouldCloseOnEsc={editingId === null}
        contentLabel="배출계수 수정"
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
        className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
        preventScroll
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitEdit();
          }}
          className="flex flex-col"
        >
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              배출계수 수정
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {editTarget?.isActive
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
                {editTarget?.label}
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
                  value={editTarget?.factor ?? ""}
                  onChange={(e) =>
                    setEditTarget((prev) =>
                      prev
                        ? {
                            ...prev,
                            factor: e.target.value.replace(/[^0-9.]/g, ""),
                          }
                        : prev
                    )
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
                  value={editTarget?.unit ?? ""}
                  onChange={(e) =>
                    setEditTarget((prev) =>
                      prev ? { ...prev, unit: e.target.value } : prev
                    )
                  }
                  placeholder="kgCO₂e/kWh"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </label>
            </div>

            {editError && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {editError}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/40 px-6 py-4">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={editingId !== null}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={editingId !== null}
              className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingId !== null ? "저장 중…" : "저장"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteTarget !== null}
        onRequestClose={cancelDelete}
        shouldCloseOnOverlayClick={deletingId === null}
        shouldCloseOnEsc={deletingId === null}
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
            {deleteTarget?.isActive
              ? "활성 버전을 삭제하면 가장 최근 버전이 자동으로 활성으로 승계되고, 해당 활동의 모든 PCF가 재계산됩니다."
              : "비활성 버전을 삭제합니다. PCF에는 영향이 없습니다."}
          </p>
        </div>
        <div className="space-y-3 px-6 py-5 text-sm">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              삭제 대상
            </div>
            <div className="mt-1 font-medium text-slate-900">
              {deleteTarget?.label}
            </div>
          </div>
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-700">
            삭제 후에는 되돌릴 수 없습니다.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/40 px-6 py-4">
          <button
            type="button"
            onClick={cancelDelete}
            disabled={deletingId !== null}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={deletingId !== null}
            className="inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deletingId !== null ? "삭제 중…" : "삭제"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

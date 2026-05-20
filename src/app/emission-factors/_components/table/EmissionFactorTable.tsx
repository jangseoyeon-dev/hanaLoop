"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { EmissionFactorRow } from "../../_lib/types";
import { TYPE_LABEL } from "@/app/(dashboard)/_components/TypeCard";
import { formatNumber } from "@/shared/lib/format";
import { DataTable, type Column } from "@/shared/components/table/DataTable";
import { ActivateVersionModal } from "../modal/ActivateVersionModal";
import { EditFactorModal, type EditTarget } from "../modal/EditFactorModal";
import {
  DeleteFactorModal,
  type DeleteTarget,
} from "../modal/DeleteFactorModal";

type PendingActivation = { id: number; label: string };

export function EmissionFactorTable({ rows }: { rows: EmissionFactorRow[] }) {
  const router = useRouter();
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
          : `${label} 삭제 완료.`
      );
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const anyBusy =
    activatingId !== null || editingId !== null || deletingId !== null;

  const columns: Column<EmissionFactorRow>[] = [
    { header: "유형", cell: (r) => TYPE_LABEL[r.category] },
    { header: "활동", cell: (r) => r.typeName },
    { header: "factor", align: "right", cell: (r) => r.factor },
    { header: "단위", className: "text-slate-500", cell: (r) => r.unit },
    { header: "버전", align: "right", cell: (r) => `v${r.version}` },
    {
      header: "상태",
      cell: (r) => {
        const label = `${TYPE_LABEL[r.category]} / ${r.typeName} v${r.version}`;
        return r.isActive ? (
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
            {activatingId === r.id ? "전환 중…" : "이전 버전 · 활성화"}
          </button>
        );
      },
    },
    {
      header: "작업",
      cell: (r) => {
        const isLast = (versionsPerType.get(r.typeCode) ?? 0) <= 1;
        return (
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => requestEdit(r)}
              disabled={anyBusy}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {editingId === r.id ? "저장 중…" : "수정"}
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
              {deletingId === r.id ? "삭제 중…" : "삭제"}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <DataTable rows={sorted} columns={columns} rowKey={(r) => r.id} />

      <ActivateVersionModal
        isOpen={pending !== null}
        label={pending?.label}
        busy={activatingId !== null}
        onCancel={cancelActivate}
        onConfirm={confirmActivate}
      />

      <EditFactorModal
        target={editTarget}
        error={editError}
        busy={editingId !== null}
        onChange={(patch) =>
          setEditTarget((prev) => (prev ? { ...prev, ...patch } : prev))
        }
        onCancel={cancelEdit}
        onSubmit={submitEdit}
      />

      <DeleteFactorModal
        target={deleteTarget}
        busy={deletingId !== null}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

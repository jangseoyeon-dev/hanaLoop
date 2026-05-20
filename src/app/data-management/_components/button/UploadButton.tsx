"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LuUpload } from "react-icons/lu";
import { toast } from "sonner";
import { parseExcelFile } from "../../_lib/upload";

type BulkResult = {
  data: {
    uploadHistoryId: number;
    insertedCount: number;
    duplicateCount: number;
    errorCount: number;
    errors: { index: number; reason: string }[];
  };
};

export function UploadButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const rows = await parseExcelFile(file);
      if (rows.length === 0) {
        toast.error("업로드할 데이터가 없습니다. 헤더와 형식을 확인해주세요.");
        return;
      }

      const res = await fetch("/api/activity-data/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, rows }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "엑셀 업로드에 실패했습니다.");
      }

      const result = (await res.json().catch(() => null)) as BulkResult | null;
      if (!result?.data) {
        throw new Error("업로드 응답을 해석하지 못했습니다.");
      }
      const { insertedCount, duplicateCount, errorCount } = result.data;
      const summary = `중복 ${duplicateCount}건, 실패 ${errorCount}건`;
      if (insertedCount > 0) {
        toast.success(`업로드 완료: ${insertedCount}건 등록`, {
          description: summary,
        });
      } else {
        toast.warning("등록된 데이터가 없습니다.", { description: summary });
      }
      router.refresh();
    } catch (err) {
      console.error("[upload] 실패:", err);
      toast.error(
        err instanceof Error ? err.message : "엑셀 업로드에 실패했습니다."
      );
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <label
      className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-slate-900/10 ${
        isUploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <LuUpload className="h-4 w-4 text-slate-500" />
      {isUploading ? "업로드 중…" : "엑셀 업로드"}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        disabled={isUploading}
        className="sr-only"
      />
    </label>
  );
}

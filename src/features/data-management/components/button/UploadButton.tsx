"use client";

import { useState } from "react";
import { LuUpload } from "react-icons/lu";
import {
  parseExcelFile,
  type UploadRow,
} from "@/features/data-management/lib/upload";

export function UploadButton() {
  const [excelData, setExcelData] = useState<UploadRow[]>([]);
  console.log("excelData", excelData);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseExcelFile(file);
      setExcelData(rows);
    } catch (err) {
      console.error("[upload] 파일 파싱 실패:", err);
    }
  };

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-slate-900/10">
      <LuUpload className="h-4 w-4 text-slate-500" />
      엑셀 업로드
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="sr-only"
      />
    </label>
  );
}

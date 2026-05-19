import * as XLSX from "xlsx";

export type UploadRow = {
  activity_date: string;
  activity_type: string;
  description: string;
  amount: number;
  unit: string;
};

const HEADER_MAP: Record<string, keyof UploadRow> = {
  일자: "activity_date",
  "일자(원본)": "activity_date",

  "활동 유형": "activity_type",
  활동유형: "activity_type",

  설명: "description",

  량: "amount",
  수량: "amount",

  단위: "unit",
};

const REQUIRED_FIELDS = [
  "activity_date",
  "activity_type",
  "description",
  "amount",
  "unit",
] as const;

function parseUploadRow(
  raw: Record<string, unknown>,
  rowIndex: number
): UploadRow | null {
  const obj: Partial<UploadRow> = {};

  for (const [header, value] of Object.entries(raw)) {
    const key = header.replace(/\s+/g, " ").trim();
    const field = HEADER_MAP[key];
    if (!field) continue;
    if (value === null || value === undefined || value === "") continue;

    if (field === "amount") {
      const n = Number(String(value).replace(/,/g, "").trim());
      if (Number.isFinite(n)) obj.amount = n;
    } else if (field === "activity_date") {
      obj.activity_date =
        value instanceof Date
          ? value.toISOString().slice(0, 10)
          : String(value).trim();
    } else {
      obj[field] = String(value).trim();
    }
  }

  const missing = REQUIRED_FIELDS.filter((k) => obj[k] === undefined);
  if (missing.length === 0) return obj as UploadRow;

  console.warn(`[upload] row ${rowIndex} 누락 필드:`, missing, "원본:", raw);
  return null;
}

function findHeaderRow(aoa: unknown[][]): { index: number; headers: string[] } {
  for (let i = 0; i < aoa.length; i++) {
    const cells = (aoa[i] ?? []).map((c) =>
      String(c ?? "")
        .replace(/\s+/g, " ")
        .trim()
    );
    const matches = cells.filter((c) => HEADER_MAP[c]).length;
    if (matches >= 2) return { index: i, headers: cells };
  }
  return { index: -1, headers: [] };
}

export function parseExcelFile(file: File): Promise<UploadRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const aoa = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
          header: 1,
          defval: "",
          blankrows: false,
        });

        const { index: headerRowIdx, headers } = findHeaderRow(aoa);
        if (headerRowIdx === -1) {
          console.warn("[upload] 헤더 행을 찾을 수 없습니다");
          resolve([]);
          return;
        }

        const mapped = aoa
          .slice(headerRowIdx + 1)
          .map((row, i) => {
            const obj: Record<string, unknown> = {};
            headers.forEach((h, idx) => {
              obj[h] = (row ?? [])[idx];
            });
            return parseUploadRow(obj, i);
          })
          .filter((r): r is UploadRow => r !== null);

        resolve(mapped);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

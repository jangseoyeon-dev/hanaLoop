export type StatTileTone = "brand" | "warning" | "muted";

type StatTileProps = {
  label: string;
  value: string;
  sub: string;
  tone: StatTileTone;
};

/** 상단 요약 통계 타일. 데이터관리·배출계수 페이지에서 공통 사용. */
export function StatTile({ label, value, sub, tone }: StatTileProps) {
  const accent =
    tone === "brand"
      ? "text-brand-700"
      : tone === "warning"
      ? "text-amber-700"
      : "text-slate-700";
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-400">{sub}</div>
    </div>
  );
}

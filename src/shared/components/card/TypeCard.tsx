export type ActivityType = "ELECTRICITY" | "MATERIAL" | "TRANSPORT";

// 파란색 계열 팔레트 (메인 + 보조 톤)
export const TYPE_COLOR: Record<ActivityType, string> = {
  ELECTRICITY: "#2563eb", // brand-600
  MATERIAL: "#0ea5e9", // sky-500
  TRANSPORT: "#6366f1", // indigo-500
};

export const TYPE_ICON: Record<ActivityType, string> = {
  ELECTRICITY: "⚡",
  MATERIAL: "🧱",
  TRANSPORT: "🚚",
};

export const TYPE_LABEL: Record<ActivityType, string> = {
  ELECTRICITY: "전기",
  MATERIAL: "원소재",
  TRANSPORT: "운송",
};

function formatKg(n: number): string {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(n);
}

export function TypeCard({
  type,
  value,
  ratio,
}: {
  type: ActivityType;
  value: number;
  ratio: number;
}) {
  const color = TYPE_COLOR[type];
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-brand-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div
          className="flex size-10 items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: color + "14", color }}
        >
          {TYPE_ICON[type]}
        </div>
        <div
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: color + "14", color }}
        >
          {ratio.toFixed(1)}%
        </div>
      </div>
      <div className="mt-4 text-xs font-medium text-slate-500">
        {TYPE_LABEL[type]}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        {formatKg(value)}
        <span className="ml-1 text-xs font-normal text-slate-400">kg</span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(ratio, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

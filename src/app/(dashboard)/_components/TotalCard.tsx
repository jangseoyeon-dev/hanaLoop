export function TotalCard({ total }: { total: number }) {
  function formatKg(n: number): string {
    return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(
      n
    );
  }
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-lg shadow-brand-600/20">
      <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 -right-4 size-24 rounded-full bg-white/5" />
      <div className="relative">
        <div className="text-xs font-medium uppercase tracking-wider text-brand-100">
          총 배출량
        </div>
        <div className="mt-3 text-3xl font-semibold tracking-tight">
          {formatKg(total)}
          <span className="ml-1 text-base font-normal text-brand-100">
            kg CO₂e
          </span>
        </div>
        <div className="mt-2 text-xs text-brand-100/80">필터 적용 기준</div>
      </div>
    </div>
  );
}

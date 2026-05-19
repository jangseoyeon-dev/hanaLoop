export function formatNumber(n: number): string {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(n);
}

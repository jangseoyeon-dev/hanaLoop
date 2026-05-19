"use client";
import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { MonthlyTotal } from "@/features/dashboard/types";
import { ChartCard } from "./ChartCard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

const numberFmt = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-");
  return `${y.slice(2)}.${m}`;
}

export function MonthlyTrendChart({
  monthlyTotals,
}: {
  monthlyTotals: MonthlyTotal[];
}) {
  const data = useMemo(
    () => ({
      labels: monthlyTotals.map((m) => formatMonthLabel(m.month)),
      datasets: [
        {
          label: "월별 배출량 (kg CO₂e)",
          data: monthlyTotals.map((m) => m.total),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: "#2563eb",
        },
      ],
    }),
    [monthlyTotals],
  );

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ` ${numberFmt.format(ctx.parsed.y as number)} kg CO₂e`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: 11 },
          callback: (v) => numberFmt.format(Number(v)),
        },
        grid: { color: "#f1f5f9" },
      },
    },
  };

  return (
    <ChartCard
      title="월별 배출량 추이"
      description="활동일자 기준 월별 합산 추이"
    >
      <Line data={data} options={options} />
    </ChartCard>
  );
}

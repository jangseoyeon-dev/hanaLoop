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
import {
  ActivityCategory,
  TYPE_COLOR,
  TYPE_LABEL,
} from "@/shared/components/card/TypeCard";
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
  const data = useMemo(() => {
    const categories = Object.values(ActivityCategory).filter((c) =>
      monthlyTotals.some((m) => (m.byCategory[c] ?? 0) > 0),
    );
    return {
      labels: monthlyTotals.map((m) => formatMonthLabel(m.month)),
      datasets: [
        ...categories.map((c) => {
          const color = TYPE_COLOR[c];
          return {
            label: TYPE_LABEL[c],
            data: monthlyTotals.map((m) => m.byCategory[c] ?? 0),
            borderColor: color,
            backgroundColor: color,
            fill: false,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: color,
          };
        }),
        {
          label: "전체",
          data: monthlyTotals.map((m) => m.total),
          borderColor: "#64748b",
          backgroundColor: "#64748b",
          borderDash: [6, 4],
          fill: false,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: "#64748b",
        },
      ],
    };
  }, [monthlyTotals]);

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyle: "rect",
          boxWidth: 8,
          padding: 12,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ` ${ctx.dataset.label}: ${numberFmt.format(ctx.parsed.y as number)} kg CO₂e`,
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
      title="월별 유형별 배출량 추이"
      description="활동일자 기준 월별·유형별 배출량 추이"
    >
      <Line data={data} options={options} />
    </ChartCard>
  );
}

"use client";
import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { TypeTotal } from "@/features/dashboard/types";
import {
  TYPE_COLOR,
  TYPE_LABEL,
} from "@/shared/components/card/TypeCard";
import { ChartCard } from "./ChartCard";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const numberFmt = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });

export function CategoryBarChart({ typeTotals }: { typeTotals: TypeTotal[] }) {
  const data = useMemo(
    () => ({
      labels: typeTotals.map((t) => TYPE_LABEL[t.category]),
      datasets: [
        {
          label: "배출량 (kg CO₂e)",
          data: typeTotals.map((t) => t.total),
          backgroundColor: typeTotals.map((t) => TYPE_COLOR[t.category]),
          borderRadius: 6,
          maxBarThickness: 56,
        },
      ],
    }),
    [typeTotals],
  );

  const options: ChartOptions<"bar"> = {
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
      x: { grid: { display: false }, ticks: { font: { size: 12 } } },
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
      title="카테고리별 배출량"
      description="카테고리 간 절대 배출량 비교"
    >
      <Bar data={data} options={options} />
    </ChartCard>
  );
}

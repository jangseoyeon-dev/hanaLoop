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
import type { ActivityTotal } from "@/features/dashboard/types";
import { TYPE_COLOR, TYPE_LABEL } from "@/shared/components/card/TypeCard";
import { ChartCard } from "./ChartCard";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const numberFmt = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });

export function TopActivitiesChart({
  topActivities,
}: {
  topActivities: ActivityTotal[];
}) {
  const data = useMemo(
    () => ({
      labels: topActivities.map((a) => a.name),
      datasets: [
        {
          label: "배출량 (kg CO₂e)",
          data: topActivities.map((a) => a.total),
          backgroundColor: topActivities.map((a) => TYPE_COLOR[a.category]),
          borderRadius: 6,
          maxBarThickness: 22,
        },
      ],
    }),
    [topActivities]
  );

  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex ?? 0;
            const a = topActivities[idx];
            return a ? `${a.name} · ${TYPE_LABEL[a.category]}` : "";
          },
          label: (ctx) =>
            ` ${numberFmt.format(ctx.parsed.x as number)} kg CO₂e`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          font: { size: 11 },
          callback: (v) => numberFmt.format(Number(v)),
        },
        grid: { color: "#f1f5f9" },
      },
      y: { grid: { display: false }, ticks: { font: { size: 12 } } },
    },
  };

  return (
    <ChartCard
      title="활동 유형 상위 3"
      description="배출 기여도가 가장 큰 활동"
    >
      <Bar data={data} options={options} />
    </ChartCard>
  );
}

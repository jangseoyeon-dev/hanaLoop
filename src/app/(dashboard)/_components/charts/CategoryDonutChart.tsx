"use client";
import { useMemo } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import type { TypeTotal } from "../../_lib/types";
import { TYPE_COLOR, TYPE_LABEL } from "@/app/(dashboard)/_components/TypeCard";
import { ChartCard } from "./ChartCard";

ChartJS.register(ArcElement, Tooltip, Legend);

const numberFmt = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });

export function CategoryDonutChart({
  typeTotals,
}: {
  typeTotals: TypeTotal[];
}) {
  const data = useMemo(
    () => ({
      labels: typeTotals.map((t) => TYPE_LABEL[t.category]),
      datasets: [
        {
          data: typeTotals.map((t) => t.total),
          backgroundColor: typeTotals.map((t) => TYPE_COLOR[t.category]),
          borderColor: "#fff",
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    }),
    [typeTotals]
  );

  const total = typeTotals.reduce((s, t) => s + t.total, 0);

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          padding: 12,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed as number;
            const ratio = total > 0 ? (v / total) * 100 : 0;
            return ` ${numberFmt.format(v)} kg CO₂e (${ratio.toFixed(1)}%)`;
          },
        },
      },
    },
  };

  return (
    <ChartCard
      title="카테고리별 배출 비율"
      description="활동유형 카테고리 점유율 (kg CO₂e 기준)"
    >
      <Doughnut data={data} options={options} />
    </ChartCard>
  );
}

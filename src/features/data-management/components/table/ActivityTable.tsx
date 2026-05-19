"use client";

import { useState } from "react";
import { type ActivityRow } from "@/features/data-management/mock";
import { Table } from "./Table";
import { CalculationBasisModal } from "../modal/CalculationBasisModal";

export function ActivityTable({ rows }: { rows: ActivityRow[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ActivityRow | null>(null);

  const openRow = (r: ActivityRow) => {
    setSelectedRow(r);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto mt-5">
        <Table rows={rows} onRowClick={openRow} />
      </div>
      <CalculationBasisModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        selectedRow={selectedRow}
      />
    </>
  );
}

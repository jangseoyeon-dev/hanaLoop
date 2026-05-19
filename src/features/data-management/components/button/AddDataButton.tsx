"use client";

import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import { AddDataModal } from "../modal/AddDataModal";

export function AddDataButton() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
        onClick={() => setIsAddModalOpen(true)}
      >
        <LuPlus className="h-4 w-4" />
        데이터 추가
      </button>
      <AddDataModal
        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
      />
    </>
  );
}

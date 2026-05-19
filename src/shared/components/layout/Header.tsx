"use client";

import Image from "next/image";
import { FaBars, FaXmark } from "react-icons/fa6";
import { useSidebarStore } from "@/shared/stores/sidebarStore";

export function Header() {
  const isOpen = useSidebarStore((s) => s.isOpen);
  const toggle = useSidebarStore((s) => s.toggle);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-gray-200/70 bg-white/80 pl-2 pr-6 backdrop-blur supports-backdrop-filter:bg-white/60">
      <button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? "사이드바 닫기" : "사이드바 열기"}
        aria-expanded={isOpen}
        aria-controls="primary-sidebar"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/10"
      >
        {isOpen ? (
          <FaXmark size={18} aria-hidden="true" />
        ) : (
          <FaBars size={18} aria-hidden="true" />
        )}
      </button>

      <div className="flex items-center gap-2.5">
        <Image
          src="https://www.hanaloop.com/images/hanaloop-logo.png"
          alt=""
          width={120}
          height={32}
          priority
          className="h-7 w-auto"
        />
        <h1 className="text-base font-semibold tracking-tight text-gray-900">
          hanaLoop
        </h1>
      </div>
    </header>
  );
}

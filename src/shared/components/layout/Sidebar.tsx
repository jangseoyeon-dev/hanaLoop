"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuLayoutDashboard, LuDatabase, LuFlaskConical } from "react-icons/lu";
import { useSidebarStore } from "@/shared/stores/sidebarStore";

type MenuItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const MENU: MenuItem[] = [
  { label: "대시보드", href: "/", icon: LuLayoutDashboard },
  { label: "데이터관리", href: "/data-management", icon: LuDatabase },
  { label: "배출계수 이력", href: "/emission-factors", icon: LuFlaskConical },
];

export function Sidebar() {
  const isOpen = useSidebarStore((s) => s.isOpen);
  const pathname = usePathname();

  return (
    <div
      data-state={isOpen ? "open" : "closed"}
      className="h-[calc(100vh-4rem)] shrink-0 overflow-hidden transition-[width] duration-200 ease-out data-[state=closed]:w-14 data-[state=open]:w-40"
    >
      <nav className="flex h-full flex-col gap-1 p-2">
        {MENU.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              title={isOpen ? undefined : label}
              className={
                "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors " +
                (active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
              }
            >
              <Icon
                className={
                  "h-5 w-5 shrink-0 " +
                  (active
                    ? "text-white"
                    : "text-slate-400 group-hover:text-slate-700")
                }
              />
              <span
                className={
                  "truncate transition-opacity duration-150 " +
                  (isOpen ? "opacity-100" : "pointer-events-none opacity-0")
                }
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

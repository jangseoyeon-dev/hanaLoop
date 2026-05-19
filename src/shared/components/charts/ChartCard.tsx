import type { ReactNode } from "react";

export function ChartCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        ) : null}
      </div>
      <div className="relative h-64">{children}</div>
    </div>
  );
}

"use client";
import { FilterField } from "./FilterField";

export function FilterBox() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <FilterField label="시작일">
          <input
            type="date"
            value=""
            className="w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            onChange={() => console.log("1")}
          />
        </FilterField>
        <FilterField label="종료일">
          <input
            type="date"
            value=""
            className="w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            onChange={() => console.log("2")}
          />
        </FilterField>
        <FilterField label="활동유형">
          <select
            value=""
            className="w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            onChange={() => console.log("e")}
          >
            <option value="">전체</option>
            {/* <option value="ELECTRICITY">{TYPE_LABEL.ELECTRICITY}</option>
            <option value="MATERIAL">{TYPE_LABEL.MATERIAL}</option>
            <option value="TRANSPORT">{TYPE_LABEL.TRANSPORT}</option> */}
          </select>
        </FilterField>
        <FilterField label="제품/품목">
          <select
            value=""
            onChange={() => console.log("p")}
            className="w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">전체</option>
            {/* <option value="ELECTRICITY">{TYPE_LABEL.ELECTRICITY}</option>
            <option value="MATERIAL">{TYPE_LABEL.MATERIAL}</option>
            <option value="TRANSPORT">{TYPE_LABEL.TRANSPORT}</option> */}
          </select>
        </FilterField>
        {/* {showProduct && (
          <FilterField label="제품/품목">
            <select
              value={product}
              onChange={(e) => update({ product: e.target.value })}
              className="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">전체</option>
              {filteredProducts.map((p) => (
                <option
                  key={`${p.type}|${p.description}`}
                  value={p.description}
                >
                  {p.description}
                </option>
              ))}
            </select>
          </FilterField>
        )}
        {hasAny && (
          <button
            onClick={() => update({ from: "", to: "", type: "", product: "" })}
            className="ml-auto rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            초기화
          </button>
        )} */}
      </div>
    </div>
  );
}

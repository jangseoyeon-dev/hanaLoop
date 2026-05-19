import type { ActivityType } from "@/shared/components/card/TypeCard";

export type ActivityRow = {
  id: number;
  activityDate: string;
  type: ActivityType;
  description: string;
  amount: number;
  unit: string;
  co2e: number;
  isDuplicate: boolean;
  rowHash: string;
};

// 배출계수 — 추후 DB의 emission_factors 테이블로 분리하고 버전 이력 추적 예정
const EMISSION_FACTOR: Record<string, number> = {
  "ELECTRICITY|한국전력": 0.456, // kgCO₂e / kWh
  "MATERIAL|플라스틱 1": 2.3, // kgCO₂e / kg
  "MATERIAL|플라스틱 2": 3.2, // kgCO₂e / kg
  "TRANSPORT|트럭": 3.5, // kgCO₂e / ton-km
};

type RawRow = {
  activityDate: string;
  type: ActivityType;
  description: string;
  amount: number;
  unit: string;
};

const RAW: RawRow[] = [
  // 전기
  {
    activityDate: "2025-01-01",
    type: "ELECTRICITY",
    description: "한국전력",
    amount: 110,
    unit: "kWh",
  },
  {
    activityDate: "2025-02-01",
    type: "ELECTRICITY",
    description: "한국전력",
    amount: 112,
    unit: "kWh",
  },
  {
    activityDate: "2025-03-01",
    type: "ELECTRICITY",
    description: "한국전력",
    amount: 115,
    unit: "kWh",
  },
  {
    activityDate: "2025-04-01",
    type: "ELECTRICITY",
    description: "한국전력",
    amount: 130,
    unit: "kWh",
  },
  {
    activityDate: "2025-05-01",
    type: "ELECTRICITY",
    description: "한국전력",
    amount: 120,
    unit: "kWh",
  },
  {
    activityDate: "2025-06-01",
    type: "ELECTRICITY",
    description: "한국전력",
    amount: 110,
    unit: "kWh",
  },
  {
    activityDate: "2025-07-01",
    type: "ELECTRICITY",
    description: "한국전력",
    amount: 120,
    unit: "kWh",
  },
  {
    activityDate: "2025-08-01",
    type: "ELECTRICITY",
    description: "한국전력",
    amount: 111,
    unit: "kWh",
  },
  {
    activityDate: "2025-05-01",
    type: "ELECTRICITY",
    description: "한국전력",
    amount: 101,
    unit: "kWh",
  },

  // 원소재
  {
    activityDate: "2025-01-01",
    type: "MATERIAL",
    description: "플라스틱 1",
    amount: 230,
    unit: "kg",
  },
  {
    activityDate: "2025-02-01",
    type: "MATERIAL",
    description: "플라스틱 1",
    amount: 340,
    unit: "kg",
  },
  {
    activityDate: "2025-03-01",
    type: "MATERIAL",
    description: "플라스틱 2",
    amount: 23,
    unit: "kg",
  },
  {
    activityDate: "2025-03-01",
    type: "MATERIAL",
    description: "플라스틱 1",
    amount: 430,
    unit: "kg",
  },
  {
    activityDate: "2025-04-01",
    type: "MATERIAL",
    description: "플라스틱 1",
    amount: 510,
    unit: "kg",
  },
  {
    activityDate: "2025-05-01",
    type: "MATERIAL",
    description: "플라스틱 1",
    amount: 424,
    unit: "kg",
  },
  {
    activityDate: "2025-05-01",
    type: "MATERIAL",
    description: "플라스틱 2",
    amount: 40,
    unit: "kg",
  },
  {
    activityDate: "2025-06-01",
    type: "MATERIAL",
    description: "플라스틱 1",
    amount: 450,
    unit: "kg",
  },
  {
    activityDate: "2025-07-01",
    type: "MATERIAL",
    description: "플라스틱 1",
    amount: 340,
    unit: "kg",
  },
  {
    activityDate: "2025-07-01",
    type: "MATERIAL",
    description: "플라스틱 2",
    amount: 43,
    unit: "kg",
  },
  {
    activityDate: "2025-08-01",
    type: "MATERIAL",
    description: "플라스틱 1",
    amount: 230,
    unit: "kg",
  },
  {
    activityDate: "2025-05-01",
    type: "MATERIAL",
    description: "플라스틱 1",
    amount: 232,
    unit: "kg",
  },

  // 운송
  {
    activityDate: "2025-01-01",
    type: "TRANSPORT",
    description: "트럭",
    amount: 41,
    unit: "ton-km",
  },
  {
    activityDate: "2025-02-01",
    type: "TRANSPORT",
    description: "트럭",
    amount: 211,
    unit: "ton-km",
  },
  {
    activityDate: "2025-03-01",
    type: "TRANSPORT",
    description: "트럭",
    amount: 123,
    unit: "ton-km",
  },
  {
    activityDate: "2025-04-01",
    type: "TRANSPORT",
    description: "트럭",
    amount: 42,
    unit: "ton-km",
  },
  {
    activityDate: "2025-05-01",
    type: "TRANSPORT",
    description: "트럭",
    amount: 123,
    unit: "ton-km",
  },
  {
    activityDate: "2025-06-01",
    type: "TRANSPORT",
    description: "트럭",
    amount: 123,
    unit: "ton-km",
  },
  {
    activityDate: "2025-07-01",
    type: "TRANSPORT",
    description: "트럭",
    amount: 41,
    unit: "ton-km",
  },
  {
    activityDate: "2025-08-01",
    type: "TRANSPORT",
    description: "트럭",
    amount: 123,
    unit: "ton-km",
  },
  {
    activityDate: "2025-05-01",
    type: "TRANSPORT",
    description: "트럭",
    amount: 12,
    unit: "ton-km",
  },
];

function hash8(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16).padStart(8, "0").slice(0, 8);
}

function buildRows(): ActivityRow[] {
  const seen = new Set<string>();
  return RAW.map((r, i) => {
    const factor = EMISSION_FACTOR[`${r.type}|${r.description}`];
    const key = `${r.activityDate}|${r.type}|${r.description}`;
    const isDuplicate = seen.has(key);
    seen.add(key);
    return {
      id: i + 1,
      ...r,
      co2e: Math.round(r.amount * factor * 10) / 10,
      isDuplicate,
      rowHash: hash8(key),
    };
  });
}

export const activityRowsMock: ActivityRow[] = buildRows();

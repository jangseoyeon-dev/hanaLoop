import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import { buildRowHashKey, rowHash8 } from "@/shared/lib/hash";
import { findEmissionFactor } from "@/features/activity/lib/emission";

type ListQuery = {
  startDate: Date | null;
  endDate: Date | null;
  typeCode: string | null;
  description: string | null;
  page: number;
  pageSize: number;
};

function parseListQuery(url: URL): ListQuery {
  const sp = url.searchParams;
  const startStr = sp.get("startDate");
  const endStr = sp.get("endDate");
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? 8)));

  return {
    startDate: startStr ? new Date(startStr) : null,
    endDate: endStr ? new Date(endStr) : null,
    typeCode: sp.get("typeCode"),
    description: sp.get("description"),
    page,
    pageSize,
  };
}

export async function GET(request: NextRequest) {
  const q = parseListQuery(new URL(request.url));

  const where: Prisma.ActivityDataWhereInput = {};
  if (q.startDate || q.endDate) {
    where.activityDate = {};
    if (q.startDate) where.activityDate.gte = q.startDate;
    if (q.endDate) where.activityDate.lte = q.endDate;
  }
  if (q.typeCode) where.activityType = { code: q.typeCode };
  if (q.description) where.description = { contains: q.description };

  const [total, rows] = await prisma.$transaction([
    prisma.activityData.count({ where }),
    prisma.activityData.findMany({
      where,
      orderBy: [{ activityDate: "asc" }, { id: "asc" }],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      include: {
        activityType: true,
        pcfResults: { select: { carbonEmission: true } },
      },
    }),
  ]);

  const data = rows.map((r) => ({
    id: r.id,
    activityDate: r.activityDate.toISOString().slice(0, 10),
    type: r.activityType.code,
    typeName: r.activityType.name,
    description: r.description,
    amount: Number(r.amount),
    unit: r.unit,
    co2e: Number(
      r.pcfResults.reduce((sum, p) => sum + p.carbonEmission, 0).toFixed(2),
    ),
    isDuplicate: r.isDuplicate,
    rowHash: r.rowHash,
  }));

  return Response.json({
    data,
    page: q.page,
    pageSize: q.pageSize,
    total,
  });
}

type CreateBody = {
  activity_date?: string;
  activity_type?: string;
  description?: string;
  amount?: number | string;
  unit?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateBody;

  const activityTypeCode = body.activity_type?.trim();
  const description = body.description?.trim();
  const unit = body.unit?.trim();
  const dateStr = body.activity_date?.trim();
  const amount = Number(body.amount);

  if (!activityTypeCode || !description || !unit || !dateStr) {
    return Response.json(
      { error: "필수 필드가 누락되었습니다." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json(
      { error: "수량은 0보다 큰 숫자여야 합니다." },
      { status: 400 },
    );
  }

  const type = await prisma.activityType.findUnique({
    where: { code: activityTypeCode },
  });
  if (!type) {
    return Response.json(
      { error: `알 수 없는 활동 유형: ${activityTypeCode}` },
      { status: 400 },
    );
  }

  const activityDate = new Date(dateStr);
  const hashKey = buildRowHashKey(dateStr, type.code, description);
  const rowHash = rowHash8(hashKey);
  const existing = await prisma.activityData.findFirst({
    where: { rowHash },
    select: { id: true },
  });

  const created = await prisma.activityData.create({
    data: {
      activityDate,
      activityTypeId: type.id,
      description,
      amount: new Prisma.Decimal(amount),
      unit,
      rowHash,
      isDuplicate: Boolean(existing),
    },
  });

  const factor = await findEmissionFactor({
    activityTypeId: type.id,
    factorName: description,
    activityDate,
  });

  if (factor && !created.isDuplicate) {
    await prisma.pcfResult.create({
      data: {
        activityDataId: created.id,
        emissionFactorId: factor.id,
        carbonEmission: amount * factor.factor,
      },
    });
  }

  return Response.json({ data: { id: created.id } }, { status: 201 });
}

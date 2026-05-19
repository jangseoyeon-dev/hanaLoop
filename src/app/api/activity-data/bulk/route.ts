import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import { buildRowHashKey, rowHash8 } from "@/shared/lib/hash";
import { findEmissionFactor } from "@/features/activity/lib/emission";

type BulkRow = {
  activity_date: string;
  activity_type: string;
  description: string;
  amount: number;
  unit: string;
};

type BulkBody = {
  fileName?: string;
  rows: BulkRow[];
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as BulkBody;
  if (!Array.isArray(body?.rows) || body.rows.length === 0) {
    return Response.json(
      { error: "업로드할 행이 없습니다." },
      { status: 400 },
    );
  }

  const types = await prisma.activityType.findMany();
  const typeByCode = new Map(types.map((t) => [t.code, t]));

  const upload = await prisma.uploadHistory.create({
    data: { fileName: body.fileName ?? null },
  });

  const errors: { index: number; reason: string }[] = [];
  let insertedCount = 0;
  let duplicateCount = 0;

  for (let i = 0; i < body.rows.length; i++) {
    const raw = body.rows[i];
    const type = typeByCode.get(raw.activity_type);
    const amount = Number(raw.amount);

    if (!type || !raw.activity_date || !raw.description || !raw.unit) {
      errors.push({ index: i, reason: "필수 필드 누락 또는 알 수 없는 유형" });
      continue;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push({ index: i, reason: "유효하지 않은 수량" });
      continue;
    }

    const activityDate = new Date(raw.activity_date);
    const hashKey = buildRowHashKey(
      raw.activity_date,
      type.code,
      raw.description,
    );
    const rowHash = rowHash8(hashKey);
    const existing = await prisma.activityData.findFirst({
      where: { rowHash },
      select: { id: true },
    });
    const isDuplicate = Boolean(existing);

    const created = await prisma.activityData.create({
      data: {
        uploadHistoryId: upload.id,
        activityDate,
        activityTypeId: type.id,
        description: raw.description,
        amount: new Prisma.Decimal(amount),
        unit: raw.unit,
        rowHash,
        isDuplicate,
      },
    });
    insertedCount++;
    if (isDuplicate) duplicateCount++;

    if (!isDuplicate) {
      const factor = await findEmissionFactor({
        activityTypeId: type.id,
        factorName: raw.description,
        activityDate,
      });
      if (factor) {
        await prisma.pcfResult.create({
          data: {
            activityDataId: created.id,
            emissionFactorId: factor.id,
            carbonEmission: amount * factor.factor,
          },
        });
      }
    }
  }

  return Response.json(
    {
      data: {
        uploadHistoryId: upload.id,
        insertedCount,
        duplicateCount,
        errorCount: errors.length,
        errors,
      },
    },
    { status: 201 },
  );
}

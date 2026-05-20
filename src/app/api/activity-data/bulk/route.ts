import type { NextRequest } from "next/server";
import { ActivityCategory, Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import { buildRowHashKey, rowHash8 } from "@/shared/lib/hash";
import { findEmissionFactor } from "@/shared/lib/emission";
import { resolveCategory } from "@/shared/lib/category";

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
  const typeByKey = new Map<string, (typeof types)[number]>();
  for (const t of types) {
    typeByKey.set(`${t.category}|${t.name}`, t);
  }

  const upload = await prisma.uploadHistory.create({
    data: { fileName: body.fileName ?? null },
  });

  const errors: { index: number; reason: string }[] = [];
  let insertedCount = 0;
  let duplicateCount = 0;

  for (let i = 0; i < body.rows.length; i++) {
    const raw = body.rows[i];
    if (!raw.activity_date || !raw.description || !raw.unit) {
      errors.push({ index: i, reason: "필수 필드 누락" });
      continue;
    }
    const category = resolveCategory(raw.activity_type);
    if (!category) {
      errors.push({
        index: i,
        reason: `알 수 없는 활동 유형: ${raw.activity_type}`,
      });
      continue;
    }
    const type = typeByKey.get(`${category as ActivityCategory}|${raw.description}`);
    if (!type) {
      errors.push({
        index: i,
        reason: `등록되지 않은 활동: ${raw.activity_type} / ${raw.description}`,
      });
      continue;
    }
    const amount = Number(raw.amount);
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
      const factor = await findEmissionFactor({ activityTypeId: type.id });
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

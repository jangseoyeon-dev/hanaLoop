import type { NextRequest } from "next/server";
import { prisma } from "@/shared/lib/prisma";

type PatchBody = {
  isActive?: unknown;
  factor?: unknown;
  unit?: unknown;
};

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return Response.json({ error: "잘못된 id입니다." }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return Response.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const target = await prisma.emissionFactor.findUnique({
    where: { id },
    select: {
      id: true,
      activityTypeId: true,
      factor: true,
      unit: true,
      isActive: true,
    },
  });
  if (!target) {
    return Response.json(
      { error: "존재하지 않는 배출계수입니다." },
      { status: 404 },
    );
  }

  const wantsActivate = body.isActive === true;
  const factorProvided = body.factor !== undefined;
  const unitProvided = body.unit !== undefined;

  let nextFactor = target.factor;
  if (factorProvided) {
    const n =
      typeof body.factor === "number"
        ? body.factor
        : Number(body.factor as string);
    if (!Number.isFinite(n) || n <= 0) {
      return Response.json(
        { error: "factor는 0보다 큰 숫자여야 합니다." },
        { status: 400 },
      );
    }
    nextFactor = n;
  }

  let nextUnit = target.unit;
  if (unitProvided) {
    const u = typeof body.unit === "string" ? body.unit.trim() : "";
    if (!u) {
      return Response.json({ error: "단위는 필수입니다." }, { status: 400 });
    }
    nextUnit = u;
  }

  const factorChanged = factorProvided && nextFactor !== target.factor;
  const unitChanged = unitProvided && nextUnit !== target.unit;
  const willBecomeActive = wantsActivate && !target.isActive;
  const needsRecalc = willBecomeActive || (target.isActive && factorChanged);

  if (!wantsActivate && !factorChanged && !unitChanged) {
    return Response.json({ data: { id: target.id, noop: true } });
  }

  await prisma.$transaction(async (tx) => {
    if (willBecomeActive) {
      await tx.emissionFactor.updateMany({
        where: { activityTypeId: target.activityTypeId },
        data: { isActive: false },
      });
    }

    await tx.emissionFactor.update({
      where: { id: target.id },
      data: {
        ...(factorChanged && { factor: nextFactor }),
        ...(unitChanged && { unit: nextUnit }),
        ...(willBecomeActive && { isActive: true }),
      },
    });

    if (needsRecalc) {
      const affected = await tx.activityData.findMany({
        where: {
          activityTypeId: target.activityTypeId,
          isDuplicate: false,
        },
        select: { id: true, amount: true },
      });
      if (affected.length > 0) {
        const ids = affected.map((a) => a.id);
        await tx.pcfResult.deleteMany({
          where: { activityDataId: { in: ids } },
        });
        await tx.pcfResult.createMany({
          data: affected.map((a) => ({
            activityDataId: a.id,
            emissionFactorId: target.id,
            carbonEmission: Number(a.amount) * nextFactor,
          })),
        });
      }
    }
  });

  return Response.json({
    data: {
      id: target.id,
      factor: nextFactor,
      unit: nextUnit,
      isActive: willBecomeActive ? true : target.isActive,
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return Response.json({ error: "잘못된 id입니다." }, { status: 400 });
  }

  const target = await prisma.emissionFactor.findUnique({
    where: { id },
    select: { id: true, activityTypeId: true, isActive: true },
  });
  if (!target) {
    return Response.json(
      { error: "존재하지 않는 배출계수입니다." },
      { status: 404 },
    );
  }

  const siblingCount = await prisma.emissionFactor.count({
    where: { activityTypeId: target.activityTypeId },
  });
  if (siblingCount <= 1) {
    return Response.json(
      { error: "활동별로 최소 1개의 배출계수는 유지되어야 합니다." },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    if (target.isActive) {
      const nextActive = await tx.emissionFactor.findFirst({
        where: { activityTypeId: target.activityTypeId, id: { not: target.id } },
        orderBy: [{ version: "desc" }, { createdAt: "desc" }],
        select: { id: true, factor: true },
      });
      if (!nextActive) {
        throw new Error("승계할 다음 버전이 없습니다.");
      }

      await tx.emissionFactor.update({
        where: { id: nextActive.id },
        data: { isActive: true },
      });

      const affected = await tx.activityData.findMany({
        where: { activityTypeId: target.activityTypeId, isDuplicate: false },
        select: { id: true, amount: true },
      });
      if (affected.length > 0) {
        const ids = affected.map((a) => a.id);
        await tx.pcfResult.deleteMany({
          where: { activityDataId: { in: ids } },
        });
        await tx.pcfResult.createMany({
          data: affected.map((a) => ({
            activityDataId: a.id,
            emissionFactorId: nextActive.id,
            carbonEmission: Number(a.amount) * nextActive.factor,
          })),
        });
      }
    } else {
      await tx.pcfResult.deleteMany({
        where: { emissionFactorId: target.id },
      });
    }

    await tx.emissionFactor.delete({ where: { id: target.id } });
  });

  return Response.json({ data: { id: target.id, deleted: true } });
}

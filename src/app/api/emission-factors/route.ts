import { prisma } from "@/shared/lib/prisma";
import { resolveCategory } from "@/features/activity/lib/category";

export async function GET() {
  const types = await prisma.activityType.findMany({
    select: { id: true, code: true, name: true, category: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  const data = types.map((t) => ({
    code: t.code,
    name: t.name,
    category: t.category,
  }));
  return Response.json({ data });
}

type CreateBody = {
  type?: unknown;
  name?: unknown;
  factor?: unknown;
  unit?: unknown;
};

export async function POST(req: Request) {
  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return Response.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const categoryInput = typeof body.type === "string" ? body.type.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const unit = typeof body.unit === "string" ? body.unit.trim() : "";
  const factorNum =
    typeof body.factor === "number"
      ? body.factor
      : Number(body.factor as string);

  if (!categoryInput) {
    return Response.json({ error: "활동 유형은 필수입니다." }, { status: 400 });
  }
  if (!name) {
    return Response.json({ error: "활동명은 필수입니다." }, { status: 400 });
  }
  if (!unit) {
    return Response.json({ error: "단위는 필수입니다." }, { status: 400 });
  }
  if (!Number.isFinite(factorNum) || factorNum <= 0) {
    return Response.json(
      { error: "factor는 0보다 큰 숫자여야 합니다." },
      { status: 400 },
    );
  }
  const startDate = new Date();

  const category = resolveCategory(categoryInput);
  if (!category) {
    return Response.json(
      { error: `알 수 없는 활동 유형: ${categoryInput}` },
      { status: 400 },
    );
  }

  const activityType = await prisma.activityType.findUnique({
    where: { category_name: { category, name } },
    select: { id: true },
  });
  if (!activityType) {
    return Response.json(
      { error: `등록되지 않은 활동입니다: ${categoryInput} / ${name}` },
      { status: 400 },
    );
  }

  const created = await prisma
    .$transaction(async (tx) => {
      const group = await tx.emissionFactor.findMany({
        where: { activityTypeId: activityType.id },
        orderBy: { version: "desc" },
        select: { id: true, version: true, startDate: true },
      });

      const latestVersion = group[0]?.version ?? 0;

      for (const prev of group) {
        if (prev.startDate && prev.startDate >= startDate) {
          throw new Error(
            "기존 버전의 시작일보다 이후 날짜를 입력해 주세요.",
          );
        }
      }

      const endDateForPrev = new Date(startDate);
      endDateForPrev.setUTCDate(endDateForPrev.getUTCDate() - 1);

      await tx.emissionFactor.updateMany({
        where: {
          activityTypeId: activityType.id,
          endDate: null,
        },
        data: { endDate: endDateForPrev },
      });

      await tx.emissionFactor.updateMany({
        where: { activityTypeId: activityType.id },
        data: { isActive: false },
      });

      const newFactor = await tx.emissionFactor.create({
        data: {
          activityTypeId: activityType.id,
          factor: factorNum,
          unit,
          version: latestVersion + 1,
          isActive: true,
          startDate,
          endDate: null,
        },
        include: {
          activityType: { select: { code: true, name: true, category: true } },
        },
      });

      const affected = await tx.activityData.findMany({
        where: {
          activityTypeId: activityType.id,
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
            emissionFactorId: newFactor.id,
            carbonEmission: Number(a.amount) * factorNum,
          })),
        });
      }

      return newFactor;
    })
    .catch((e: Error) => {
      return { __error: e.message };
    });

  if ("__error" in (created as object)) {
    return Response.json(
      { error: (created as { __error: string }).__error },
      { status: 400 },
    );
  }

  const c = created as Awaited<
    ReturnType<typeof prisma.emissionFactor.create>
  > & {
    activityType: { code: string; name: string; category: string };
  };

  return Response.json({
    data: {
      id: c.id,
      typeCode: c.activityType.code,
      name: c.activityType.name,
      category: c.activityType.category,
      factor: c.factor,
      unit: c.unit,
      version: c.version,
      startDate: c.startDate ? c.startDate.toISOString().slice(0, 10) : null,
      endDate: c.endDate ? c.endDate.toISOString().slice(0, 10) : null,
      createdAt: c.createdAt.toISOString().slice(0, 10),
    },
  });
}

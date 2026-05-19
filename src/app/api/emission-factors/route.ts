import { prisma } from "@/shared/lib/prisma";

export async function GET() {
  const factors = await prisma.emissionFactor.findMany({
    select: {
      factorName: true,
      activityType: { select: { code: true } },
    },
    orderBy: [{ activityTypeId: "asc" }, { factorName: "asc" }],
  });

  const seen = new Set<string>();
  const data: { factorName: string; typeCode: string }[] = [];
  for (const f of factors) {
    const key = `${f.activityType.code}|${f.factorName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    data.push({ factorName: f.factorName, typeCode: f.activityType.code });
  }

  return Response.json({ data });
}

type CreateBody = {
  type?: unknown;
  factorName?: unknown;
  factor?: unknown;
  unit?: unknown;
  startDate?: unknown;
};

export async function POST(req: Request) {
  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return Response.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const typeCode = typeof body.type === "string" ? body.type.trim() : "";
  const factorName =
    typeof body.factorName === "string" ? body.factorName.trim() : "";
  const unit = typeof body.unit === "string" ? body.unit.trim() : "";
  const factorNum =
    typeof body.factor === "number"
      ? body.factor
      : Number(body.factor as string);
  const startDateStr =
    typeof body.startDate === "string" ? body.startDate : "";

  if (!typeCode) {
    return Response.json({ error: "활동 유형은 필수입니다." }, { status: 400 });
  }
  if (!factorName) {
    return Response.json({ error: "계수명은 필수입니다." }, { status: 400 });
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
  const startDate = new Date(startDateStr);
  if (Number.isNaN(startDate.getTime())) {
    return Response.json(
      { error: "올바른 시작일이 아닙니다." },
      { status: 400 },
    );
  }

  const activityType = await prisma.activityType.findUnique({
    where: { code: typeCode },
    select: { id: true },
  });
  if (!activityType) {
    return Response.json(
      { error: "존재하지 않는 활동 유형입니다." },
      { status: 400 },
    );
  }

  const created = await prisma
    .$transaction(async (tx) => {
      const group = await tx.emissionFactor.findMany({
        where: { activityTypeId: activityType.id, factorName },
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
          factorName,
          endDate: null,
        },
        data: { endDate: endDateForPrev },
      });

      return tx.emissionFactor.create({
        data: {
          activityTypeId: activityType.id,
          factorName,
          factor: factorNum,
          unit,
          version: latestVersion + 1,
          startDate,
          endDate: null,
        },
        include: { activityType: { select: { code: true } } },
      });
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
    activityType: { code: string };
  };

  return Response.json({
    data: {
      id: c.id,
      type: c.activityType.code,
      factorName: c.factorName,
      factor: c.factor,
      unit: c.unit,
      version: c.version,
      startDate: c.startDate ? c.startDate.toISOString().slice(0, 10) : null,
      endDate: c.endDate ? c.endDate.toISOString().slice(0, 10) : null,
      createdAt: c.createdAt.toISOString().slice(0, 10),
    },
  });
}

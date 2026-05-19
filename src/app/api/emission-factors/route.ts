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

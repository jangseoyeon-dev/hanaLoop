import { prisma } from "@/shared/lib/prisma";

export async function GET() {
  const types = await prisma.activityType.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { id: true, code: true, name: true, category: true, unit: true },
  });
  return Response.json({ data: types });
}

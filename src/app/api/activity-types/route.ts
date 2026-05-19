import { prisma } from "@/shared/lib/prisma";

export async function GET() {
  const types = await prisma.activityType.findMany({
    orderBy: { id: "asc" },
    select: { id: true, code: true, name: true, unit: true },
  });
  return Response.json({ data: types });
}

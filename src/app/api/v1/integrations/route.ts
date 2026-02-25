import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const logs = await prisma.integrationLog.findMany({
      where: status ? { status } : undefined,
      include: { channel: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return ok({ logs });
  } catch (error) {
    return handleApiError(error);
  }
}

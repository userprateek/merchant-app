import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER, UserRole.PACKING_CREW]);
    const { id } = await context.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        channel: true,
        items: { include: { product: true } },
      },
    });
    if (!order) return ok({ error: "ORDER_NOT_FOUND" }, 404);
    return ok({ order });
  } catch (error) {
    return handleApiError(error);
  }
}

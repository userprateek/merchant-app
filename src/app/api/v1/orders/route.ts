import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER, UserRole.PACKING_CREW]);
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") ?? undefined;
    const channelFilter = searchParams.get("channel") ?? undefined;
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "25", 10) || 25)
    );

    const where: Prisma.OrderWhereInput = {};
    if (statusFilter && statusFilter in OrderStatus) {
      where.status = statusFilter as OrderStatus;
    }
    if (channelFilter) where.channelId = channelFilter;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { channel: true, items: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return ok({
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      orders,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

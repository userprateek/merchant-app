import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request, [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.PACKING_CREW,
      UserRole.VIEWER,
    ]);

    const [totalProducts, totalOrders, activeListings, lowStockCandidates, orderCounts] =
      await Promise.all([
        prisma.product.count(),
        prisma.order.count(),
        prisma.channelListing.count({ where: { listingStatus: "LISTED" } }),
        prisma.product.findMany({
          where: { totalStock: { lte: 10 } },
          orderBy: { totalStock: "asc" },
          take: 100,
        }),
        prisma.order.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
      ]);

    const lowStock = lowStockCandidates.filter(
      (product) => product.totalStock <= 5 || product.totalStock <= product.reservedStock
    );

    return ok({
      totals: { totalProducts, totalOrders, activeListings },
      orderCounts,
      lowStock,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import {
  bulkCancelOrders,
  bulkConfirmOrders,
  bulkPackOrders,
  bulkShipOrders,
} from "@/features/orders/service";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { action?: string; orderIds?: string[] };
    const action = body.action?.trim() ?? "";
    const orderIds = Array.isArray(body.orderIds) ? body.orderIds : [];
    if (!action || orderIds.length === 0) {
      return ok({ error: "INVALID_INPUT" }, 400);
    }

    if (action === "confirm") {
      await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
      const result = await bulkConfirmOrders(orderIds);
      return ok({ result });
    }
    if (action === "cancel") {
      await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
      const result = await bulkCancelOrders(orderIds);
      return ok({ result });
    }
    if (action === "pack") {
      await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER, UserRole.PACKING_CREW]);
      const result = await bulkPackOrders(orderIds);
      return ok({ result });
    }
    if (action === "ship") {
      await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER, UserRole.PACKING_CREW]);
      const result = await bulkShipOrders(orderIds);
      return ok({ result });
    }

    return ok({ error: "UNSUPPORTED_ACTION" }, 400);
  } catch (error) {
    return handleApiError(error);
  }
}

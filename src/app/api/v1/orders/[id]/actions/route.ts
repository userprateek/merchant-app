import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import {
  cancelOrder,
  confirmOrder,
  generateInvoice,
  generateShippingLabel,
  packOrder,
  returnOrder,
  shipOrder,
} from "@/features/orders/service";
import { markOrderReturnedToWarehouseById } from "@/features/orders/channel-events.service";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { action?: string };
    const action = body.action?.trim() ?? "";
    if (!action) return ok({ error: "MISSING_ACTION" }, 400);

    if (action === "confirm") {
      await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
      await confirmOrder(id);
      return ok({ success: true });
    }
    if (action === "cancel") {
      await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
      await cancelOrder(id);
      return ok({ success: true });
    }
    if (action === "pack") {
      await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER, UserRole.PACKING_CREW]);
      await packOrder(id);
      return ok({ success: true });
    }
    if (action === "ship") {
      await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER, UserRole.PACKING_CREW]);
      await shipOrder(id);
      return ok({ success: true });
    }
    if (action === "return") {
      await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
      await returnOrder(id);
      return ok({ success: true });
    }
    if (action === "warehouse_received") {
      await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER, UserRole.PACKING_CREW]);
      await markOrderReturnedToWarehouseById(id);
      return ok({ success: true });
    }
    if (action === "generate_shipping_label") {
      await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER, UserRole.PACKING_CREW]);
      const result = await generateShippingLabel(id);
      return ok({ success: true, result });
    }
    if (action === "generate_invoice") {
      await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER, UserRole.PACKING_CREW]);
      const result = await generateInvoice(id);
      return ok({ success: true, result });
    }

    return ok({ error: "UNSUPPORTED_ACTION" }, 400);
  } catch (error) {
    return handleApiError(error);
  }
}

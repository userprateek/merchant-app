import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
    const { id } = await context.params;
    const body = (await request.json()) as { delta?: number; reference?: string };
    const delta = Number(body.delta);
    if (!Number.isInteger(delta) || delta === 0) {
      return ok({ error: "INVALID_DELTA" }, 400);
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return ok({ error: "PRODUCT_NOT_FOUND" }, 404);

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: { totalStock: { increment: delta } },
      });
      await tx.inventoryMovement.create({
        data: {
          productId: id,
          type: "MANUAL_ADJUST",
          quantity: delta,
          reference: body.reference?.trim() || "API_MANUAL_ADJUST",
        },
      });
    });

    const updated = await prisma.product.findUnique({ where: { id } });
    return ok({ product: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { deleteProduct, updateProduct } from "@/features/merchant/services/product.service";
import { prisma } from "@/lib/prisma";
import { ProductStatus, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
    const { id } = await context.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true, listings: true },
    });
    if (!product) return ok({ error: "PRODUCT_NOT_FOUND" }, 404);
    return ok({ product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
    const { id } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      basePrice?: number;
      status?: ProductStatus;
    };

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return ok({ error: "PRODUCT_NOT_FOUND" }, 404);

    const product = await updateProduct(id, {
      name: body.name?.trim() || existing.name,
      basePrice: Number.isFinite(Number(body.basePrice))
        ? Number(body.basePrice)
        : existing.basePrice,
      status:
        body.status === ProductStatus.INACTIVE
          ? ProductStatus.INACTIVE
          : ProductStatus.ACTIVE,
    });
    return ok({ product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
    const { id } = await context.params;
    await deleteProduct(id);
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

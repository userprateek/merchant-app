import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { createProduct, getProducts } from "@/features/merchant/services/product.service";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
    const products = await getProducts();
    return ok({ products });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
    const body = (await request.json()) as {
      name?: string;
      sku?: string;
      basePrice?: number;
      totalStock?: number;
    };

    const name = body.name?.trim() ?? "";
    const sku = body.sku?.trim() ?? "";
    const basePrice = Number(body.basePrice);
    const totalStock = Number(body.totalStock);
    if (!name || !sku || !Number.isFinite(basePrice) || !Number.isFinite(totalStock)) {
      return ok({ error: "INVALID_INPUT" }, 400);
    }

    const product = await createProduct({
      name,
      sku,
      basePrice,
      totalStock,
    });

    return ok({ product }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

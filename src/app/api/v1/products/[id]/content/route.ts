import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";
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
      include: { images: true },
    });
    if (!product) return ok({ error: "PRODUCT_NOT_FOUND" }, 404);
    return ok({
      content: {
        description: product.description,
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
        attributes: product.attributes,
        images: product.images.map((img) => img.url).filter(Boolean),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiUser(request, [UserRole.ADMIN, UserRole.MANAGER]);
    const { id } = await context.params;
    const body = (await request.json()) as {
      description?: string;
      metaTitle?: string;
      metaDescription?: string;
      attributes?: Prisma.InputJsonValue;
      images?: string[];
    };

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return ok({ error: "PRODUCT_NOT_FOUND" }, 404);

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          description: body.description?.trim() || null,
          metaTitle: body.metaTitle?.trim() || null,
          metaDescription: body.metaDescription?.trim() || null,
          attributes: body.attributes ?? Prisma.JsonNull,
        },
      });

      await tx.productImage.deleteMany({ where: { productId: id } });

      for (const [index, url] of (body.images ?? []).entries()) {
        if (!url?.trim()) continue;
        await tx.productImage.create({
          data: {
            productId: id,
            sourceType: "URL",
            url: url.trim(),
            sortOrder: index,
          },
        });
      }
    });

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

import { prisma } from "@/lib/prisma";

export async function createProduct(data: {
  sku: string;
  name: string;
  basePrice: number;
  quantity: number;
}) {
  const normalizedSku = data.sku.trim().toUpperCase();

  return prisma.product.create({
    data: {
      name: data.name,
      sku: normalizedSku,
      basePrice: data.basePrice, // ✅ correct
      quantity: data.quantity,
      status: "ACTIVE",
    },
  });
}

export async function getAllProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function updateStock(productId: string, delta: number) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  const newQty = Math.max(0, product.quantity + delta);

  return prisma.product.update({
    where: { id: productId },
    data: { quantity: newQty },
  });
}

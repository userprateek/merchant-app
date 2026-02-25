import { prisma } from "@/lib/prisma";
import {
  createProduct,
  getProducts,
} from "@/features/merchant/services/product.service";
import { getChannels } from "@/features/channels/service";
import { revalidatePath } from "next/cache";
import ProductForm from "@/features/merchant/components/ProductForm";
import ProductList from "@/features/merchant/components/ProductList";
import { getRequiredNumber, getRequiredString } from "@/lib/validation";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export default async function ProductsPage() {
  await requireRole([UserRole.ADMIN, UserRole.MANAGER]);

  const productsRaw = await getProducts();
  const channelsRaw = await getChannels();

  const products = productsRaw.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    basePrice: product.basePrice,
    totalStock: product.totalStock,
    reservedStock: product.reservedStock,
    status: product.status,
    listings: product.listings.map((listing) => ({
      channelId: listing.channelId,
      listingStatus: listing.listingStatus,
      currentPrice: listing.currentPrice,
    })),
  }));

  const channels = channelsRaw.map((channel) => ({
    id: channel.id,
    name: channel.name,
  }));

  /*
  |--------------------------------------------------------------------------
  | CREATE PRODUCT
  |--------------------------------------------------------------------------
  */

  async function createProductAction(
    _prevState: { success: true } | { error: string } | null,
    formData: FormData
  ) {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER]);

    const name = getRequiredString(formData, "name");
    const sku = getRequiredString(formData, "sku").toUpperCase();
    const basePrice = getRequiredNumber(formData, "basePrice");
    const totalStock = getRequiredNumber(formData, "totalStock");

    try {
      await createProduct({
        name,
        sku,
        basePrice,
        totalStock,
      });

      revalidatePath("/products");
      return { success: true as const };
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "SKU_ALREADY_EXISTS") {
        return { error: "SKU already exists" };
      }

      throw error;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | INCREASE STOCK
  |--------------------------------------------------------------------------
  */

  async function increaseStock(formData: FormData) {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER]);

    const id = getRequiredString(formData, "id");

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: { totalStock: { increment: 1 } },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: id,
          type: "MANUAL_ADJUST",
          quantity: 1,
          reference: "MANUAL",
        },
      });
    });

    revalidatePath("/products");
  }

  /*
  |--------------------------------------------------------------------------
  | DECREASE STOCK
  |--------------------------------------------------------------------------
  */

  async function decreaseStock(formData: FormData) {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER]);

    const id = getRequiredString(formData, "id");

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: { totalStock: { decrement: 1 } },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: id,
          type: "MANUAL_ADJUST",
          quantity: -1,
          reference: "MANUAL",
        },
      });
    });

    revalidatePath("/products");
  }

  return (
    <div className="app-shell">
      <div className="page-header">
        <h1 className="page-title">Inventory</h1>
      </div>

      <section className="section-card">
        <h2 className="section-title">Add Product</h2>
        <ProductForm action={createProductAction} />
      </section>

      <section className="section-card">
        <h2 className="section-title">Product Catalog</h2>
        <ProductList
          products={products}
          channels={channels}
          increaseStock={increaseStock}
          decreaseStock={decreaseStock}
        />
      </section>
    </div>
  );
}

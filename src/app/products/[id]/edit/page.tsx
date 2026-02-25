import {
  deleteProduct,
  updateProduct,
} from "@/features/merchant/services/product.service";
import { prisma } from "@/lib/prisma";
import { getRequiredNumber, getRequiredString } from "@/lib/validation";
import { ProductStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    return <div>Product not found</div>;
  }
  const existingProduct = product;

  async function saveProduct(formData: FormData) {
    "use server";
    const name = getRequiredString(formData, "name");
    const basePrice = getRequiredNumber(formData, "basePrice");
    const statusRaw = getRequiredString(formData, "status");
    const status =
      statusRaw === "INACTIVE" ? ProductStatus.INACTIVE : ProductStatus.ACTIVE;

    await updateProduct(id, {
      name,
      basePrice,
      status,
    });

    revalidatePath("/products");
    revalidatePath(`/products/${id}/edit`);
    redirect("/products");
  }

  async function deleteProductAction() {
    "use server";
    await deleteProduct(id);
    revalidatePath("/products");
    redirect("/products");
  }

  async function archiveProductAction() {
    "use server";
    await updateProduct(id, {
      name: existingProduct.name,
      basePrice: existingProduct.basePrice,
      status: ProductStatus.INACTIVE,
    });
    revalidatePath("/products");
    revalidatePath(`/products/${id}/edit`);
    redirect("/products");
  }

  return (
    <div style={{ padding: 24, maxWidth: 560 }}>
      <h1>Edit Product</h1>
      <p>
        {existingProduct.name} ({existingProduct.sku})
      </p>

      <form action={saveProduct}>
        <div style={{ marginBottom: 12 }}>
          <label>Name</label>
          <br />
          <input name="name" defaultValue={existingProduct.name} style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Base Price</label>
          <br />
          <input
            name="basePrice"
            type="number"
            defaultValue={existingProduct.basePrice}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Status</label>
          <br />
          <select name="status" defaultValue={existingProduct.status}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
        <button type="submit">Save</button>
      </form>

      <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
        <form action={archiveProductAction}>
          <button type="submit">Archive (Set Inactive)</button>
        </form>
        <form action={deleteProductAction}>
          <button type="submit">Delete Product</button>
        </form>
      </div>
    </div>
  );
}

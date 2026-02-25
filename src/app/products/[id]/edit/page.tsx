import {
  deleteProduct,
  updateProduct,
} from "@/features/merchant/services/product.service";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { getRequiredNumber, getRequiredString } from "@/lib/validation";
import { ProductStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import ConfirmButton from "@/components/ConfirmButton";
import FloatingInput from "@/components/FloatingInput";
import FloatingSelect from "@/components/FloatingSelect";
import AppButton from "@/components/AppButton";

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole([UserRole.ADMIN, UserRole.MANAGER]);
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
    await requireRole([UserRole.ADMIN, UserRole.MANAGER]);
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
    await requireRole([UserRole.ADMIN, UserRole.MANAGER]);
    await deleteProduct(id);
    revalidatePath("/products");
    redirect("/products");
  }

  async function archiveProductAction() {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER]);
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

      <form action={saveProduct} className="form-shell">
        <div className="form-grid-single">
          <FloatingInput name="name" label="Name" defaultValue={existingProduct.name} required />
          <FloatingInput
            name="basePrice"
            label="Base Price"
            type="number"
            defaultValue={String(existingProduct.basePrice)}
            required
          />
          <FloatingSelect
            name="status"
            label="Status"
            options={["ACTIVE", "INACTIVE"]}
            defaultValue={existingProduct.status}
            maxMenuHeight={120}
          />
        </div>
        <AppButton type="submit">Save</AppButton>
      </form>

      <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
        <form id="archive-product-form" action={archiveProductAction}>
          <ConfirmButton
            formId="archive-product-form"
            message="Archive this product (set as inactive)?"
          >
            Archive (Set Inactive)
          </ConfirmButton>
        </form>
        <form id="delete-product-form" action={deleteProductAction}>
          <ConfirmButton
            formId="delete-product-form"
            message="Delete this product permanently?"
          >
            Delete Product
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}

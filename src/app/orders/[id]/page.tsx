import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  cancelOrder,
  confirmOrder,
  generateInvoice,
  generateShippingLabel,
  returnOrder,
  packOrder,
  shipOrder,
} from "@/features/orders/service";
import { formatDateTime } from "@/lib/time";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { markOrderReturnedToWarehouseById } from "@/features/orders/channel-events.service";
import ConfirmButton from "@/components/ConfirmButton";
import DataTable, { DataTableColumn } from "@/components/DataTable";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole([
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.PACKING_CREW,
  ]);

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      channel: true,
      items: {
        include: { product: true },
      },
    },
  });

  if (!order) {
    return <div>Order not found</div>;
  }
  const orderId = order.id;
  const itemColumns: DataTableColumn<(typeof order.items)[number]>[] = [
    {
      field: "product",
      header: "Product",
      render: (item) => item.product.name,
    },
    { field: "quantity", header: "Qty", align: "right" },
    {
      field: "unitPrice",
      header: "Unit Price",
      align: "right",
      render: (item) => `₹${item.unitPrice}`,
    },
    {
      field: "totalPrice",
      header: "Total",
      align: "right",
      render: (item) => `₹${item.totalPrice}`,
    },
  ];

  async function confirmAction() {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER]);
    await confirmOrder(orderId);
    revalidatePath(`/orders/${orderId}`);
  }

  async function cancelAction() {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER]);
    await cancelOrder(orderId);

    revalidatePath(`/orders/${orderId}`);
  }

  async function shipAction() {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.PACKING_CREW]);
    await shipOrder(orderId);

    revalidatePath(`/orders/${orderId}`);
  }

  async function packAction() {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.PACKING_CREW]);
    await packOrder(orderId);

    revalidatePath(`/orders/${orderId}`);
  }

  async function generateShippingLabelAction() {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.PACKING_CREW]);
    await generateShippingLabel(orderId);
    revalidatePath("/integrations");
  }

  async function generateInvoiceAction() {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.PACKING_CREW]);
    await generateInvoice(orderId);
    revalidatePath("/integrations");
  }

  async function markWarehouseReceivedAction() {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.PACKING_CREW]);
    await markOrderReturnedToWarehouseById(orderId);
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");
  }

  async function returnAction() {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER]);
    await returnOrder(orderId);
    revalidatePath(`/orders/${orderId}`);
  }

  return (
    <div className="app-shell">
      <div className="page-header">
        <h1 className="page-title">
          Order {order.externalOrderId} ({order.channel.name})
        </h1>
      </div>

      <div className="meta-grid">
        <div className="meta-item">
          <div className="meta-label">Status</div>
          <div className="meta-value">{order.status}</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Total</div>
          <div className="meta-value">₹{order.totalAmount}</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Created</div>
          <div className="meta-value">{formatDateTime(order.createdAt)}</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Customer Cancelled At</div>
          <div className="meta-value">
            {order.customerCancelledAt ? formatDateTime(order.customerCancelledAt) : "-"}
          </div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Returned To Warehouse At</div>
          <div className="meta-value">
            {order.warehouseReceivedAt ? formatDateTime(order.warehouseReceivedAt) : "-"}
          </div>
        </div>
      </div>

      <section className="section-card">
        <h2 className="section-title">Items</h2>
        <DataTable columns={itemColumns} rows={order.items} rowKey="id" />
      </section>

      <section className="section-card">
        {(user.role === "ADMIN" || user.role === "MANAGER" || user.role === "PACKING_CREW") && (
          <div className="actions-row" style={{ marginBottom: 10 }}>
            <form id="generate-shipping-label-form" action={generateShippingLabelAction}>
              <ConfirmButton
                formId="generate-shipping-label-form"
                message="Generate shipping label for this order?"
              >
                Generate Shipping Label
              </ConfirmButton>
            </form>
            <form id="generate-invoice-form" action={generateInvoiceAction}>
              <ConfirmButton
                formId="generate-invoice-form"
                message="Generate invoice for this order?"
              >
                Generate Invoice
              </ConfirmButton>
            </form>
            {(order.customerCancelledAt || order.status === "SHIPPED") && (
              <form id="warehouse-received-form" action={markWarehouseReceivedAction}>
                <ConfirmButton
                  formId="warehouse-received-form"
                  message="Mark this order as returned to warehouse?"
                >
                  Mark Returned To Warehouse
                </ConfirmButton>
              </form>
            )}
          </div>
        )}

        {order.status === "CREATED" && (user.role === "ADMIN" || user.role === "MANAGER") && (
          <form id="confirm-order-form" action={confirmAction}>
            <ConfirmButton formId="confirm-order-form" message="Confirm this order?">
              Confirm
            </ConfirmButton>
          </form>
        )}

        {order.status === "CONFIRMED" &&
          (user.role === "ADMIN" || user.role === "MANAGER" || user.role === "PACKING_CREW") && (
          <form id="pack-order-form" action={packAction}>
            <ConfirmButton formId="pack-order-form" message="Mark this order as packed?">
              Mark as Packed
            </ConfirmButton>
          </form>
        )}

        {order.status === "PACKED" &&
          (user.role === "ADMIN" || user.role === "MANAGER" || user.role === "PACKING_CREW") && (
          <form id="ship-order-form" action={shipAction}>
            <ConfirmButton formId="ship-order-form" message="Mark this order as shipped?">
              Mark as Shipped
            </ConfirmButton>
          </form>
        )}

        {order.status !== "SHIPPED" &&
          order.status !== "CANCELLED" &&
          (user.role === "ADMIN" || user.role === "MANAGER") && (
            <form id="cancel-order-form" action={cancelAction}>
              <ConfirmButton
                formId="cancel-order-form"
                message="Cancel this order? Reserved stock will be released."
              >
                Cancel
              </ConfirmButton>
            </form>
          )}

        {order.status === "SHIPPED" &&
          (user.role === "ADMIN" || user.role === "MANAGER") && (
            <form id="return-order-form" action={returnAction}>
              <ConfirmButton
                formId="return-order-form"
                message="Mark this order as returned? Stock adjustments will be applied."
              >
                Mark as Returned
              </ConfirmButton>
            </form>
          )}
      </section>
    </div>
  );
}

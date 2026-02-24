import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { confirmOrder } from "@/features/orders/service";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  async function confirmAction() {
    "use server";
    await confirmOrder(orderId);
    revalidatePath(`/orders/${orderId}`);
  }

  async function cancelAction() {
    "use server";

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    revalidatePath(`/orders/${orderId}`);
  }

  async function shipAction() {
    "use server";

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "SHIPPED" },
    });

    revalidatePath(`/orders/${orderId}`);
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>
        Order {order.externalOrderId} ({order.channel.name})
      </h2>

      <p>Status: <strong>{order.status}</strong></p>
      <p>Total: ₹{order.totalAmount}</p>
      <p>Created: {order.createdAt.toLocaleString()}</p>

      <h3>Items</h3>

      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td>{item.product.name}</td>
              <td>{item.quantity}</td>
              <td>₹{item.unitPrice}</td>
              <td>₹{item.totalPrice}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 20 }}>
        {order.status === "CREATED" && (
          <form action={confirmAction}>
            <button type="submit">Confirm</button>
          </form>
        )}

        {order.status === "CONFIRMED" && (
          <form action={shipAction}>
            <button type="submit">Mark as Shipped</button>
          </form>
        )}

        {order.status !== "SHIPPED" &&
          order.status !== "CANCELLED" && (
            <form action={cancelAction}>
              <button type="submit">Cancel</button>
            </form>
          )}
      </div>
    </div>
  );
}
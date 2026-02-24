import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  bulkConfirmOrders,
  bulkShipOrders,
  bulkCancelOrders,
} from "@/features/orders/service";
import OrdersTable from "@/components/OrdersTable";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: {
    status?: string;
    channel?: string;
  };
}) {
  const statusFilter = searchParams?.status;
  const channelFilter = searchParams?.channel;

  const where: any = {};

  if (statusFilter) {
    where.status = statusFilter;
  }

  if (channelFilter) {
    where.channelId = channelFilter;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      channel: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  const channels = await prisma.channel.findMany();

  /*
  |--------------------------------------------------------------------------
  | BULK SERVER ACTIONS
  |--------------------------------------------------------------------------
  */

  async function handleBulkConfirm(orderIds: string[]) {
    "use server";

    await bulkConfirmOrders(orderIds);
    revalidatePath("/orders");
  }

  async function handleBulkShip(orderIds: string[]) {
    "use server";

    await bulkShipOrders(orderIds);
    revalidatePath("/orders");
  }

  async function handleBulkCancel(orderIds: string[]) {
    "use server";

    await bulkCancelOrders(orderIds);
    revalidatePath("/orders");
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Orders</h1>

      {/* Filters */}
      <div style={{ marginBottom: 16 }}>
        <form method="get">
          <select name="status" defaultValue={statusFilter || ""}>
            <option value="">All Status</option>
            <option value="CREATED">CREATED</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PACKED">PACKED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="RETURNED">RETURNED</option>
          </select>

          <select name="channel" defaultValue={channelFilter || ""}>
            <option value="">All Channels</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>

          <button type="submit">Apply</button>
        </form>
      </div>

      <OrdersTable
        orders={orders}
        onBulkConfirm={handleBulkConfirm}
        onBulkShip={handleBulkShip}
        onBulkCancel={handleBulkCancel}
      />
    </div>
  );
}
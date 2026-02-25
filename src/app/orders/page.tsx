import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  bulkPackOrders,
  bulkConfirmOrders,
  bulkShipOrders,
  bulkCancelOrders,
} from "@/features/orders/service";
import { pullOrdersForAllEnabledChannels } from "@/features/orders/pull.service";
import OrdersTable from "@/components/OrdersTable";
import { toTimestampISO } from "@/lib/time";
import Link from "next/link";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{
    status?: string;
    channel?: string;
    page?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const statusFilter = resolvedSearchParams?.status;
  const channelFilter = resolvedSearchParams?.channel;
  const currentPage = Math.max(
    1,
    Number.parseInt(resolvedSearchParams?.page ?? "1", 10) || 1
  );
  const pageSize = 25;

  const where: Prisma.OrderWhereInput = {};

  if (statusFilter && statusFilter in OrderStatus) {
    where.status = statusFilter as OrderStatus;
  }

  if (channelFilter) {
    where.channelId = channelFilter;
  }

  const [ordersRaw, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        channel: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);
  const orders = ordersRaw.map((order) => ({
    id: order.id,
    externalOrderId: order.externalOrderId,
    status: order.status,
    totalAmount: order.totalAmount,
    channel: {
      name: order.channel.name,
    },
    createdAt: toTimestampISO(order.createdAt),
  }));

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

  async function handleBulkPack(orderIds: string[]) {
    "use server";

    await bulkPackOrders(orderIds);
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

  async function handlePullOrders() {
    "use server";
    await pullOrdersForAllEnabledChannels();
    revalidatePath("/orders");
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  function buildPageLink(targetPage: number) {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (channelFilter) params.set("channel", channelFilter);
    params.set("page", targetPage.toString());
    return `/orders?${params.toString()}`;
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
        <form action={handlePullOrders} style={{ marginTop: 8 }}>
          <button type="submit">Pull Orders From Enabled Channels</button>
        </form>
      </div>

      <OrdersTable
        orders={orders}
        onBulkConfirm={handleBulkConfirm}
        onBulkPack={handleBulkPack}
        onBulkShip={handleBulkShip}
        onBulkCancel={handleBulkCancel}
      />

      <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <span>
          Page {currentPage} of {totalPages} ({totalCount} orders)
        </span>
        {hasPrev && <Link href={buildPageLink(currentPage - 1)}>Previous</Link>}
        {hasNext && <Link href={buildPageLink(currentPage + 1)}>Next</Link>}
      </div>
    </div>
  );
}

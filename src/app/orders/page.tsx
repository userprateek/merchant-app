import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  bulkPackOrders,
  bulkConfirmOrders,
  bulkShipOrders,
  bulkCancelOrders,
} from "@/features/orders/service";
import { pullOrdersForAllEnabledChannels } from "@/features/orders/pull.service";
import { pollOrderUpdatesFromAllEnabledChannels } from "@/features/orders/channel-events.service";
import OrdersTable from "@/components/OrdersTable";
import { toTimestampISO } from "@/lib/time";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import FloatingSelect from "@/components/FloatingSelect";
import AppButton from "@/components/AppButton";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{
    status?: string;
    channel?: string;
    page?: string;
  }>;
}) {
  const user = await requireRole([
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.PACKING_CREW,
  ]);
  const ordersRole = user.role as "ADMIN" | "MANAGER" | "PACKING_CREW";

  const resolvedSearchParams = await searchParams;
  const statusFilter = resolvedSearchParams?.status;
  const channelFilter = resolvedSearchParams?.channel;
  const currentPage = Math.max(
    1,
    Number.parseInt(resolvedSearchParams?.page ?? "1", 10) || 1,
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
    await requireRole([UserRole.ADMIN, UserRole.MANAGER]);

    await bulkConfirmOrders(orderIds);
    revalidatePath("/orders");
  }

  async function handleBulkPack(orderIds: string[]) {
    "use server";
    await requireRole([
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.PACKING_CREW,
    ]);

    await bulkPackOrders(orderIds);
    revalidatePath("/orders");
  }

  async function handleBulkShip(orderIds: string[]) {
    "use server";
    await requireRole([
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.PACKING_CREW,
    ]);

    await bulkShipOrders(orderIds);
    revalidatePath("/orders");
  }

  async function handleBulkCancel(orderIds: string[]) {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER]);

    await bulkCancelOrders(orderIds);
    revalidatePath("/orders");
  }

  async function handlePullOrders() {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER]);
    await pullOrdersForAllEnabledChannels();
    revalidatePath("/orders");
  }

  async function handlePollOrderUpdates() {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER]);
    await pollOrderUpdatesFromAllEnabledChannels();
    revalidatePath("/orders");
    revalidatePath("/integrations");
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
    <div className="app-shell">
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
      </div>

      {/* Filters */}
      <section className="section-card">
        <form method="get" className="form-shell">
          <div className="form-grid">
            <FloatingSelect
              name="status"
              label="Order Status"
              options={[
                { value: "", label: "All Status" },
                { value: "CREATED", label: "CREATED" },
                { value: "CONFIRMED", label: "CONFIRMED" },
                { value: "PACKED", label: "PACKED" },
                { value: "SHIPPED", label: "SHIPPED" },
                { value: "DELIVERED", label: "DELIVERED" },
                { value: "CANCELLED", label: "CANCELLED" },
                { value: "RETURNED", label: "RETURNED" },
              ]}
              defaultValue={statusFilter || ""}
              maxMenuHeight={180}
            />

            <FloatingSelect
              name="channel"
              label="Channel"
              options={[
                { value: "", label: "All Channels" },
                ...channels.map((ch) => ({ value: ch.id, label: ch.name })),
              ]}
              defaultValue={channelFilter || ""}
              maxMenuHeight={220}
            />
            <div>
              <AppButton type="submit">Apply</AppButton>
            </div>
          </div>
        </form>
        {(user.role === "ADMIN" || user.role === "MANAGER") && (
          <div className="actions-row" style={{ marginTop: 8 }}>
            <form action={handlePullOrders} style={{ flex: 1 }}>
              <AppButton type="submit">
                Pull Orders From Enabled Channels
              </AppButton>
            </form>
            <form action={handlePollOrderUpdates} style={{ flex: 1 }}>
              <AppButton type="submit">Poll Channel Order Updates</AppButton>
            </form>
          </div>
        )}
      </section>

      <section className="section-card">
        <OrdersTable
          orders={orders}
          role={ordersRole}
          onBulkConfirm={handleBulkConfirm}
          onBulkPack={handleBulkPack}
          onBulkShip={handleBulkShip}
          onBulkCancel={handleBulkCancel}
        />
      </section>

      <div className="pager">
        <span>
          Page {currentPage} of {totalPages} ({totalCount} orders)
        </span>
        {hasPrev && <Link href={buildPageLink(currentPage - 1)}>Previous</Link>}
        {hasNext && <Link href={buildPageLink(currentPage + 1)}>Next</Link>}
      </div>
    </div>
  );
}

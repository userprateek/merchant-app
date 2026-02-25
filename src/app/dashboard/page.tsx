import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import DataTable, { DataTableColumn } from "@/components/DataTable";

export default async function DashboardPage() {
  await requireRole([
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.PACKING_CREW,
    UserRole.VIEWER,
  ]);

  const [
    totalProducts,
    totalOrders,
    activeListings,
    lowStockCandidates,
    orderCounts,
  ] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.channelListing.count({
        where: { listingStatus: "LISTED" },
      }),
      prisma.product.findMany({
        where: { totalStock: { lte: 10 } },
        orderBy: { totalStock: "asc" },
        take: 100,
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);
  const lowStockProducts = lowStockCandidates.filter(
    (product) => product.totalStock <= 5 || product.totalStock <= product.reservedStock
  );
  const lowStockColumns: DataTableColumn<(typeof lowStockProducts)[number]>[] = [
    { field: "sku", header: "SKU" },
    { field: "name", header: "Name" },
    { field: "totalStock", header: "Total", align: "right" },
    { field: "reservedStock", header: "Reserved", align: "right" },
    {
      field: "available",
      header: "Available",
      align: "right",
      render: (product) => product.totalStock - product.reservedStock,
    },
  ];

  return (
    <div className="app-shell">
      <div className="page-header">
        <h1 className="page-title">Analytics Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Products</div>
          <div className="stat-value">{totalProducts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Orders</div>
          <div className="stat-value">{totalOrders}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Listings</div>
          <div className="stat-value">{activeListings}</div>
        </div>
      </div>

      <section className="section-card">
      <h2 className="section-title">Order Status Breakdown</h2>
      <ul className="info-list">
        {orderCounts.map((item) => (
          <li key={item.status}>
            {item.status}: {item._count._all}
          </li>
        ))}
      </ul>
      </section>

      <section className="section-card">
      <h2 className="section-title">Low Stock / At Risk</h2>
      <DataTable
        columns={lowStockColumns}
        rows={lowStockProducts}
        rowKey="id"
        emptyMessage="No low-stock products."
      />
      </section>
    </div>
  );
}

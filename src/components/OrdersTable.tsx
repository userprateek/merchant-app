"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDateTime } from "@/lib/time";
import ConfirmButton from "@/components/ConfirmButton";
import AppButton from "@/components/AppButton";
import DataTable, { DataTableColumn } from "@/components/DataTable";

type Order = {
  id: string;
  externalOrderId: string;
  status: string;
  totalAmount: number;
  channel: {
    name: string;
  };
  createdAt: string;
};

type Props = {
  orders: Order[];
  role: "ADMIN" | "MANAGER" | "PACKING_CREW";
  onBulkConfirm: (ids: string[]) => Promise<void>;
  onBulkPack: (ids: string[]) => Promise<void>;
  onBulkShip: (ids: string[]) => Promise<void>;
  onBulkCancel: (ids: string[]) => Promise<void>;
};

export default function OrdersTable({
  orders,
  role,
  onBulkConfirm,
  onBulkPack,
  onBulkShip,
  onBulkCancel,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleAll() {
    if (selected.length === orders.length) {
      setSelected([]);
    } else {
      setSelected(orders.map((o) => o.id));
    }
  }

  function clearSelection() {
    setSelected([]);
  }

  const selectedOrders = orders.filter((o) => selected.includes(o.id));

  const allCreated = selectedOrders.every((o) => o.status === "CREATED");

  const allConfirmed = selectedOrders.every((o) => o.status === "CONFIRMED");
  const allPacked = selectedOrders.every((o) => o.status === "PACKED");
  const canManage = role === "ADMIN" || role === "MANAGER";
  const canPackShip = canManage || role === "PACKING_CREW";
  const columns: DataTableColumn<Order>[] = [
    {
      field: "select",
      header: (
        <input
          type="checkbox"
          checked={selected.length > 0 && selected.length === orders.length}
          onChange={toggleAll}
        />
      ),
      align: "center",
      render: (order) => (
        <input
          type="checkbox"
          checked={selected.includes(order.id)}
          onChange={() => toggle(order.id)}
        />
      ),
    },
    { field: "externalOrderId", header: "Order #" },
    {
      field: "channel",
      header: "Channel",
      render: (order) => order.channel.name,
    },
    { field: "status", header: "Status" },
    {
      field: "totalAmount",
      header: "Total",
      render: (order) => `₹${order.totalAmount}`,
      align: "right",
    },
    {
      field: "createdAt",
      header: "Created",
      render: (order) => formatDateTime(order.createdAt),
    },
    {
      field: "manage",
      header: "Manage",
      render: (order) => <Link href={`/orders/${order.id}`}>Manage</Link>,
    },
  ];

  return (
    <>
      {/* Bulk Actions */}
      <div className="actions-row" style={{ marginBottom: 16 }}>
        <div>
          <AppButton
            disabled={selected.length === 0 || !allCreated || !canManage}
            onClick={() => {
              onBulkConfirm(selected);
              clearSelection();
            }}
          >
            Confirm Selected
          </AppButton>
        </div>

        <div>
          <AppButton
            disabled={selected.length === 0 || !allConfirmed || !canPackShip}
            onClick={() => {
            onBulkPack(selected);
            clearSelection();
          }}
        >
          Pack Selected
        </AppButton>
        </div>
        <div>
        <AppButton
          disabled={selected.length === 0 || !allPacked || !canPackShip}
          onClick={() => {
            onBulkShip(selected);
            clearSelection();
          }}
        >
          Ship Selected
        </AppButton>
        </div>
        <div>
        <ConfirmButton
          disabled={selected.length === 0 || !canManage}
          message="Are you sure you want to cancel selected orders?"
          onConfirm={() => {
            onBulkCancel(selected);
            clearSelection();
          }}
        >
          Cancel Selected
        </ConfirmButton>
        </div>
      </div>

      <DataTable columns={columns} rows={orders} rowKey="id" />
    </>
  );
}

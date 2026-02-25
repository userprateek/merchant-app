"use client";
import DataTable, { DataTableColumn } from "@/components/DataTable";

type ChannelRow = {
  id: string;
  name: string;
  baseUrl: string | null;
  isEnabled: boolean;
  isSandbox: boolean;
};

export default function ChannelTable({ channels }: { channels: ChannelRow[] }) {
  const columns: DataTableColumn<ChannelRow>[] = [
    { field: "name", header: "Name" },
    {
      field: "baseUrl",
      header: "Base URL",
      render: (ch) => ch.baseUrl || "-",
    },
    {
      field: "enabled",
      header: "Enabled",
      render: (ch) => (ch.isEnabled ? "YES" : "NO"),
      align: "center",
    },
    {
      field: "sandbox",
      header: "Sandbox",
      render: (ch) => (ch.isSandbox ? "YES" : "NO"),
      align: "center",
    },
    {
      field: "actions",
      header: "Actions",
      render: (ch) => <a href={`/channels/${ch.id}`}>Configure</a>,
    },
  ];

  return (
    <DataTable columns={columns} rows={channels} rowKey="id" />
  );
}

import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/time";
import { retryIntegrationLog } from "@/features/integrations/service";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import AppButton from "@/components/AppButton";
import DataTable, { DataTableColumn } from "@/components/DataTable";

export default async function IntegrationsPage() {
  await requireRole([UserRole.ADMIN, UserRole.MANAGER]);

  async function retryAction(formData: FormData) {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER]);
    const logId = formData.get("logId");
    if (typeof logId !== "string" || !logId) return;
    await retryIntegrationLog(logId);
    revalidatePath("/integrations");
  }

  const logs = await prisma.integrationLog.findMany({
    include: {
      channel: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const columns: DataTableColumn<(typeof logs)[number]>[] = [
    {
      field: "createdAt",
      header: "Time",
      render: (log) => formatDateTime(log.createdAt),
    },
    {
      field: "channel",
      header: "Channel",
      render: (log) => log.channel.name,
    },
    { field: "eventType", header: "Event" },
    { field: "status", header: "Status" },
    {
      field: "payload",
      header: "Payload",
      render: (log) => (
        <pre style={{ maxWidth: 240, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(log.payload, null, 2)}
        </pre>
      ),
    },
    {
      field: "response",
      header: "Response",
      render: (log) => (
        <pre style={{ maxWidth: 240, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(log.response, null, 2)}
        </pre>
      ),
    },
    {
      field: "actions",
      header: "Actions",
      render: (log) =>
        log.status === "FAILED" ? (
          <form action={retryAction}>
            <input type="hidden" name="logId" value={log.id} />
            <AppButton type="submit">Retry</AppButton>
          </form>
        ) : (
          ""
        ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1>Integration Logs</h1>
      <DataTable
        columns={columns}
        rows={logs}
        rowKey="id"
        emptyMessage="No integration logs yet."
      />
    </div>
  );
}

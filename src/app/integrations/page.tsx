import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/time";
import { retryIntegrationLog } from "@/features/integrations/service";
import { revalidatePath } from "next/cache";

export default async function IntegrationsPage() {
  async function retryAction(formData: FormData) {
    "use server";
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

  return (
    <div style={{ padding: 24 }}>
      <h1>Integration Logs</h1>
      <table
        border={1}
        cellPadding={8}
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Time</th>
            <th>Channel</th>
            <th>Event</th>
            <th>Status</th>
            <th>Payload</th>
            <th>Response</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{formatDateTime(log.createdAt)}</td>
              <td>{log.channel.name}</td>
              <td>{log.eventType}</td>
              <td>{log.status}</td>
              <td>
                <pre style={{ maxWidth: 240, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(log.payload, null, 2)}
                </pre>
              </td>
              <td>
                <pre style={{ maxWidth: 240, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(log.response, null, 2)}
                </pre>
              </td>
              <td>
                {log.status === "FAILED" && (
                  <form action={retryAction}>
                    <input type="hidden" name="logId" value={log.id} />
                    <button type="submit">Retry</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={7}>No integration logs yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

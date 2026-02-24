import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

export default async function ChannelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const channel = await prisma.channel.findUnique({
    where: { id },
  });

  if (!channel) {
    notFound();
  }

  async function updateChannelConfig(formData: FormData) {
    "use server";

    const baseUrl = formData.get("baseUrl") as string;
    const apiKey = formData.get("apiKey") as string;
    const apiSecret = formData.get("apiSecret") as string;
    const accessToken = formData.get("accessToken") as string;
    const webhookSecret = formData.get("webhookSecret") as string;
    const isEnabled = formData.get("isEnabled") === "on";
    const isSandbox = formData.get("isSandbox") === "on";

    await prisma.channel.update({
      where: { id },
      data: {
        baseUrl: baseUrl || null,
        apiKey: apiKey || null,
        apiSecret: apiSecret || null,
        accessToken: accessToken || null,
        webhookSecret: webhookSecret || null,
        isEnabled,
        isSandbox,
      },
    });

    revalidatePath("/channels");
    revalidatePath(`/channels/${id}`);
  }

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h1>Configure Channel: {channel.name}</h1>

      <form action={updateChannelConfig}>
        <div style={{ marginBottom: 12 }}>
          <label>Base URL</label>
          <br />
          <input
            name="baseUrl"
            defaultValue={channel.baseUrl || ""}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>API Key</label>
          <br />
          <input
            name="apiKey"
            defaultValue={channel.apiKey || ""}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>API Secret</label>
          <br />
          <input
            name="apiSecret"
            defaultValue={channel.apiSecret || ""}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Access Token</label>
          <br />
          <input
            name="accessToken"
            defaultValue={channel.accessToken || ""}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Webhook Secret</label>
          <br />
          <input
            name="webhookSecret"
            defaultValue={channel.webhookSecret || ""}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            <input
              type="checkbox"
              name="isSandbox"
              defaultChecked={channel.isSandbox}
            />
            Sandbox Mode
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            <input
              type="checkbox"
              name="isEnabled"
              defaultChecked={channel.isEnabled}
            />
            Enable Channel
          </label>
        </div>

        <button type="submit">Save Configuration</button>
      </form>
    </div>
  );
}
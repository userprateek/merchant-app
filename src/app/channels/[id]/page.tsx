import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { updateChannelConfig } from "@/features/channels/service";
import { decryptSecret, encryptSecret } from "@/lib/secrets";
import {
  getBooleanFromCheckbox,
  getOptionalString,
} from "@/lib/validation";

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

  async function updateChannelConfigAction(formData: FormData) {
    "use server";

    await updateChannelConfig(id, {
      baseUrl: getOptionalString(formData, "baseUrl") ?? null,
      apiKey: encryptSecret(getOptionalString(formData, "apiKey")),
      apiSecret: encryptSecret(getOptionalString(formData, "apiSecret")),
      accessToken: encryptSecret(getOptionalString(formData, "accessToken")),
      webhookSecret: encryptSecret(getOptionalString(formData, "webhookSecret")),
      isEnabled: getBooleanFromCheckbox(formData, "isEnabled"),
      isSandbox: getBooleanFromCheckbox(formData, "isSandbox"),
    });

    revalidatePath("/channels");
    revalidatePath(`/channels/${id}`);
  }

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h1>Configure Channel: {channel.name}</h1>

      <form action={updateChannelConfigAction}>
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
            defaultValue={decryptSecret(channel.apiKey)}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>API Secret</label>
          <br />
          <input
            name="apiSecret"
            defaultValue={decryptSecret(channel.apiSecret)}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Access Token</label>
          <br />
          <input
            name="accessToken"
            defaultValue={decryptSecret(channel.accessToken)}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Webhook Secret</label>
          <br />
          <input
            name="webhookSecret"
            defaultValue={decryptSecret(channel.webhookSecret)}
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

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { updateChannelConfig } from "@/features/channels/service";
import { decryptSecret, encryptSecret } from "@/lib/secrets";
import {
  getBooleanFromCheckbox,
  getOptionalString,
} from "@/lib/validation";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import ChannelConfigForm from "@/features/channels/components/ChannelConfigForm";

export default async function ChannelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole([UserRole.ADMIN, UserRole.MANAGER]);

  const { id } = await params;

  const channel = await prisma.channel.findUnique({
    where: { id },
  });

  if (!channel) {
    notFound();
  }

  async function updateChannelConfigAction(
    _prevState: { success: true } | { error: string } | null,
    formData: FormData
  ) {
    "use server";
    await requireRole([UserRole.ADMIN, UserRole.MANAGER]);
    try {
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
      return { success: true as const };
    } catch (error) {
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to update channel config" };
    }
  }

  return (
    <div className="app-shell app-shell--narrow">
      <div className="page-header">
        <h1 className="page-title">Configure Channel: {channel.name}</h1>
      </div>

      <section className="section-card">
        <ChannelConfigForm
          action={updateChannelConfigAction}
          defaults={{
            baseUrl: channel.baseUrl || "",
            apiKey: decryptSecret(channel.apiKey),
            apiSecret: decryptSecret(channel.apiSecret),
            accessToken: decryptSecret(channel.accessToken),
            webhookSecret: decryptSecret(channel.webhookSecret),
            isSandbox: channel.isSandbox,
            isEnabled: channel.isEnabled,
          }}
        />
      </section>
    </div>
  );
}

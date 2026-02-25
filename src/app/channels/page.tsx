import ChannelTable from "@/features/channels/components/ChannelTable";
import { getChannels } from "@/features/channels/service";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export default async function ChannelsPage() {
  await requireRole([UserRole.ADMIN, UserRole.MANAGER]);

  const channelsRaw = await getChannels();
  const channels = channelsRaw.map((channel) => ({
    id: channel.id,
    name: channel.name,
    baseUrl: channel.baseUrl,
    isEnabled: channel.isEnabled,
    isSandbox: channel.isSandbox,
  }));

  return (
    <div style={{ padding: 24 }}>
      <h1>Channel Configuration</h1>
      <ChannelTable channels={channels} />
    </div>
  );
}

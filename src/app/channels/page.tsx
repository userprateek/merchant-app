import ChannelTable from "@/features/channels/components/ChannelTable";
import { getChannels } from "@/features/channels/service";

export default async function ChannelsPage() {
  const channels = await getChannels();

  return (
    <div style={{ padding: 24 }}>
      <h1>Channel Configuration</h1>
      <ChannelTable channels={channels} />
    </div>
  );
}
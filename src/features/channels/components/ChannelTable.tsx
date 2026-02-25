"use client";

type ChannelRow = {
  id: string;
  name: string;
  baseUrl: string | null;
  isEnabled: boolean;
  isSandbox: boolean;
};

export default function ChannelTable({ channels }: { channels: ChannelRow[] }) {

  return (
    <table border={1} cellPadding={8} style={{ width: "100%" }}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Base URL</th>
          <th>Enabled</th>
          <th>Sandbox</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {channels.map((ch) => (
          <tr key={ch.id}>
            <td>{ch.name}</td>
            <td>{ch.baseUrl || "-"}</td>
            <td>{ch.isEnabled ? "YES" : "NO"}</td>
            <td>{ch.isSandbox ? "YES" : "NO"}</td>
            <td>
              <a href={`/channels/${ch.id}`}>Configure</a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

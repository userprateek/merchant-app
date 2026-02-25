import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function Home() {
  const user = await requireUser();

  const buttonStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "24px",
    fontSize: "20px",
    fontWeight: 600,
    textAlign: "center",
    borderRadius: "12px",
    border: "1px solid #ccc",
    textDecoration: "none",
    color: "#111",
    background: "#f5f5f5",
    transition: "0.2s ease",
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: "800px",
    margin: "80px auto",
    display: "grid",
    gap: "24px",
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign: "center" }}>Merchant Control Panel</h1>

      <Link href="/products" style={buttonStyle}>
        📦 Manage Products
      </Link>

      <Link href="/orders" style={buttonStyle}>
        🧾 Process Orders
      </Link>

      <Link href="/channels" style={buttonStyle}>
        🔌 Configure Channels
      </Link>

      <Link href="/products" style={buttonStyle}>
        🏷 Manage Listings
      </Link>

      <Link href="/integrations" style={buttonStyle}>
        📡 Integration Logs
      </Link>

      <Link href="/dashboard" style={buttonStyle}>
        📊 Analytics Dashboard
      </Link>

      {user.role === "ADMIN" && (
        <Link href="/admin/users" style={buttonStyle}>
          👥 User & Roles
        </Link>
      )}
    </div>
  );
}

export default function Home() {
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

      <a href="/products" style={buttonStyle}>
        📦 Manage Products
      </a>

      <a href="/orders" style={buttonStyle}>
        🧾 Process Orders
      </a>

      <a href="/channels" style={buttonStyle}>
        🔌 Configure Channels
      </a>

      <a href="/products" style={buttonStyle}>
        🏷 Manage Listings
      </a>

      <a href="/integrations" style={buttonStyle}>
        📡 Integration Logs
      </a>

      <a href="/dashboard" style={buttonStyle}>
        📊 Analytics Dashboard
      </a>
    </div>
  );
}
import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function Home() {
  const user = await requireUser();

  return (
    <div className="app-shell app-shell--narrow">
      <div className="page-header">
        <h1 className="page-title">Merchant Control Panel</h1>
      </div>
      <div className="home-grid">
        <Link href="/products" className="home-tile">
          Manage Products
        </Link>

        <Link href="/orders" className="home-tile">
          Process Orders
        </Link>

        <Link href="/channels" className="home-tile">
          Configure Channels
        </Link>

        <Link href="/products" className="home-tile">
          Manage Listings
        </Link>

        <Link href="/integrations" className="home-tile">
          Integration Logs
        </Link>

        <Link href="/dashboard" className="home-tile">
          Analytics Dashboard
        </Link>

        {user.role === "ADMIN" && (
          <Link href="/admin/users" className="home-tile">
            User & Roles
          </Link>
        )}
      </div>
    </div>
  );
}

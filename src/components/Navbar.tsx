import Link from "next/link";
import { logout, getCurrentUser } from "@/lib/auth";
import AppButton from "@/components/AppButton";

export default async function Navbar() {
  const user = await getCurrentUser();

  async function logoutAction() {
    "use server";
    await logout();
  }

  return (
    <nav
      style={{
        padding: "16px",
        background: "white",
        borderBottom: "1px solid #eee",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <strong>
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          Merchant App
        </Link>
      </strong>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {user ? (
          <>
            <span>
              {user.name} ({user.role})
            </span>
            <form action={logoutAction}>
              <AppButton type="submit">Logout</AppButton>
            </form>
          </>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

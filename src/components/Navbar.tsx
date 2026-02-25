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
    <nav className="app-nav">
      <div className="app-nav__brand">
        <Link href="/">Merchant App</Link>
      </div>
      <div className="app-nav__actions">
        {user ? (
          <details className="profile-menu">
            <summary className="profile-menu__trigger">
              <span className="profile-menu__name">{user.name}</span>
              <span className="profile-menu__caret">▾</span>
            </summary>
            <div className="profile-menu__panel">
              <div className="profile-menu__meta">
                <div className="profile-menu__label">Signed in as</div>
                <div className="profile-menu__value">{user.name}</div>
                <div className="profile-menu__sub">{user.email}</div>
                <div className="profile-menu__role">Role: {user.role}</div>
              </div>
              <form action={logoutAction}>
                <AppButton type="submit">Logout</AppButton>
              </form>
            </div>
          </details>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

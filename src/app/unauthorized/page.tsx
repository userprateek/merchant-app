import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="app-shell app-shell--narrow">
      <div className="page-header">
        <h1 className="page-title">Unauthorized</h1>
        <p className="page-subtitle">You do not have permission to access this page.</p>
      </div>
      <Link href="/">Go to Home</Link>
    </div>
  );
}

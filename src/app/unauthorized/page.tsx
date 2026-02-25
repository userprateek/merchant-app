import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Unauthorized</h1>
      <p>You do not have permission to access this page.</p>
      <Link href="/">Go to Home</Link>
    </div>
  );
}

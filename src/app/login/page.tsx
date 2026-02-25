import { loginWithPassword } from "@/lib/auth";
import { getRequiredString } from "@/lib/validation";
import Link from "next/link";
import { redirect } from "next/navigation";
import FloatingInput from "@/components/FloatingInput";
import AppButton from "@/components/AppButton";

export default function LoginPage() {
  async function loginAction(formData: FormData) {
    "use server";
    const email = getRequiredString(formData, "email");
    const password = getRequiredString(formData, "password");
    await loginWithPassword(email, password);
    redirect("/");
  }

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h1>Login</h1>
      <form action={loginAction} className="form-shell">
        <div className="form-grid-single">
          <FloatingInput name="email" label="Email" type="email" required maxLength={200} />
          <FloatingInput name="password" label="Password" type="password" required maxLength={100} />
        </div>
        <AppButton type="submit">Login</AppButton>
      </form>
      <p style={{ marginTop: 12 }}>
        Need an account? <Link href="/signup">Sign up</Link>
      </p>
    </div>
  );
}

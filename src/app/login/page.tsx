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
    <div className="app-shell app-shell--narrow">
      <div className="page-header">
        <h1 className="page-title">Login</h1>
      </div>
      <form action={loginAction} className="form-shell section-card">
        <div className="form-grid-single">
          <FloatingInput name="email" label="Email" type="email" required maxLength={200} />
          <FloatingInput name="password" label="Password" type="password" required maxLength={100} />
          <AppButton type="submit">Login</AppButton>
        </div>
      </form>
      <p className="page-subtitle">
        Need an account? <Link href="/signup">Sign up</Link>
      </p>
    </div>
  );
}

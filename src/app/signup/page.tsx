import { createViewerSignupAccount, loginWithPassword } from "@/lib/auth";
import { getRequiredString } from "@/lib/validation";
import { redirect } from "next/navigation";
import FloatingInput from "@/components/FloatingInput";
import AppButton from "@/components/AppButton";

export default function SignupPage() {
  async function signupAction(formData: FormData) {
    "use server";

    const name = getRequiredString(formData, "name");
    const email = getRequiredString(formData, "email");
    const password = getRequiredString(formData, "password");

    await createViewerSignupAccount({ name, email, password });
    await loginWithPassword(email, password);
    redirect("/");
  }

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h1>Create Account</h1>
      <p>Self-signup users are created with VIEWER role.</p>
      <form action={signupAction} className="form-shell">
        <div className="form-grid-single">
          <FloatingInput name="name" label="Name" required maxLength={120} />
          <FloatingInput name="email" label="Email" type="email" required maxLength={200} />
          <FloatingInput name="password" label="Password" type="password" required maxLength={100} />
        </div>
        <AppButton type="submit">Create Account</AppButton>
      </form>
    </div>
  );
}

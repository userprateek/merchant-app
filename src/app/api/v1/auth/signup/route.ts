import { createViewerSignupAccount, loginForApi } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";
    if (!name || !email || !password) {
      return ok({ error: "INVALID_INPUT" }, 400);
    }

    await createViewerSignupAccount({ name, email, password });
    const session = await loginForApi(email, password);

    return ok({
      token: session.token,
      expiresAt: session.expiresAt,
      user: session.user,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

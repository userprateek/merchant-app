import { loginForApi } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";
    if (!email || !password) {
      return ok({ error: "INVALID_INPUT" }, 400);
    }

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

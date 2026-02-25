import { createUserByAdmin } from "@/lib/auth";
import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request, [UserRole.ADMIN]);
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    return ok({ users });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiUser(request, [UserRole.ADMIN]);
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";
    const role = body.role && body.role in UserRole ? body.role : UserRole.VIEWER;

    if (!name || !email || !password) {
      return ok({ error: "INVALID_INPUT" }, 400);
    }

    const user = await createUserByAdmin({ name, email, password, role });
    return ok(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

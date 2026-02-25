import { updateUserRoleByAdmin } from "@/lib/auth";
import { requireApiUser } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiUser(request, [UserRole.ADMIN]);
    const { id } = await context.params;
    const body = (await request.json()) as {
      role?: UserRole;
      isActive?: boolean;
    };

    if (body.role && body.role in UserRole) {
      await updateUserRoleByAdmin(id, body.role);
    }

    if (typeof body.isActive === "boolean") {
      await prisma.user.update({
        where: { id },
        data: { isActive: body.isActive },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    if (!user) return ok({ error: "USER_NOT_FOUND" }, 404);
    return ok({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

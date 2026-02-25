import {
  createUserByAdmin,
  requireRole,
  updateUserRoleByAdmin,
} from "@/lib/auth";
import { getRequiredString } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import ConfirmButton from "@/components/ConfirmButton";
import FloatingSelect from "@/components/FloatingSelect";
import FloatingInput from "@/components/FloatingInput";
import AppButton from "@/components/AppButton";
import DataTable, { DataTableColumn } from "@/components/DataTable";

export default async function AdminUsersPage() {
  await requireRole([UserRole.ADMIN]);

  async function createUserAction(formData: FormData) {
    "use server";
    await requireRole([UserRole.ADMIN]);

    const name = getRequiredString(formData, "name");
    const email = getRequiredString(formData, "email");
    const password = getRequiredString(formData, "password");
    const roleRaw = getRequiredString(formData, "role");
    const role = roleRaw in UserRole ? (roleRaw as UserRole) : UserRole.VIEWER;

    await createUserByAdmin({ name, email, password, role });
    revalidatePath("/admin/users");
  }

  async function toggleActiveAction(formData: FormData) {
    "use server";
    await requireRole([UserRole.ADMIN]);

    const id = getRequiredString(formData, "id");
    const isActive = getRequiredString(formData, "isActive") === "true";
    await prisma.user.update({
      where: { id },
      data: { isActive: !isActive },
    });
    revalidatePath("/admin/users");
  }

  async function updateRoleAction(formData: FormData) {
    "use server";
    await requireRole([UserRole.ADMIN]);

    const id = getRequiredString(formData, "id");
    const roleRaw = getRequiredString(formData, "role");
    const role = roleRaw in UserRole ? (roleRaw as UserRole) : UserRole.VIEWER;

    await updateUserRoleByAdmin(id, role);
    revalidatePath("/admin/users");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
  const columns: DataTableColumn<(typeof users)[number]>[] = [
    { field: "name", header: "Name" },
    { field: "email", header: "Email" },
    { field: "role", header: "Role" },
    {
      field: "isActive",
      header: "Status",
      render: (user) => (user.isActive ? "ACTIVE" : "INACTIVE"),
    },
    {
      field: "roleAssignment",
      header: "Role Assignment",
      render: (user) => (
        <form
          id={`update-role-${user.id}`}
          action={updateRoleAction}
          className="row-inline no-wrap"
        >
          <input type="hidden" name="id" value={user.id} />
          <FloatingSelect
            name="role"
            label="Role"
            options={["ADMIN", "MANAGER", "PACKING_CREW", "VIEWER"]}
            defaultValue={user.role}
            maxMenuHeight={170}
            className="min-w-180"
          />
          <ConfirmButton
            formId={`update-role-${user.id}`}
            message={`Update role for ${user.email}?`}
          >
            Update Role
          </ConfirmButton>
        </form>
      ),
    },
    {
      field: "actions",
      header: "Actions",
      render: (user) => (
        <form id={`toggle-active-${user.id}`} action={toggleActiveAction}>
          <input type="hidden" name="id" value={user.id} />
          <input
            type="hidden"
            name="isActive"
            value={user.isActive ? "true" : "false"}
          />
          <ConfirmButton
            formId={`toggle-active-${user.id}`}
            message={`${user.isActive ? "Disable" : "Enable"} ${user.email}?`}
          >
            {user.isActive ? "Disable" : "Enable"}
          </ConfirmButton>
        </form>
      ),
    },
  ];

  return (
    <div className="app-shell">
      <div className="page-header">
        <h1 className="page-title">User & Role Management</h1>
      </div>

      <section className="section-card">
        <h2 className="section-title">Create User</h2>
        <form action={createUserAction} className="form-shell">
          <div className="form-grid">
            <FloatingInput name="name" label="Name" required />
            <FloatingInput name="email" label="Email" type="email" required />
            <FloatingInput
              name="password"
              label="Password"
              type="password"
              required
            />
            <FloatingSelect
              name="role"
              label="Role"
              options={["ADMIN", "MANAGER", "PACKING_CREW", "VIEWER"]}
              defaultValue="VIEWER"
              maxMenuHeight={170}
            />
            <div>
              <AppButton type="submit">Create</AppButton>
            </div>
          </div>
        </form>
      </section>

      <section className="section-card">
        <h2 className="section-title">Existing Users</h2>
        <DataTable columns={columns} rows={users} rowKey="id" />
      </section>
    </div>
  );
}

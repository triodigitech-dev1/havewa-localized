"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, assignableRoles, canDeleteUser } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { userCreateSchema, type ActionState } from "@/lib/schemas";

const MANAGE_ROLES = ["VERWALTER"] as const; // ADMIN included via roleAllows

export async function createUser(_p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await requireRole([...MANAGE_ROLES]);
  const r = userCreateSchema.safeParse(Object.fromEntries(fd));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Invalid input" };
  const { name, email, password, role, personId } = r.data;

  // Role must be assignable by the actor
  if (!assignableRoles(actor.role).includes(role)) {
    return { error: "Insufficient permissions for this role." };
  }

  // Globally unique email check
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { error: "An account with this email address already exists." };

  // Associated person must belong to the tenant
  if (personId) {
    const person = await prisma.person.findFirst({
      where: { id: personId, tenantId: actor.tenantId },
      select: { id: true },
    });
    if (!person) return { error: "Person not found." };
  }

  const created = await prisma.user.create({
    data: {
      tenantId: actor.tenantId,
      name,
      email,
      role,
      personId: personId ?? null,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
  await audit(actor, "CREATE", "User", created.id, `${name} (${role})`);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function resetPassword(_p: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await requireRole([...MANAGE_ROLES]);
  const id = String(fd.get("id") ?? "");
  const password = String(fd.get("password") ?? "");
  if (password.length < 6) return { error: "Password is too short (minimum 6 characters)." };

  const target = await prisma.user.findFirst({
    where: { id, tenantId: actor.tenantId },
    select: { id: true, role: true, name: true },
  });
  if (!target) return { error: "User not found." };
  // Can only reset own password or roles manageable by actor
  if (target.id !== actor.id && !assignableRoles(actor.role).includes(target.role)) {
    return { error: "Permission denied." };
  }
  await prisma.user.update({ where: { id: target.id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
  await audit(actor, "UPDATE", "User", target.id, `Password reset: ${target.name}`);
  return { ok: true };
}

export async function deleteUser(fd: FormData): Promise<void> {
  const actor = await requireRole([...MANAGE_ROLES]);
  const id = String(fd.get("id") ?? "");
  const target = await prisma.user.findFirst({
    where: { id, tenantId: actor.tenantId },
    select: { id: true, role: true, name: true },
  });
  if (!target) return;
  if (!canDeleteUser(actor, target.role, target.id)) return;

  await prisma.user.delete({ where: { id: target.id } });
  await audit(actor, "DELETE", "User", target.id, target.name);
  revalidatePath("/", "layout");
}

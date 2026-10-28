"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensureDefaultAccounts } from "@/lib/accounts";
import { setupSchema, type ActionState } from "@/lib/schemas";
import { requireUser } from "@/lib/rbac";

// System setup: creates the primary organization, subdomain, and administrator account.
export async function setupSystem(_p: ActionState, fd: FormData): Promise<ActionState> {
  const r = setupSchema.safeParse(Object.fromEntries(fd));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Invalid input" };
  const {
    tenantName,
    subdomain,
    customDomain,
    isDemo,
    name,
    email,
    password,
    locale,
    brandColor,
    propertyName,
    propertyStreet,
    propertyZip,
    propertyCity,
  } = r.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { error: "An account with this email already exists. Please log in instead." };

  // Generate safe subdomain if omitted
  const cleanSubdomain =
    subdomain ||
    tenantName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 16) ||
    "main";

  const tenant = await prisma.tenant.create({
    data: {
      name: tenantName,
      subdomain: cleanSubdomain,
      customDomain: customDomain || null,
      brandColor: brandColor || "#0F5132",
      isDemo: isDemo || false,
      users: {
        create: {
          email,
          name,
          passwordHash: await bcrypt.hash(password, 10),
          role: "ADMIN",
          locale,
        },
      },
    },
  });

  // Default Chart of Accounts
  await ensureDefaultAccounts(prisma, tenant.id);

  // Optional first property
  if (propertyName) {
    await prisma.property.create({
      data: {
        tenantId: tenant.id,
        name: propertyName,
        street: propertyStreet || "Argwings Kodhek Rd",
        zip: propertyZip || "00100",
        city: propertyCity || "Nairobi",
      },
    });
  }

  redirect(`/login?registered=1&email=${encodeURIComponent(email)}`);
}

// Instant Guided Demo mode setup
export async function launchDemoSystem(): Promise<ActionState> {
  const demoEmail = "admin@localea.app";
  const demoPassword = "admin";

  // Check if demo tenant already exists
  let tenant = await prisma.tenant.findFirst({
    where: { subdomain: "demo" },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: "Localea Guided Demo",
        subdomain: "demo",
        brandColor: "#0F5132",
        isDemo: true,
      },
    });
  } else {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { isDemo: true },
    });
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: demoEmail, mode: "insensitive" } },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        email: demoEmail,
        name: "Demo Administrator",
        passwordHash: await bcrypt.hash(demoPassword, 10),
        role: "ADMIN",
        tenantId: tenant.id,
        locale: "en",
      },
    });
  }

  // Ensure default accounts and sample demo property if none exist
  await ensureDefaultAccounts(prisma, tenant.id);
  const propCount = await prisma.property.count({ where: { tenantId: tenant.id } });
  if (propCount === 0) {
    const prop = await prisma.property.create({
      data: {
        tenantId: tenant.id,
        name: "Kilimani Heights",
        street: "Argwings Kodhek Rd",
        zip: "00100",
        city: "Nairobi",
        type: "WOHNEN",
        management: "MIET",
      },
    });
    const bld = await prisma.building.create({
      data: {
        tenantId: tenant.id,
        propertyId: prop.id,
        name: "Tower A",
      },
    });
    await prisma.unit.create({
      data: {
        tenantId: tenant.id,
        buildingId: bld.id,
        label: "Apt 4B (2 Bedroom)",
        type: "WOHNUNG",
        area: 120,
        rooms: 3,
      },
    });
  }

  redirect(`/login?email=${encodeURIComponent(demoEmail)}&registered=1`);
}

// Toggle Demo Guide Mode on/off for current tenant
export async function toggleDemoMode(): Promise<ActionState> {
  const user = await requireUser();
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { id: true, isDemo: true },
  });
  if (!tenant) return { error: "Tenant not found" };

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { isDemo: !tenant.isDemo },
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { ok: true };
}

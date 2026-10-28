"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWriter } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { sendMail, isMailerConfigured, type MailAttachment } from "@/lib/adapters/mailer";
import { readFile } from "@/lib/storage";
import { emailSchema, type ActionState } from "@/lib/schemas";
import { renderTemplate } from "@/lib/template";

const addrList = (s: string | undefined | null) =>
  (s ?? "").split(/[,;]/).map((a) => a.trim()).filter(Boolean);

export async function createEmail(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireWriter();
  const r = emailSchema.safeParse(Object.fromEntries(fd));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Invalid input" };

  // Check attached documents belong to tenant
  const docIds = fd.getAll("documentIds").map(String).filter(Boolean);
  if (docIds.length) {
    const count = await prisma.document.count({ where: { id: { in: docIds }, tenantId: user.tenantId } });
    if (count !== docIds.length) return { error: "Document not found" };
  }

  const msg = await prisma.emailMessage.create({
    data: {
      ...r.data,
      tenantId: user.tenantId,
      status: "ENTWURF",
      attachments: { create: docIds.map((documentId) => ({ documentId })) },
    },
  });
  await audit(user, "CREATE", "EmailMessage", msg.id, r.data.subject);
  revalidatePath("/", "layout");
  return { ok: true };
}

async function smtpConfig(tenantId: string) {
  const t = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      smtpHost: true, smtpPort: true, smtpUser: true,
      smtpPassword: true, smtpFrom: true, smtpSecure: true,
    },
  });
  return {
    host: t?.smtpHost, port: t?.smtpPort, user: t?.smtpUser,
    password: t?.smtpPassword, from: t?.smtpFrom, secure: t?.smtpSecure,
  };
}

export async function sendEmail(fd: FormData): Promise<void> {
  const user = await requireWriter();
  const id = String(fd.get("id") ?? "");
  const msg = await prisma.emailMessage.findFirst({
    where: { id, tenantId: user.tenantId },
    include: { attachments: { include: { document: true } } },
  });
  if (!msg) return;

  const cfg = await smtpConfig(user.tenantId);
  try {
    // Load attachments from storage
    const attachments: MailAttachment[] = [];
    for (const a of msg.attachments) {
      try {
        attachments.push({ filename: a.document.name, content: await readFile(a.document.storageKey) });
      } catch {
        // Skip missing files gracefully
      }
    }
    await sendMail(
      {
        to: addrList(msg.toAddress),
        cc: addrList(msg.cc),
        bcc: addrList(msg.bcc),
        subject: msg.subject,
        body: msg.body,
        attachments,
      },
      cfg,
    );
    await prisma.emailMessage.update({
      where: { id: msg.id },
      data: { status: "GESENDET", sentAt: new Date(), error: null },
    });
    await audit(
      user,
      "UPDATE",
      "EmailMessage",
      msg.id,
      isMailerConfigured(cfg) ? "sent" : "queued in outbox (no SMTP configured)",
    );
  } catch (e) {
    await prisma.emailMessage.update({
      where: { id: msg.id },
      data: { status: "FEHLER", error: e instanceof Error ? e.message : "Email sending failed" },
    });
  }
  revalidatePath("/", "layout");
}

/** Bulk email: Draft for each tenant or owner of a property. */
export async function bulkEmail(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireWriter();
  const propertyId = String(fd.get("propertyId") ?? "");
  const audience = String(fd.get("audience") ?? "");
  const subject = String(fd.get("subject") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  if (!propertyId || !subject || !body) return { error: "Property, subject, and message are required." };

  const prop = await prisma.property.findFirst({
    where: { id: propertyId, tenantId: user.tenantId },
    select: { name: true },
  });
  const propertyName = prop?.name ?? "";
  const dateStr = new Date().toLocaleDateString("en-US");

  // Collect recipients with context (deduplicated by email)
  const recips = new Map<string, { name: string; nameKey: string }>();
  if (audience === "EIGENTUEMER") {
    const owners = await prisma.owner.findMany({
      where: { tenantId: user.tenantId, unit: { building: { propertyId } } },
      include: { person: { select: { email: true, firstName: true, lastName: true } } },
    });
    owners.forEach((o) => {
      if (o.person.email)
        recips.set(o.person.email, {
          name: `${o.person.firstName} ${o.person.lastName}`,
          nameKey: "owner.name",
        });
    });
  } else {
    const renters = await prisma.renter.findMany({
      where: { tenantId: user.tenantId, lease: { unit: { building: { propertyId } } } },
      include: { person: { select: { email: true, firstName: true, lastName: true } } },
    });
    renters.forEach((r) => {
      if (r.person.email)
        recips.set(r.person.email, {
          name: `${r.person.firstName} ${r.person.lastName}`,
          nameKey: "tenant.name",
        });
    });
  }
  if (recips.size === 0) return { error: "No recipients with email addresses found." };

  // Fill placeholders for each recipient
  const rows = [...recips.entries()].map(([to, ctx]) => {
    const context: Record<string, string> = {
      "property.name": propertyName,
      "objekt.name": propertyName,
      date: dateStr,
      datum: dateStr,
      [ctx.nameKey]: ctx.name,
      "tenant.name": ctx.name,
      "owner.name": ctx.name,
      "mieter.name": ctx.name,
      "eigentuemer.name": ctx.name,
    };
    return {
      tenantId: user.tenantId,
      toAddress: to,
      subject: renderTemplate(subject, context),
      body: renderTemplate(body, context),
      status: "ENTWURF" as const,
    };
  });

  await prisma.emailMessage.createMany({ data: rows });
  await audit(user, "CREATE", "EmailMessage", null, `Bulk email (${rows.length})`);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteEmail(fd: FormData): Promise<void> {
  const user = await requireWriter();
  const id = String(fd.get("id") ?? "");
  const res = await prisma.emailMessage.deleteMany({ where: { id, tenantId: user.tenantId } });
  if (res.count > 0) await audit(user, "DELETE", "EmailMessage", id);
  revalidatePath("/", "layout");
}

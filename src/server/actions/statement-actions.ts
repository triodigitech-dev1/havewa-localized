"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWriter } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { money } from "@/lib/format";
import { simplePdf } from "@/lib/pdf";
import { saveFile } from "@/lib/storage";
import { computeStatement } from "@/server/statements";
import type { ActionState } from "@/lib/schemas";

function parse(fd: FormData) {
  return { propertyId: String(fd.get("propertyId") ?? ""), year: Number(fd.get("year")) || new Date().getFullYear() };
}

/** Posts additional payments due (balance < 0) per unit as charges. */
export async function bookStatementCharges(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireWriter();
  const { propertyId, year } = parse(fd);
  if (!propertyId) return { error: "Property is required" };

  const st = await computeStatement(user.tenantId, propertyId, year);
  const desc = `Operating cost reconciliation ${year}`;
  const dueDate = new Date(Date.now() + 30 * 864e5);
  let created = 0;

  for (const u of st.units) {
    if (!u.leaseId || u.balance >= 0) continue; // Only balances due
    // Deduplication check: do not double post
    const exists = await prisma.charge.findFirst({
      where: { tenantId: user.tenantId, leaseId: u.leaseId, description: desc },
      select: { id: true },
    });
    if (exists) continue;
    await prisma.charge.create({
      data: {
        tenantId: user.tenantId,
        leaseId: u.leaseId,
        type: "NEBENKOSTEN",
        period: new Date(Date.UTC(year, 11, 1)),
        dueDate,
        amount: Math.abs(u.balance),
        description: desc,
      },
    });
    created++;
  }
  if (created > 0) await audit(user, "CREATE", "Charge", null, `${created}× ${desc}`);
  revalidatePath("/", "layout");
  return created > 0 ? { ok: true } : { error: "No outstanding utility reconciliation balances to post." };
}

/** Generates draft emails in outbox with attached PDF statement for each resident. */
export async function emailStatementToTenants(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireWriter();
  const { propertyId, year } = parse(fd);
  if (!propertyId) return { error: "Property is required" };

  const st = await computeStatement(user.tenantId, propertyId, year);
  const propName = st.property?.name ?? "";
  let created = 0;

  for (const u of st.units) {
    if (u.renterEmails.length === 0) continue;
    const kind = u.balance >= 0 ? "Credit balance" : "Additional payment due";
    const body =
      `Dear Resident,\n\n` +
      `Please find attached the operating cost statement for ${year} (${propName}, Unit ${u.label}).\n\n` +
      `Allocated expenses: ${money(u.allocated)}\n` +
      `Prepayments received: ${money(u.prepayment)}\n` +
      `Result: ${money(Math.abs(u.balance))} (${kind})\n\n` +
      `Best regards,\n${st.property?.tenantName ?? ""}`;

    // Generate PDF, persist in storage, and archive as document (ABRECHNUNG category)
    const pdf = simplePdf(`Operating Cost Statement ${year}`, [
      `${propName} - ${u.label}`,
      "",
      `Allocated expenses: ${money(u.allocated)}`,
      `Prepayments received: ${money(u.prepayment)}`,
      `Result: ${money(Math.abs(u.balance))} (${kind})`,
      "",
      "Heating and utility charges allocated according to statutory rules (area share & metered consumption).",
    ]);
    const name = `Statement ${year} - ${u.label}.pdf`;
    const storageKey = await saveFile(pdf, name);
    const doc = await prisma.document.create({
      data: {
        tenantId: user.tenantId,
        propertyId,
        name,
        category: "ABRECHNUNG",
        mime: "application/pdf",
        size: pdf.length,
        storageKey,
      },
    });

    await prisma.emailMessage.create({
      data: {
        tenantId: user.tenantId,
        toAddress: u.renterEmails.join(", "),
        subject: `Operating Cost Statement ${year} · ${u.label}`,
        body,
        status: "ENTWURF",
        attachments: { create: [{ documentId: doc.id }] },
      },
    });
    created++;
  }
  if (created > 0) await audit(user, "CREATE", "EmailMessage", null, `${created}× Statement ${year} (PDF)`);
  revalidatePath("/", "layout");
  return created > 0 ? { ok: true } : { error: "No residents with valid email addresses found." };
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWriter } from "@/lib/rbac";
import {
  accountSchema,
  chargeSchema,
  paymentSchema,
  mandateSchema,
  generateSchema,
  type ActionState,
} from "@/lib/schemas";
import { parseCamt053 } from "@/lib/adapters/bankImport";
import { ensureDefaultAccounts } from "@/lib/accounts";
import { generateAreaCharges } from "@/lib/api-ops";
import { audit } from "@/lib/audit";
import { simplePdf } from "@/lib/pdf";
import { saveFile } from "@/lib/storage";
import { money, date } from "@/lib/format";

// Create default chart of accounts for the tenant (idempotent)
export async function seedDefaultAccounts(): Promise<void> {
  const user = await requireWriter();
  await ensureDefaultAccounts(prisma, user.tenantId);
  revalidatePath("/", "layout");
}

function fail(msg?: string): ActionState {
  return { error: msg ?? "Invalid input" };
}
function done(): ActionState {
  revalidatePath("/", "layout");
  return { ok: true };
}

// --- Account ---
export async function createAccount(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireWriter();
  const r = accountSchema.safeParse(Object.fromEntries(fd));
  if (!r.success) return fail(r.error.issues[0]?.message);
  await prisma.account.create({ data: { ...r.data, tenantId: user.tenantId } });
  return done();
}
export async function deleteAccount(fd: FormData): Promise<void> {
  const user = await requireWriter();
  await prisma.account.deleteMany({ where: { id: String(fd.get("id") ?? ""), tenantId: user.tenantId } });
  revalidatePath("/", "layout");
}

// --- Charge (manual) ---
export async function createCharge(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireWriter();
  const r = chargeSchema.safeParse(Object.fromEntries(fd));
  if (!r.success) return fail(r.error.issues[0]?.message);
  await prisma.charge.create({ data: { ...r.data, tenantId: user.tenantId } });
  return done();
}
export async function deleteCharge(fd: FormData): Promise<void> {
  const user = await requireWriter();
  await prisma.charge.deleteMany({ where: { id: String(fd.get("id") ?? ""), tenantId: user.tenantId } });
  revalidatePath("/", "layout");
}

// --- Monthly rent charge generation for active contracts ---
export async function generateCharges(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireWriter();
  const r = generateSchema.safeParse(Object.fromEntries(fd));
  if (!r.success) return fail(r.error.issues[0]?.message);
  const [y, m] = r.data.month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const last = new Date(Date.UTC(y, m, 0));
  const due = new Date(Date.UTC(y, m - 1, 3));

  const leases = await prisma.lease.findMany({
    where: {
      tenantId: user.tenantId,
      startDate: { lte: last },
      OR: [{ endDate: null }, { endDate: { gte: first } }],
    },
    include: { components: { select: { amount: true } }, charges: { where: { period: first, type: "MIETE" }, select: { id: true } } },
  });

  let created = 0;
  for (const l of leases) {
    if (l.charges.length > 0) continue; // Already generated
    const warm = Number(l.rentCold) + l.components.reduce((a, c) => a + Number(c.amount), 0);
    await prisma.charge.create({
      data: {
        tenantId: user.tenantId,
        leaseId: l.id,
        type: "MIETE",
        period: first,
        dueDate: due,
        amount: warm,
      },
    });
    created++;
  }
  created += await generateAreaCharges(user.tenantId, first, due, last);
  revalidatePath("/", "layout");
  return { ok: true, error: created === 0 ? "No new charges to generate (already up to date)" : undefined };
}

// --- Payment ---
export async function createPayment(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireWriter();
  const r = paymentSchema.safeParse(Object.fromEntries(fd));
  if (!r.success) return fail(r.error.issues[0]?.message);
  // Verify charge belongs to tenant
  if (r.data.chargeId) {
    const c = await prisma.charge.findFirst({ where: { id: r.data.chargeId, tenantId: user.tenantId }, select: { id: true } });
    if (!c) return fail("Charge not found");
  }
  await prisma.payment.create({ data: { ...r.data, tenantId: user.tenantId } });
  return done();
}
export async function deletePayment(fd: FormData): Promise<void> {
  const user = await requireWriter();
  await prisma.payment.deleteMany({ where: { id: String(fd.get("id") ?? ""), tenantId: user.tenantId } });
  revalidatePath("/", "layout");
}

// --- SEPA Mandate ---
export async function createMandate(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireWriter();
  const r = mandateSchema.safeParse(Object.fromEntries(fd));
  if (!r.success) return fail(r.error.issues[0]?.message);
  const p = await prisma.person.findFirst({ where: { id: r.data.personId, tenantId: user.tenantId }, select: { id: true } });
  if (!p) return fail("Person not found");
  await prisma.sepaMandate.create({ data: { ...r.data, tenantId: user.tenantId } });
  return done();
}
export async function deleteMandate(fd: FormData): Promise<void> {
  const user = await requireWriter();
  await prisma.sepaMandate.deleteMany({ where: { id: String(fd.get("id") ?? ""), tenantId: user.tenantId } });
  revalidatePath("/", "layout");
}

// --- camt.053 Bank import with auto-matching ---
export async function importCamt053(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireWriter();
  const accountId = String(fd.get("accountId") ?? "");
  const file = fd.get("file");
  if (!accountId) return fail("Bank account is required");
  if (!(file instanceof File) || file.size === 0) return fail("No file selected");

  const xml = await file.text();
  const entries = parseCamt053(xml);

  // Outstanding amounts for auto-matching
  const openCharges = await prisma.charge.findMany({
    where: { tenantId: user.tenantId },
    include: { payments: { select: { amount: true } } },
  });
  const openMap = openCharges.map((c) => ({
    id: c.id,
    open: Number(c.amount) - c.payments.reduce((a, p) => a + Number(p.amount), 0),
  }));

  let matched = 0;
  for (const e of entries) {
    let chargeId: string | null = null;
    if (e.direction === "EINGANG") {
      const hit = openMap.find((c) => c.open > 0 && Math.abs(c.open - e.amount) < 0.01);
      if (hit) {
        chargeId = hit.id;
        hit.open = 0;
        matched++;
      }
    }
    await prisma.payment.create({
      data: {
        tenantId: user.tenantId,
        accountId,
        chargeId,
        date: new Date(e.date),
        amount: e.amount,
        direction: e.direction,
        reference: e.reference,
      },
    });
  }
  revalidatePath("/", "layout");
  return { ok: true, error: `${entries.length} transactions, ${matched} matched` };
}

export const importCamt = importCamt053;

// --- Dunning notice: advance overdue charge ---
const DUNNING_FEE: Record<number, number> = { 1: 0, 2: 5, 3: 10 };
export async function createDunning(fd: FormData): Promise<void> {
  const user = await requireWriter();
  const chargeId = String(fd.get("chargeId") ?? "");
  const charge = await prisma.charge.findFirst({
    where: { id: chargeId, tenantId: user.tenantId },
    include: { dunnings: { select: { level: true } } },
  });
  if (charge) {
    const level = Math.min(charge.dunnings.length + 1, 3);
    await prisma.dunningNotice.create({
      data: { tenantId: user.tenantId, chargeId, level, fee: DUNNING_FEE[level] ?? 0 },
    });
  }
  revalidatePath("/", "layout");
}

// --- Dunning notice as PDF email draft to resident + archive ---
export async function emailDunning(fd: FormData): Promise<void> {
  const user = await requireWriter();
  const chargeId = String(fd.get("chargeId") ?? "");
  const charge = await prisma.charge.findFirst({
    where: { id: chargeId, tenantId: user.tenantId },
    include: {
      payments: { select: { amount: true } },
      dunnings: { orderBy: { level: "desc" }, take: 1 },
      lease: {
        include: {
          unit: { include: { building: { include: { property: { include: { tenant: true } } } } } },
          renters: { include: { person: true } },
        },
      },
    },
  });
  if (!charge || !charge.lease) return;

  const paid = charge.payments.reduce((a, p) => a + Number(p.amount), 0);
  const open = Number(charge.amount) - paid;
  const dun = charge.dunnings[0];
  const fee = dun ? Number(dun.fee) : 0;
  const total = open + fee;
  const level = dun?.level ?? 1;
  const property = charge.lease.unit.building.property;
  const renter = charge.lease.renters[0]?.person;
  if (!renter?.email) return;

  const title = level >= 2 ? `Payment Reminder (Stage ${level})` : "Payment Reminder";
  const pdf = simplePdf(title, [
    `${property.name} - ${charge.lease.unit.label}`,
    `Resident: ${renter.firstName} ${renter.lastName}`,
    "",
    `Outstanding balance (due ${date(charge.dueDate)}): ${money(open)}`,
    fee > 0 ? `Late fee: ${money(fee)}` : "",
    `Total balance due: ${money(total)}`,
    "",
    "Please settle this payment within 14 business days.",
  ].filter(Boolean));
  const name = `${title} - ${charge.lease.unit.label}.pdf`;
  const storageKey = await saveFile(pdf, name);
  const doc = await prisma.document.create({
    data: {
      tenantId: user.tenantId,
      propertyId: property.id,
      name,
      category: "SONSTIGES",
      mime: "application/pdf",
      size: pdf.length,
      storageKey,
    },
  });
  await prisma.emailMessage.create({
    data: {
      tenantId: user.tenantId,
      toAddress: renter.email,
      subject: `${title} · ${property.name}`,
      body: `Dear ${renter.firstName} ${renter.lastName},\n\nPlease find attached the ${title.toLowerCase()} for ${money(total)}.\n\nBest regards,\n${property.tenant.name}`,
      status: "ENTWURF",
      attachments: { create: [{ documentId: doc.id }] },
    },
  });
  await audit(user, "CREATE", "EmailMessage", null, `${title} ${charge.lease.unit.label}`);
  revalidatePath("/", "layout");
}

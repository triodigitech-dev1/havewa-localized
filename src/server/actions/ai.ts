"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { isAiConfigured, askAssistant } from "@/lib/ai";
import { computeStatement } from "@/server/statements";
import { money } from "@/lib/format";

export type AssistantState = { answer?: string; configured?: boolean; error?: string };

/** Builds a compact portfolio context (metrics only, no PII) for the assistant. */
async function buildContext(tenantId: string) {
  const now = new Date();
  const [properties, units, leases, charges, openTickets, dueMaintenance] = await Promise.all([
    prisma.property.findMany({ where: { tenantId }, select: { name: true, city: true, management: true } }),
    prisma.unit.findMany({ where: { tenantId }, select: { leases: { select: { startDate: true, endDate: true } } } }),
    prisma.lease.findMany({
      where: { tenantId, startDate: { lte: now }, OR: [{ endDate: null }, { endDate: { gte: now } }] },
      include: { components: { select: { amount: true } } },
    }),
    prisma.charge.findMany({ where: { tenantId }, include: { payments: { select: { amount: true } } } }),
    prisma.ticket.count({ where: { tenantId, status: { not: "ERLEDIGT" } } }),
    prisma.maintenanceContract.count({ where: { tenantId, nextDue: { lt: now } } }),
  ]);

  const occupied = units.filter((u) =>
    u.leases.some((l) => l.startDate <= now && (!l.endDate || l.endDate >= now)),
  ).length;
  const monthlyRent = leases.reduce(
    (a, l) => a + Number(l.rentCold) + l.components.reduce((s, c) => s + Number(c.amount), 0),
    0,
  );
  let totalOpen = 0;
  let overdue = 0;
  for (const c of charges) {
    const open = Number(c.amount) - c.payments.reduce((a, p) => a + Number(p.amount), 0);
    if (open > 0.001) {
      totalOpen += open;
      if (c.dueDate < now) overdue++;
    }
  }

  return {
    objekte: properties.length,
    einheiten: units.length,
    vermietet: occupied,
    leerstand: units.length - occupied,
    sollmieteMonatlich: Math.round(monthlyRent * 100) / 100,
    offenePostenSumme: Math.round(totalOpen * 100) / 100,
    ueberfaelligeForderungen: overdue,
    offeneTickets: openTickets,
    faelligeWartungen: dueMaintenance,
    objektliste: properties.map((p) => `${p.name} (${p.city}, ${p.management})`),
  };
}

export async function askAssistantAction(_prev: AssistantState, fd: FormData): Promise<AssistantState> {
  const user = await requireUser();
  const question = String(fd.get("question") ?? "").trim();
  if (!question) return { error: "Please enter a question." };

  const ctx = await buildContext(user.tenantId);
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { aiProvider: true, aiBaseUrl: true, aiApiKey: true, aiModel: true },
  });
  const aiCfg = { provider: tenant?.aiProvider, baseUrl: tenant?.aiBaseUrl, apiKey: tenant?.aiApiKey, model: tenant?.aiModel };
  const configured = isAiConfigured(aiCfg);

  if (!configured) {
    // Analytics summary fallback without external LLM
    const answer =
      `Portfolio summary based on live metrics:\n` +
      `• ${ctx.objekte} properties, ${ctx.einheiten} units (${ctx.vermietet} occupied, ${ctx.leerstand} vacant)\n` +
      `• Target monthly rent: ${money(ctx.sollmieteMonatlich)}\n` +
      `• Outstanding balance: ${money(ctx.offenePostenSumme)} (${ctx.ueberfaelligeForderungen} overdue)\n` +
      `• ${ctx.offeneTickets} open maintenance tickets, ${ctx.faelligeWartungen} scheduled maintenance items due`;
    return { answer, configured: false };
  }

  try {
    const answer = await askAssistant(JSON.stringify(ctx), question, aiCfg);
    return { answer, configured: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "AI request failed", configured: true };
  }
}

/** Explains operating cost statement for a property/year in plain language. */
export async function explainStatement(_p: AssistantState, fd: FormData): Promise<AssistantState> {
  const user = await requireUser();
  const propertyId = String(fd.get("propertyId") ?? "");
  const year = Number(fd.get("year")) || new Date().getFullYear();
  if (!propertyId) return { error: "Property is required" };

  const st = await computeStatement(user.tenantId, propertyId, year);
  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId }, select: { aiProvider: true, aiBaseUrl: true, aiApiKey: true, aiModel: true } });
  const aiCfg = { provider: tenant?.aiProvider, baseUrl: tenant?.aiBaseUrl, apiKey: tenant?.aiApiKey, model: tenant?.aiModel };

  const ctx = {
    property: st.property?.name,
    year,
    totalAllocated: st.totalUmlage,
    costs: st.costs.map((c) => ({ type: c.type, amount: c.amount, method: c.method, allocatable: c.umlagefaehig })),
    units: st.units.map((u) => ({ unit: u.label, allocated: u.allocated, prepayment: u.prepayment, balance: u.balance })),
  };

  if (!isAiConfigured(aiCfg)) {
    const answer =
      `Summary of Operating Cost Statement for ${year}:\n` +
      `• Property: ${ctx.property}\n` +
      `• Total allocatable costs: ${money(st.totalUmlage)}\n` +
      st.units.map((u) => `• Unit ${u.label}: allocated ${money(u.allocated)}, prepayments ${money(u.prepayment)}, balance ${money(u.balance)} ${u.balance >= 0 ? "(Credit balance)" : "(Additional payment due)"}`).join("\n");
    return { answer, configured: false };
  }
  try {
    const answer = await askAssistant(
      JSON.stringify(ctx),
      "Explain this operating cost statement to a resident in clear, friendly, and professional language: what costs were allocated according to which allocation keys, and how each unit's net balance was determined. Keep it structured and easy to understand.",
      aiCfg,
    );
    return { answer, configured: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "AI request failed", configured: true };
  }
}

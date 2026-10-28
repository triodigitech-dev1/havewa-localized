import { TicketCategory, TicketPriority } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { notifyManagers } from "@/lib/notify";

interface OfflineItem {
  id: string;
  actionType: string;
  payload: Record<string, unknown>;
  description?: string;
}

const VALID_CATEGORIES = new Set(Object.values(TicketCategory));
const VALID_PRIORITIES = new Set(Object.values(TicketPriority));

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const user = session.user;

  let body: { items: OfflineItem[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const items = Array.isArray(body?.items) ? body.items : [];
  const results: Array<{ id: string; success: boolean; error?: string }> = [];

  for (const item of items) {
    try {
      switch (item.actionType) {
        case "CREATE_TICKET": {
          const { title, description, category, priority, propertyId, unitId } = item.payload;
          if (!title) {
            results.push({ id: item.id, success: false, error: "Title is required" });
            continue;
          }
          const safeCategory = typeof category === "string" && VALID_CATEGORIES.has(category as TicketCategory)
            ? (category as TicketCategory)
            : TicketCategory.STOERUNG;
          const safePriority = typeof priority === "string" && VALID_PRIORITIES.has(priority as TicketPriority)
            ? (priority as TicketPriority)
            : TicketPriority.MITTEL;

          const ticket = await prisma.ticket.create({
            data: {
              tenantId,
              title: String(title).trim(),
              description: description ? String(description).trim() : null,
              category: safeCategory,
              priority: safePriority,
              status: "OFFEN",
              propertyId: propertyId ? String(propertyId) : null,
              unitId: unitId ? String(unitId) : null,
              reporterId: user.id,
            },
          });
          await audit(user, "CREATE", "Ticket", ticket.id, ticket.title);
          results.push({ id: item.id, success: true });
          break;
        }

        case "REPORT_ISSUE": {
          const { title, description } = item.payload;
          if (!title) {
            results.push({ id: item.id, success: false, error: "Title is required" });
            continue;
          }
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { personId: true, name: true },
          });

          let unitId: string | null = null;
          let propertyId: string | null = null;
          let unitLabel = "";

          if (dbUser?.personId) {
            const renter = await prisma.renter.findFirst({
              where: { tenantId, personId: dbUser.personId },
              include: { lease: { include: { unit: { include: { building: true } } } } },
              orderBy: { lease: { startDate: "desc" } },
            });
            if (renter?.lease) {
              unitId = renter.lease.unitId;
              propertyId = renter.lease.unit.building.propertyId;
              unitLabel = `${renter.lease.unit.building.name} · ${renter.lease.unit.label}`;
            }
          }

          const ticket = await prisma.ticket.create({
            data: {
              tenantId,
              title: String(title).trim(),
              description: description ? String(description).trim() : null,
              category: "STOERUNG",
              status: "OFFEN",
              priority: "MITTEL",
              reporterId: user.id,
              unitId,
              propertyId,
            },
          });

          await notifyManagers(tenantId, {
            title: `New maintenance report (offline synced): ${ticket.title}`,
            body: [unitLabel, user.name].filter(Boolean).join(" — "),
            link: "/tickets",
          });

          results.push({ id: item.id, success: true });
          break;
        }

        case "RECORD_READING": {
          const { meterId, value, date } = item.payload;
          if (!meterId || value === undefined) {
            results.push({ id: item.id, success: false, error: "Meter ID and value are required" });
            continue;
          }
          await prisma.meterReading.create({
            data: {
              tenantId,
              meterId: String(meterId),
              value: Number(value),
              date: date ? new Date(String(date)) : new Date(),
            },
          });
          results.push({ id: item.id, success: true });
          break;
        }

        case "CREATE_TASK": {
          const { title, dueDate } = item.payload;
          if (!title) {
            results.push({ id: item.id, success: false, error: "Task title is required" });
            continue;
          }
          await prisma.task.create({
            data: {
              tenantId,
              title: String(title).trim(),
              dueDate: dueDate ? new Date(String(dueDate)) : null,
              done: false,
            },
          });
          results.push({ id: item.id, success: true });
          break;
        }

        default:
          results.push({
            id: item.id,
            success: false,
            error: `Unsupported offline sync action: ${item.actionType}`,
          });
      }
    } catch (err) {
      results.push({
        id: item.id,
        success: false,
        error: err instanceof Error ? err.message : "Internal database error during sync",
      });
    }
  }

  return NextResponse.json({ results });
}

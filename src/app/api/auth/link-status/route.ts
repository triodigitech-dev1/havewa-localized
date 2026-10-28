import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cleanEmail = String(body?.email ?? "").trim().toLowerCase();
    if (!cleanEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    let user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        select: { id: true, email: true, name: true, role: true },
      });
    }

    if (!user) {
      return NextResponse.json({
        registered: false,
        eligibleForLink: false,
        email: cleanEmail,
        message: `No registered account found for ${cleanEmail}. Google sign-in is strictly a link/connection function for existing accounts.`,
      });
    }

    return NextResponse.json({
      registered: true,
      eligibleForLink: true,
      email: cleanEmail,
      name: user.name,
      role: user.role,
      message: `Account verified for ${cleanEmail} (${user.role}). Google social connection will successfully link to this account.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error checking link status";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

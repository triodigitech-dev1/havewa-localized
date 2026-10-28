import crypto from "node:crypto";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/** Generate token: raw secret (shown once), hash (stored in DB), prefix (displayed in UI). */
export function generateToken() {
  const raw = "loc_" + crypto.randomBytes(24).toString("base64url");
  return { raw, hash: hashToken(raw), prefix: raw.slice(0, 12) };
}

export type ApiPrincipal = { userId: string; tenantId: string; role: UserRole; name: string };
export type Principal = ApiPrincipal;

/** Authenticates an API request via Bearer token. Returns null if invalid or revoked. */
export async function authenticateBearer(req: Request): Promise<ApiPrincipal | null> {
  const header = req.headers.get("authorization") ?? "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const tok = await prisma.apiToken.findUnique({
    where: { tokenHash: hashToken(m[1].trim()) },
    include: { user: { select: { id: true, tenantId: true, role: true, name: true } } },
  });
  if (!tok || tok.revokedAt) return null;
  // Non-blocking best-effort update of lastUsedAt
  void prisma.apiToken.update({ where: { id: tok.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return { userId: tok.user.id, tenantId: tok.user.tenantId, role: tok.user.role, name: tok.user.name };
}

export function unauthorized(): Response {
  return Response.json({ error: "Unauthorized — Bearer token is missing or invalid" }, { status: 401 });
}

import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ensureDefaultAccounts } from "../src/lib/accounts";

// Einmaliger Bootstrap beim Container-/Server-Start (idempotent).
// Alle Env-Variablen optional:
//   SEED_DEMO=true        -> Demo-Datensatz einspielen (ADMIN_*/TENANT_NAME egal)
//   ADMIN_EMAIL + ADMIN_PASSWORD (+ ADMIN_NAME, TENANT_NAME)
//                         -> Mandant + Admin direkt anlegen, Wizard entfällt
//   nichts gesetzt        -> nichts tun, Wizard erscheint beim ersten Login
// Läuft nur, solange das System leer ist (keine Benutzer vorhanden).

const prisma = new PrismaClient();
const truthy = (v: string | undefined) => ["1", "true", "yes", "on"].includes(String(v ?? "").trim().toLowerCase());

async function main() {
  const users = await prisma.user.count();
  if (users > 0) {
    console.log("[bootstrap] System already configured — skipping initialization.");
    return;
  }

  if (truthy(process.env.SEED_DEMO)) {
    console.log("[bootstrap] SEED_DEMO enabled — loading demo dataset...");
    await prisma.$disconnect();
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
    return;
  }

  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const tenantName = process.env.TENANT_NAME?.trim() || "Localea";
    const adminName = process.env.ADMIN_NAME?.trim() || "Administrator";
    const tenant = await prisma.tenant.create({ data: { name: tenantName } });
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        name: adminName,
        passwordHash: await bcrypt.hash(password, 10),
        role: "ADMIN",
      },
    });
    await ensureDefaultAccounts(prisma, tenant.id);
    console.log(`[bootstrap] Tenant "${tenantName}" + Admin ${email} + default chart of accounts created.`);
    return;
  }

  console.log("[bootstrap] No setup env provided — initial setup guided via wizard on first launch.");
}

main()
  .catch((e) => {
    console.error("[bootstrap] Fehler:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });

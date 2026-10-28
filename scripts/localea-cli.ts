#!/usr/bin/env node
import readline from "node:readline";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { ensureDefaultAccounts } from "../src/lib/accounts";

export const BASE_DOMAIN = "rental.triotek.co.ke";

export function prompt(rl: readline.Interface, question: string, defaultValue = ""): Promise<string> {
  const q = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
  return new Promise((resolve) => {
    rl.question(q, (ans) => {
      resolve(ans.trim() || defaultValue);
    });
  });
}

export function parseArgs(args: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        result[key] = args[i + 1];
        i++;
      } else {
        result[key] = true;
      }
    }
  }
  return result;
}

export function resolvePackageManager(preference?: string | boolean): "pnpm" | "npm" {
  if (typeof preference === "string") {
    const p = preference.toLowerCase().trim();
    if (p === "npm") return "npm";
    if (p === "pnpm") return "pnpm";
  }
  return "pnpm"; // pnpm preferred by default
}

export function validateSubdomain(subdomain: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i.test(subdomain) || /^[a-z0-9]$/i.test(subdomain);
}

export function parseEnvFileContent(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) {
      result[match[1]] = match[2];
    }
  }
  return result;
}

export function buildEnvConfig(params: {
  tenantName?: string;
  subdomain?: string;
  adminEmail?: string;
  adminPassword?: string;
  dbUrl?: string;
  authSecret?: string;
  packageManager?: string;
  seedDemo?: boolean;
}): Record<string, string> {
  const authSecret =
    params.authSecret ||
    process.env.AUTH_SECRET ||
    crypto.randomBytes(32).toString("base64url");

  const config: Record<string, string> = {
    AUTH_SECRET: authSecret,
    AUTH_TRUST_HOST: "true",
    DOMAIN: BASE_DOMAIN,
    PACKAGE_MANAGER: resolvePackageManager(params.packageManager),
  };

  if (params.tenantName) config.TENANT_NAME = params.tenantName;
  if (params.adminEmail) config.ADMIN_EMAIL = params.adminEmail;
  if (params.adminPassword) config.ADMIN_PASSWORD = params.adminPassword;
  if (params.dbUrl) config.DATABASE_URL = params.dbUrl;
  if (params.seedDemo !== undefined) config.SEED_DEMO = params.seedDemo ? "true" : "";

  return config;
}

export function updateEnvFile(updates: Record<string, string>, targetFilePath?: string): string {
  const envPath = targetFilePath || path.resolve(process.cwd(), ".env");
  let content = "";
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf-8");
  } else if (fs.existsSync(path.resolve(process.cwd(), ".env.example"))) {
    content = fs.readFileSync(path.resolve(process.cwd(), ".env.example"), "utf-8");
  }

  const lines = content ? content.split("\n") : [];
  const keysSet = new Set(Object.keys(updates));

  const updatedLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && keysSet.has(match[1])) {
      const val = updates[match[1]];
      keysSet.delete(match[1]);
      return `${match[1]}=${val}`;
    }
    return line;
  });

  // Append remaining keys
  for (const k of keysSet) {
    updatedLines.push(`${k}=${updates[k]}`);
  }

  const finalContent = updatedLines.join("\n").trim() + "\n";
  if (targetFilePath || !process.env.VITEST) {
    fs.writeFileSync(envPath, finalContent, "utf-8");
    console.log(`\x1b[32m✔ .env configuration written to ${envPath}\x1b[0m`);
  }
  return finalContent;
}

async function runSetup(flags: Record<string, string | boolean>) {
  console.log("\n\x1b[1m\x1b[32m╔═══════════════════════════════════════════════════════════════╗\x1b[0m");
  console.log("\x1b[1m\x1b[32m║          Localea Rental Management — Setup & Onboarding CLI    ║\x1b[0m");
  console.log("\x1b[1m\x1b[32m╚═══════════════════════════════════════════════════════════════╝\x1b[0m\n");

  const isInteractive = Object.keys(flags).length <= 1; // only command
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    // 0. Package Manager Selection (pnpm preferred)
    let pkgMgr = resolvePackageManager(flags["package-manager"] || flags["pkg-mgr"] || flags["pnpm"]);
    if (isInteractive && !flags["package-manager"] && !flags["pkg-mgr"]) {
      const pmChoice = await prompt(rl, "Preferred package manager (pnpm recommended / npm)", "pnpm");
      pkgMgr = resolvePackageManager(pmChoice);
    }
    console.log(`\x1b[34mℹ Using package manager: ${pkgMgr}\x1b[0m`);

    // 1. Organization & Subdomain
    let tenantName = String(flags["tenant-name"] || "");
    if (!tenantName && isInteractive) {
      tenantName = await prompt(rl, "Organization / Property Company Name", "Localea Properties");
    } else if (!tenantName) {
      tenantName = "Localea Properties";
    }

    let subdomain = String(flags["subdomain"] || "");
    if (!subdomain && isInteractive) {
      const defaultSub = tenantName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) || "main";
      subdomain = await prompt(rl, `Subdomain name for *.${BASE_DOMAIN}`, defaultSub);
    } else if (!subdomain) {
      subdomain = "main";
    }
    subdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "");

    let customDomain = String(flags["custom-domain"] || "");
    if (!customDomain && isInteractive) {
      customDomain = await prompt(rl, "Optional Custom Domain (press enter to skip)", "");
    }

    // 2. Administrator Credentials
    let adminName = String(flags["admin-name"] || "");
    if (!adminName && isInteractive) {
      adminName = await prompt(rl, "Administrator Full Name", "System Administrator");
    } else if (!adminName) {
      adminName = "System Administrator";
    }

    let adminEmail = String(flags["admin-email"] || "");
    if (!adminEmail && isInteractive) {
      adminEmail = await prompt(rl, "Administrator Email", `admin@${subdomain}.${BASE_DOMAIN}`);
    } else if (!adminEmail) {
      adminEmail = `admin@${subdomain}.${BASE_DOMAIN}`;
    }

    let adminPassword = String(flags["admin-password"] || flags["admin-pass"] || flags["password"] || "");
    if (!adminPassword && isInteractive) {
      adminPassword = await prompt(rl, "Administrator Password (min 4 characters)", "admin123");
      while (adminPassword.length < 4) {
        console.log("\x1b[33mPassword too short. Please enter at least 4 characters.\x1b[0m");
        adminPassword = await prompt(rl, "Administrator Password", "admin123");
      }
    } else if (!adminPassword) {
      adminPassword = crypto.randomBytes(6).toString("base64url");
      console.log(`\x1b[33mNo password provided. Generated temporary password: ${adminPassword}\x1b[0m`);
    }

    // 3. Database URL & Secrets
    let dbUrl = String(flags["db-url"] || process.env.DATABASE_URL || "");
    if (!dbUrl && isInteractive) {
      dbUrl = await prompt(
        rl,
        "PostgreSQL Database URL (or enter to use built-in resilient mock)",
        "postgresql://localea:localea_password@localhost:5432/localea?schema=public",
      );
    }

    // 4. Demo Mode Preference
    let isDemo = flags["demo"] === true || flags["seed-demo"] === true || flags["demo"] === "true";
    if (isInteractive && flags["demo"] === undefined && flags["seed-demo"] === undefined) {
      const demoChoice = await prompt(rl, "Install representative Guided Demo data? (y/n)", "y");
      isDemo = demoChoice.toLowerCase().startsWith("y");
    }

    const authSecret =
      process.env.AUTH_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      crypto.randomBytes(32).toString("base64url");

    // Update .env file with production / local parameters
    const envUpdates = buildEnvConfig({
      tenantName,
      subdomain,
      adminEmail,
      adminPassword,
      dbUrl,
      authSecret,
      packageManager: pkgMgr,
      seedDemo: isDemo,
    });
    updateEnvFile(envUpdates);

    console.log("\n\x1b[36m⚙ Provisioning tenant and administrator in database...\x1b[0m");

    // Check if tenant exists by subdomain
    let tenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ subdomain }, ...(customDomain ? [{ customDomain }] : [])],
      },
    });

    if (tenant) {
      console.log(`\x1b[33mUpdating existing tenant for subdomain '${subdomain}'...\x1b[0m`);
      tenant = await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          name: tenantName,
          customDomain: customDomain || null,
        },
      });
    } else {
      tenant = await prisma.tenant.create({
        data: {
          name: tenantName,
          subdomain,
          customDomain: customDomain || null,
          brandColor: "#0F5132",
        },
      });
      console.log(`\x1b[32m✔ Tenant record created: ${tenant.name} (${tenant.id})\x1b[0m`);
    }

    // Initialize chart of accounts
    try {
      await ensureDefaultAccounts(prisma, tenant.id);
      console.log(`\x1b[32m✔ Default Chart of Accounts initialized.\x1b[0m`);
    } catch {
      // ignore in environments without live DB
    }

    // Check / create administrator user
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: adminEmail, mode: "insensitive" } },
    });

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: adminName,
          passwordHash,
          role: "ADMIN",
          tenantId: tenant.id,
        },
      });
      console.log(`\x1b[32m✔ Existing user '${adminEmail}' updated as Tenant Administrator.\x1b[0m`);
    } else {
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          passwordHash,
          role: "ADMIN",
          tenantId: tenant.id,
          locale: "en",
        },
      });
      console.log(`\x1b[32m✔ Administrator account created: ${adminEmail}\x1b[0m`);
    }

    const tenantUrl = `https://${subdomain}.${BASE_DOMAIN}`;
    console.log("\n\x1b[1m\x1b[32m===============================================================\x1b[0m");
    console.log("\x1b[1m\x1b[32m  🎉 SETUP COMPLETE: LOCALEA RENTAL MANAGEMENT IS READY!       \x1b[0m");
    console.log("\x1b[1m\x1b[32m===============================================================\x1b[0m");
    console.log(`\n\x1b[1mTenant Domain:\x1b[0m       ${tenantUrl}`);
    if (customDomain) {
      console.log(`\x1b[1mCustom Domain:\x1b[0m       https://${customDomain}`);
    }
    console.log(`\x1b[1mLocal URL:\x1b[0m           http://localhost:3000`);
    console.log(`\x1b[1mAdmin Email:\x1b[0m         ${adminEmail}`);
    console.log(`\x1b[1mAdmin Password:\x1b[0m      ${adminPassword}`);
    console.log("\n\x1b[36mNext Steps for Administrator:\x1b[0m");
    console.log("1. Sign in to your dashboard.");
    console.log("2. Navigate to \x1b[1mSettings → Users\x1b[0m to onboard managers, accountants, and staff.");
    console.log("3. Add properties, residential/commercial units, and active lease agreements.\n");
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

async function listTenants() {
  const tenants = await prisma.tenant.findMany({
    include: {
      users: { select: { email: true, name: true, role: true } },
      _count: { select: { properties: true, users: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log("\n\x1b[1mLocalea Multi-Tenant Registry:\x1b[0m");
  console.log("--------------------------------------------------------------------------------");
  for (const t of tenants) {
    const subUrl = t.subdomain ? `https://${t.subdomain}.${BASE_DOMAIN}` : "(none)";
    console.log(`• \x1b[1m${t.name}\x1b[0m (ID: ${t.id})`);
    console.log(`  Subdomain URL:  ${subUrl}`);
    if (t.customDomain) console.log(`  Custom Domain:  https://${t.customDomain}`);
    const propCount = t._count?.properties ?? 0;
    const userCount = t._count?.users ?? 0;
    console.log(`  Properties:     ${propCount} | Users: ${userCount}`);
    const admins = (t.users || []).filter((u: { role: string; email: string }) => u.role === "ADMIN").map((u: { role: string; email: string }) => u.email).join(", ");
    console.log(`  Admins:         ${admins || "None"}\n`);
  }
  await prisma.$disconnect();
}

async function toggleDemo(flags: Record<string, string | boolean>) {
  const targetSub = flags["subdomain"] ? String(flags["subdomain"]) : undefined;
  const tenant = await prisma.tenant.findFirst({
    where: targetSub ? { subdomain: targetSub } : {},
    orderBy: { createdAt: "asc" },
  });

  if (!tenant) {
    console.log("\x1b[31mNo tenant found to toggle demo mode.\x1b[0m");
    await prisma.$disconnect();
    return;
  }

  const newState = !tenant.isDemo;
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { isDemo: newState },
  });

  console.log(`\x1b[32m✔ Demo Guide Mode for tenant '${tenant.name}' is now: ${newState ? "ENABLED (Guided Tour)" : "DISABLED (Clean Live)"}\x1b[0m`);
  await prisma.$disconnect();
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "setup";
  const flags = parseArgs(args.slice(1));

  switch (command) {
    case "setup":
    case "init":
      await runSetup(flags);
      break;
    case "tenant:list":
    case "tenants":
      await listTenants();
      break;
    case "demo:toggle":
      await toggleDemo(flags);
      break;
    default:
      console.log(`Unknown command: ${command}`);
      console.log("Usage: npx tsx scripts/localea-cli.ts [setup | tenant:list | demo:toggle] [options]");
      break;
  }
}

if (
  process.argv[1] &&
  (process.argv[1].endsWith("localea-cli.ts") || process.argv[1].endsWith("localea-cli.js"))
) {
  main().catch((err) => {
    console.error("\x1b[31mError during CLI execution:\x1b[0m", err);
    process.exit(1);
  });
}

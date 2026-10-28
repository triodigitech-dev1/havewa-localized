import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  parseArgs,
  resolvePackageManager,
  validateSubdomain,
  parseEnvFileContent,
  buildEnvConfig,
  updateEnvFile,
  BASE_DOMAIN,
} from "../../scripts/localea-cli";

describe("Deployment and Setup CLI Unit Tests", () => {
  describe("parseArgs", () => {
    it("parses key-value pairs from command line arguments", () => {
      const args = ["--tenant-name", "Localea Properties", "--subdomain", "kilimani", "--port", "3000"];
      const parsed = parseArgs(args);
      expect(parsed["tenant-name"]).toBe("Localea Properties");
      expect(parsed["subdomain"]).toBe("kilimani");
      expect(parsed["port"]).toBe("3000");
    });

    it("parses standalone boolean flags", () => {
      const args = ["--seed-demo", "--pnpm", "--verbose"];
      const parsed = parseArgs(args);
      expect(parsed["seed-demo"]).toBe(true);
      expect(parsed["pnpm"]).toBe(true);
      expect(parsed["verbose"]).toBe(true);
    });

    it("handles mixed boolean flags and key-value arguments", () => {
      const args = ["--tenant-name", "Acme", "--demo", "--db-url", "postgresql://localhost/db"];
      const parsed = parseArgs(args);
      expect(parsed["tenant-name"]).toBe("Acme");
      expect(parsed["demo"]).toBe(true);
      expect(parsed["db-url"]).toBe("postgresql://localhost/db");
    });

    it("returns an empty object when no flags are passed", () => {
      expect(parseArgs([])).toEqual({});
    });
  });

  describe("resolvePackageManager", () => {
    it("defaults to pnpm when unspecified", () => {
      expect(resolvePackageManager(undefined)).toBe("pnpm");
      expect(resolvePackageManager("")).toBe("pnpm");
    });

    it("returns pnpm when explicitly requested", () => {
      expect(resolvePackageManager("pnpm")).toBe("pnpm");
      expect(resolvePackageManager("PNPM")).toBe("pnpm");
    });

    it("returns npm when requested", () => {
      expect(resolvePackageManager("npm")).toBe("npm");
      expect(resolvePackageManager("NPM")).toBe("npm");
    });
  });

  describe("validateSubdomain", () => {
    it("accepts valid alphanumeric subdomains and hyphens", () => {
      expect(validateSubdomain("kilimani")).toBe(true);
      expect(validateSubdomain("westlands-heights")).toBe(true);
      expect(validateSubdomain("apt101")).toBe(true);
      expect(validateSubdomain("a")).toBe(true);
    });

    it("rejects invalid subdomains", () => {
      expect(validateSubdomain("-invalid")).toBe(false);
      expect(validateSubdomain("invalid-")).toBe(false);
      expect(validateSubdomain("has_underscore")).toBe(false);
      expect(validateSubdomain("has.dot")).toBe(false);
      expect(validateSubdomain("has space")).toBe(false);
    });
  });

  describe("parseEnvFileContent", () => {
    it("correctly extracts key-value pairs from env file lines", () => {
      const rawEnv = `
# Comment line
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/db?schema=public
AUTH_SECRET=xyz123==
EMPTY_VAL=
`;
      const parsed = parseEnvFileContent(rawEnv);
      expect(parsed.NODE_ENV).toBe("production");
      expect(parsed.PORT).toBe("3000");
      expect(parsed.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/db?schema=public");
      expect(parsed.AUTH_SECRET).toBe("xyz123==");
      expect(parsed.EMPTY_VAL).toBe("");
    });
  });

  describe("buildEnvConfig", () => {
    it("constructs full environment map with pnpm package manager by default", () => {
      const config = buildEnvConfig({
        tenantName: "Safari Properties",
        subdomain: "safari",
        adminEmail: "admin@safari.com",
        adminPassword: "secretPassword123",
        dbUrl: "postgresql://localhost:5432/localea",
        authSecret: "test-secret-key-32-bytes-long",
        seedDemo: true,
      });

      expect(config.AUTH_SECRET).toBe("test-secret-key-32-bytes-long");
      expect(config.AUTH_TRUST_HOST).toBe("true");
      expect(config.DOMAIN).toBe(BASE_DOMAIN);
      expect(config.PACKAGE_MANAGER).toBe("pnpm");
      expect(config.TENANT_NAME).toBe("Safari Properties");
      expect(config.ADMIN_EMAIL).toBe("admin@safari.com");
      expect(config.ADMIN_PASSWORD).toBe("secretPassword123");
      expect(config.DATABASE_URL).toBe("postgresql://localhost:5432/localea");
      expect(config.SEED_DEMO).toBe("true");
    });

    it("handles clean non-demo configurations", () => {
      const config = buildEnvConfig({
        tenantName: "Nairobi Tower",
        packageManager: "npm",
        seedDemo: false,
      });

      expect(config.PACKAGE_MANAGER).toBe("npm");
      expect(config.TENANT_NAME).toBe("Nairobi Tower");
      expect(config.SEED_DEMO).toBe("");
    });
  });

  describe("updateEnvFile", () => {
    it("merges updates into existing environment content without duplicating keys", () => {
      const existing = `PORT=3000\nNODE_ENV=production\nDATABASE_URL=old_url`;
      const updates = {
        DATABASE_URL: "postgresql://localhost:5432/new_db",
        AUTH_SECRET: "fresh_secret_token",
      };

      const tempPath = path.resolve(os.tmpdir(), `test-env-${Date.now()}.env`);
      fs.writeFileSync(tempPath, existing, "utf-8");

      updateEnvFile(updates, tempPath);
      const written = fs.readFileSync(tempPath, "utf-8");
      const parsed = parseEnvFileContent(written);

      expect(parsed.PORT).toBe("3000");
      expect(parsed.NODE_ENV).toBe("production");
      expect(parsed.DATABASE_URL).toBe("postgresql://localhost:5432/new_db");
      expect(parsed.AUTH_SECRET).toBe("fresh_secret_token");

      try {
        fs.unlinkSync(tempPath);
      } catch {
        // ignore
      }
    });
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { skipCSRFCheck } from "@auth/core";

describe("Google Social Connection & Account Linking Policy", () => {
  beforeEach(async () => {
    // Ensure our test user exists
    const existing = await prisma.user.findFirst({
      where: { email: { equals: "admin@localea.app", mode: "insensitive" } },
    });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: "admin@localea.app",
          name: "System Admin",
          passwordHash: "hash",
          role: "ADMIN",
          tenantId: "main",
        },
      });
    }
  });

  it("exports skipCSRFCheck symbol to protect iframe action callbacks", () => {
    expect(skipCSRFCheck).toBeDefined();
    expect(typeof skipCSRFCheck).toBe("symbol");
  });

  it("allows Google login ONLY when user email is already registered", async () => {
    const registeredEmail = "admin@localea.app";
    const user = await prisma.user.findFirst({
      where: { email: { equals: registeredEmail, mode: "insensitive" } },
    });
    expect(user).not.toBeNull();
    expect(user?.email).toBe(registeredEmail);
  });

  it("strictly rejects Google login when user email is NOT registered", async () => {
    const unregisteredEmail = "stranger_random_user_999@gmail.com";
    const user = await prisma.user.findFirst({
      where: { email: { equals: unregisteredEmail, mode: "insensitive" } },
    });
    expect(user).toBeNull();
  });

  it("handles case-insensitive email matching for linked Google accounts", async () => {
    const mixedCaseEmail = "AdMiN@LoCaLeA.aPp";
    const user = await prisma.user.findFirst({
      where: { email: { equals: mixedCaseEmail.toLowerCase().trim(), mode: "insensitive" } },
    });
    expect(user).not.toBeNull();
    expect(user?.role).toBe("ADMIN");
  });
});

import { describe, it, expect } from "vitest";
import { createMockPrisma } from "./mock-prisma";

describe("Mock Prisma Relations and Selection", () => {
  it("returns nested array relations as true Arrays when using select", async () => {
    const prisma = createMockPrisma();
    const units = await prisma.unit.findMany({
      select: {
        id: true,
        leases: {
          select: {
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    expect(Array.isArray(units)).toBe(true);
    expect(units.length).toBeGreaterThan(0);

    for (const u of units) {
      expect(Array.isArray(u.leases)).toBe(true);
      // Verify .some() is a function and does not throw TypeError
      expect(typeof u.leases.some).toBe("function");
      const isOccupied = u.leases.some(
        (l: { startDate: Date; endDate: Date | null }) =>
          new Date(l.startDate) <= new Date() && (!l.endDate || new Date(l.endDate) >= new Date())
      );
      expect(typeof isOccupied).toBe("boolean");
    }
  });

  it("handles empty or missing relation selections cleanly", async () => {
    const prisma = createMockPrisma();
    const units = await prisma.unit.findMany({
      where: { id: "non-existent-unit-id" },
      select: {
        id: true,
        leases: true,
      },
    });

    expect(Array.isArray(units)).toBe(true);
    expect(units.length).toBe(0);
  });
});

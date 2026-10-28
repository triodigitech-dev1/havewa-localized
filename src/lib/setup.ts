import { prisma } from "@/lib/prisma";

/** Returns true if no users exist in the system yet -> initial setup wizard required. */
export async function needsSetup(): Promise<boolean> {
  const count = await prisma.user.count();
  return count === 0;
}

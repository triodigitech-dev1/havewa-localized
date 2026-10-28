import { promises as fs } from "node:fs";
import path from "node:path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "@/lib/storage";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET() {
  const session = await auth();
  const tenant = session?.user
    ? await prisma.tenant.findUnique({ where: { id: session.user.tenantId }, select: { logoKey: true } })
    : await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" }, select: { logoKey: true } });

  if (tenant?.logoKey) {
    try {
      const buf = await readFile(tenant.logoKey);
      const ext = tenant.logoKey.split(".").pop()?.toLowerCase() ?? "";
      return new Response(new Uint8Array(buf), {
        headers: {
          "Content-Type": MIME[ext] ?? "application/octet-stream",
          "Cache-Control": "private, max-age=60",
        },
      });
    } catch {
      // Fallback to default Localea emblem below
    }
  }

  // Default to official Localea circular emblem
  try {
    const defaultEmblemPath = path.join(
      process.cwd(),
      "public",
      "assets",
      "aistudio",
      "Localea_Rental_Management_logo_d__df7299e3_2K_46e38a94.jpg"
    );
    const buf = await fs.readFile(defaultEmblemPath);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

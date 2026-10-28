import { prisma } from "@/lib/prisma";

export const BASE_PLATFORM_DOMAIN = "rental.triotek.co.ke";

export type TenantContext = {
  id: string;
  name: string;
  subdomain: string | null;
  customDomain: string | null;
  brandColor: string | null;
  logoKey: string | null;
  isDemo: boolean;
};

/**
 * Extracts subdomain or custom domain from host header.
 * E.g.:
 * "kilimani.rental.triotek.co.ke" -> subdomain: "kilimani"
 * "rentals.triotek.co.ke" -> subdomain: null (base domain)
 * "client.custom-real-estate.com" -> customDomain: "client.custom-real-estate.com"
 */
export function parseDomainInfo(hostWithPort?: string | null): {
  subdomain: string | null;
  customDomain: string | null;
  isBasePlatform: boolean;
} {
  if (!hostWithPort) {
    return { subdomain: null, customDomain: null, isBasePlatform: false };
  }

  const host = hostWithPort.split(":")[0].toLowerCase().trim();

  // Local development / IP
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local") || host.endsWith(".run.app")) {
    return { subdomain: null, customDomain: null, isBasePlatform: true };
  }

  // Exact base platform domain
  if (host === BASE_PLATFORM_DOMAIN) {
    return { subdomain: null, customDomain: null, isBasePlatform: true };
  }

  // Subdomain of rental.triotek.co.ke
  if (host.endsWith(`.${BASE_PLATFORM_DOMAIN}`)) {
    const sub = host.slice(0, -(BASE_PLATFORM_DOMAIN.length + 1));
    return { subdomain: sub, customDomain: null, isBasePlatform: false };
  }

  // Custom domain provided by client
  return { subdomain: null, customDomain: host, isBasePlatform: false };
}

/**
 * Resolves the tenant corresponding to a requested host name.
 */
export async function resolveTenantFromHost(hostWithPort?: string | null): Promise<TenantContext | null> {
  const { subdomain, customDomain } = parseDomainInfo(hostWithPort);

  if (subdomain) {
    const tenant = await prisma.tenant.findFirst({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        subdomain: true,
        customDomain: true,
        brandColor: true,
        logoKey: true,
        isDemo: true,
      },
    });
    if (tenant) return tenant;
  }

  if (customDomain) {
    const tenant = await prisma.tenant.findFirst({
      where: { customDomain },
      select: {
        id: true,
        name: true,
        subdomain: true,
        customDomain: true,
        brandColor: true,
        logoKey: true,
        isDemo: true,
      },
    });
    if (tenant) return tenant;
  }

  // Fallback to primary tenant
  const primary = await prisma.tenant.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      subdomain: true,
      customDomain: true,
      brandColor: true,
      logoKey: true,
      isDemo: true,
    },
  });

  return primary;
}

export function buildSubdomainUrl(subdomain?: string | null, customDomain?: string | null): string {
  if (customDomain) {
    return `https://${customDomain}`;
  }
  if (subdomain) {
    return `https://${subdomain}.${BASE_PLATFORM_DOMAIN}`;
  }
  return `https://${BASE_PLATFORM_DOMAIN}`;
}

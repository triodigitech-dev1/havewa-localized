import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { oidcConfigFromEnv } from "@/lib/sso";
import { resolveTenantFromHost } from "@/lib/tenant";
import { LoginShowcaseView } from "@/components/login-showcase-view";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ registered?: string; email?: string; error?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    if (["MIETER", "EIGENTUEMER", "HANDWERKER"].includes(session.user.role)) {
      redirect("/portal");
    }
    redirect("/dashboard");
  }

  const { locale } = await params;
  const sp = searchParams ? await searchParams : {};
  const isRegistered = sp.registered === "1";
  const authError = sp.error;
  const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  // Resolve tenant context based on subdomain / domain
  const reqHeaders = await headers();
  const host = reqHeaders.get("x-forwarded-host") || reqHeaders.get("host");
  const tenant = await resolveTenantFromHost(host);

  const tenantName = tenant?.name ?? "Localea Rental Management";
  const sso = oidcConfigFromEnv();
  const initialEmail = sp.email || "admin@localea.app";

  return (
    <LoginShowcaseView
      locale={locale}
      tenantName={tenantName}
      tenantSubdomain={tenant?.subdomain ?? undefined}
      initialEmail={initialEmail}
      ssoEnabled={!!sso}
      ssoName={sso?.name ?? "SSO"}
      authError={authError}
      isRegistered={isRegistered}
      googleConfigured={googleConfigured}
    />
  );
}

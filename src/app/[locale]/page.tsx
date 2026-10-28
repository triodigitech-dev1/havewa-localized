import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { needsSetup } from "@/lib/setup";

// Main app route for "/" and "/en".
// Direct entry point into the system:
// 1. First step: Account & Organization setup if setup has not been done yet -> /setup
// 2. Authenticated -> /dashboard
// 3. Unauthenticated -> /login
export default async function LocaleRootPage() {
  const session = await auth();
  if (session?.user) {
    if (["MIETER", "EIGENTUEMER", "HANDWERKER"].includes(session.user.role)) {
      redirect("/portal");
    }
    redirect("/dashboard");
  }
  if (await needsSetup()) {
    redirect("/setup");
  }
  redirect("/login");
}

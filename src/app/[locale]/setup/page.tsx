import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { needsSetup } from "@/lib/setup";
import { SetupShowcaseView } from "@/components/setup-showcase-view";

export default async function SetupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  const { locale } = await params;
  const isSetupNeeded = await needsSetup();

  return (
    <SetupShowcaseView
      locale={locale}
      isAlreadyConfigured={!isSetupNeeded}
    />
  );
}

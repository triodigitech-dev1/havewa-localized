import { getLocale } from "next-intl/server";
import { requireUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell } from "@/components/notification-bell";
import { PWAInstallButton } from "@/components/pwa-install-button";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const locale = await getLocale();
  const [notifs, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);
  const dtf = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" });
  const notifItems = notifs.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.read,
    createdAt: dtf.format(n.createdAt),
  }));

  return (
    <div className="min-h-svh bg-muted/30">
      <header className="flex h-14 items-center gap-2 border-b bg-background px-4">
        <Link href="/portal" className="flex items-center gap-2 group" title="Localea Rental Management">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/aistudio/Localea_Rental_Management_logo_d__df7299e3_2K_46e38a94.jpg"
            alt="Localea Rental Management"
            title="Localea Rental Management"
            className="size-9 rounded-xl object-cover ring-1 ring-emerald-500/30 border border-amber-300/40 shadow-xs transition-transform group-hover:scale-105"
          />
          <span className="sr-only">Localea Rental Management</span>
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          <PWAInstallButton />
          <NotificationBell items={notifItems} unread={unread} />
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu name={user.name} email={user.email} role={user.role} />
        </div>
      </header>
      <div className="mx-auto max-w-4xl p-4 md:p-6">{children}</div>
    </div>
  );
}

import { getTranslations, getLocale } from "next-intl/server";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { money } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PersonDialog } from "@/components/entity-dialogs";
import { ImportDialog } from "@/components/import-dialog";
import { DeleteButton } from "@/components/delete-button";
import { deletePerson } from "@/server/actions/persons";
import { Users, TrendingUp, AlertCircle } from "lucide-react";

const GROUPS = ["MIETER", "EIGENTUEMER", "INTERESSENT", "HANDWERKER", "MAKLER", "BANK", "SONSTIGE"] as const;

export default async function PersonsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireUser();
  const t = await getTranslations();
  const locale = await getLocale();
  const active = GROUPS.includes(sp.type as (typeof GROUPS)[number]) ? sp.type : undefined;

  const [persons, customDefs] = await Promise.all([
    prisma.person.findMany({
      where: { tenantId: user.tenantId, ...(active ? { type: active as (typeof GROUPS)[number] } : {}) },
      include: {
        renters: {
          include: {
            lease: {
              include: {
                charges: {
                  include: { payments: true },
                },
              },
            },
          },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.customFieldDef.findMany({
      where: { tenantId: user.tenantId, entity: "PERSON" },
      orderBy: { createdAt: "asc" },
      select: { key: true, label: true },
    }),
  ]);

  const personsWithBalances = persons.map((p) => {
    let debits = 0;
    let credits = 0;
    let hasLeases = false;

    if (Array.isArray(p.renters) && p.renters.length > 0) {
      hasLeases = true;
      for (const r of p.renters) {
        if (!r.lease || !Array.isArray(r.lease.charges)) continue;
        for (const c of r.lease.charges) {
          debits += Number(c.amount);
          if (Array.isArray(c.payments)) {
            for (const pay of c.payments) {
              if (pay.direction === "EINGANG") {
                credits += Number(pay.amount);
              } else {
                credits -= Number(pay.amount);
              }
            }
          }
        }
      }
    }

    const net = credits - debits;

    return {
      person: p,
      hasLeases,
      debits,
      credits,
      net,
      isOverpaid: net > 0.001,
      isDue: net < -0.001,
      isSettled: hasLeases && Math.abs(net) <= 0.001,
    };
  });

  // Financial aggregates per person
  const totalPortfolioCredits = personsWithBalances.reduce(
    (acc, row) => (row.hasLeases && row.net > 0.001 ? acc + row.net : acc),
    0
  );
  const totalPortfolioArrears = personsWithBalances.reduce(
    (acc, row) => (row.hasLeases && row.net < -0.001 ? acc + Math.abs(row.net) : acc),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("persons.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("persons.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<a href="/api/export/persons" />}>
            {t("common.exportCsv")}
          </Button>
          <ImportDialog entity="person" />
          <PersonDialog customDefs={customDefs} />
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Users className="size-3.5 text-muted-foreground" />
              {t("persons.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{persons.length}</div>
            <p className="text-xs text-muted-foreground pt-1">
              {persons.filter((p) => p.type === "MIETER").length} {t("personType.MIETER")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-emerald-600" />
              {t("persons.portfolioCredit")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              +{money(totalPortfolioCredits, locale)}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              {t("persons.inCredit")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="size-3.5 text-amber-600" />
              {t("persons.portfolioDue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {money(totalPortfolioArrears, locale)}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              {t("persons.balanceDue")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Adressbuch-Gruppenfilter */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={!active ? "default" : "outline"}
          render={<Link href="/persons" />}
        >
          {t("persons.allGroups")}
        </Button>
        {GROUPS.map((g) => (
          <Button
            key={g}
            size="sm"
            variant={active === g ? "default" : "outline"}
            render={<Link href={{ pathname: "/persons", query: { type: g } }} />}
          >
            {t(`personType.${g}`)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {persons.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t("persons.empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("fields.lastName")}</TableHead>
                  <TableHead>{t("fields.firstName")}</TableHead>
                  <TableHead>{t("persons.group")}</TableHead>
                  <TableHead>{t("persons.financialStatus")}</TableHead>
                  <TableHead>{t("fields.email")}</TableHead>
                  <TableHead>{t("fields.phone")}</TableHead>
                  <TableHead className="w-24 text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personsWithBalances.map(({ person: p, hasLeases, net, isOverpaid, isDue }) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link href={`/persons/${p.id}`} className="hover:underline">
                        {p.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>{p.firstName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t(`personType.${p.type}`)}</Badge>
                    </TableCell>
                    <TableCell>
                      {hasLeases ? (
                        <Badge
                          variant={isOverpaid ? "default" : isDue ? "destructive" : "secondary"}
                          className={`text-xs tabular-nums ${
                            isOverpaid
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : isDue
                              ? "bg-amber-600 hover:bg-amber-700 text-white"
                              : ""
                          }`}
                        >
                          {isOverpaid
                            ? `+${money(net, locale)} (${t("persons.inCredit")})`
                            : isDue
                            ? `${money(net, locale)} (${t("persons.balanceDue")})`
                            : `${money(0, locale)} (${t("persons.settled")})`}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.email ?? t("common.none")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.phone ?? t("common.none")}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <PersonDialog
                          customDefs={customDefs}
                          person={{
                            id: p.id,
                            firstName: p.firstName,
                            lastName: p.lastName,
                            email: p.email,
                            phone: p.phone,
                            type: p.type,
                            note: p.note,
                            custom: (p.custom as Record<string, string>) ?? {},
                          }}
                        />
                        <DeleteButton action={deletePerson} id={p.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

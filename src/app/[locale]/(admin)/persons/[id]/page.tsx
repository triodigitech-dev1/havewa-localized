import { ArrowLeft, Mail, Phone, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { money, date } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PersonDialog } from "@/components/entity-dialogs";
import { LeaseDialog } from "@/components/lease-dialogs";
import { PaymentDialog, ChargeDialog } from "@/components/finance-dialogs";
import { WhatsAppReminderButton } from "@/components/whatsapp-reminder-button";

export default async function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const t = await getTranslations();
  const locale = await getLocale();

  const person = await prisma.person.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      renters: {
        include: {
          lease: {
            include: {
              unit: { include: { building: { include: { property: true } } } },
              components: true,
              charges: {
                include: {
                  payments: { include: { account: true } },
                  dunnings: { select: { level: true } },
                },
                orderBy: { dueDate: "desc" },
              },
            },
          },
        },
      },
      owners: { include: { unit: { include: { building: { include: { property: true } } } } } },
    },
  });
  if (!person) notFound();

  const [units, customDefs, leaseDefs, accounts] = await Promise.all([
    prisma.unit.findMany({
      where: { tenantId: user.tenantId },
      include: { building: { include: { property: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.customFieldDef.findMany({
      where: { tenantId: user.tenantId, entity: "PERSON" },
      orderBy: { createdAt: "asc" },
      select: { key: true, label: true },
    }),
    prisma.customFieldDef.findMany({
      where: { tenantId: user.tenantId, entity: "LEASE" },
      orderBy: { createdAt: "asc" },
      select: { key: true, label: true },
    }),
    prisma.account.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const customValues = (person.custom as Record<string, string>) ?? {};
  const unitOpts = units.map((u) => ({
    value: u.id,
    label: `${u.building.property.name} · ${u.building.name} · ${u.label}`,
  }));
  const accountOpts = accounts.map((a) => ({ value: a.id, label: a.name }));

  const personLeaseOpts = person.renters.map((r) => ({
    value: r.lease.id,
    label: `${r.lease.unit.building.property.name} · ${r.lease.unit.label}`,
  }));

  // Calculate Debits, Credits and Ledger entries
  const allCharges = person.renters.flatMap((r) =>
    r.lease.charges.map((c) => ({
      ...c,
      lease: r.lease,
      unitLabel: `${r.lease.unit.building.property.name} · ${r.lease.unit.label}`,
    }))
  );

  let totalDebits = 0;
  let totalCredits = 0;
  let totalOpenAmount = 0;
  let overdueCount = 0;
  const now = new Date();

  type LedgerEntry = {
    id: string;
    date: Date;
    type: "DEBIT" | "CREDIT";
    category: string;
    title: string;
    reference?: string | null;
    debit?: number;
    credit?: number;
    chargeId?: string;
    isOpen?: boolean;
    openAmount?: number;
    isOverdue?: boolean;
  };

  const ledgerEntries: LedgerEntry[] = [];

  for (const c of allCharges) {
    const chargeAmt = Number(c.amount);
    totalDebits += chargeAmt;
    const paidSum = c.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const openAmt = chargeAmt - paidSum;
    const isOverdue = openAmt > 0.001 && new Date(c.dueDate) < now;

    if (openAmt > 0.001) {
      totalOpenAmount += openAmt;
      if (isOverdue) overdueCount++;
    }

    ledgerEntries.push({
      id: `charge-${c.id}`,
      date: new Date(c.dueDate),
      type: "DEBIT",
      category: t(`chargeType.${c.type}`),
      title: `${c.unitLabel} (${date(c.period, locale)})`,
      reference: c.description || undefined,
      debit: chargeAmt,
      chargeId: c.id,
      isOpen: openAmt > 0.001,
      openAmount: Math.max(0, openAmt),
      isOverdue,
    });

    for (const p of c.payments) {
      const pAmt = Number(p.amount);
      if (p.direction === "EINGANG") {
        totalCredits += pAmt;
        ledgerEntries.push({
          id: `payment-${p.id}`,
          date: new Date(p.date),
          type: "CREDIT",
          category: t("finances.recordPayment"),
          title: p.reference || t("paymentDirection.EINGANG"),
          reference: p.account?.name ? `${t("finances.account")}: ${p.account.name}` : undefined,
          credit: pAmt,
        });
      } else {
        totalCredits -= pAmt;
        ledgerEntries.push({
          id: `payment-${p.id}`,
          date: new Date(p.date),
          type: "DEBIT",
          category: t("paymentDirection.AUSGANG"),
          title: p.reference || t("paymentDirection.AUSGANG"),
          reference: p.account?.name ? `${t("finances.account")}: ${p.account.name}` : undefined,
          debit: pAmt,
        });
      }
    }
  }

  // Chronological sort ascending to compute running balances correctly
  ledgerEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

  let running = 0;
  const ledgerWithBalance = ledgerEntries.map((entry) => {
    if (entry.type === "CREDIT") {
      running += entry.credit ?? 0;
    } else {
      running -= entry.debit ?? 0;
    }
    return {
      ...entry,
      runningBalance: running,
    };
  });

  // Reverse for display: newest transactions on top
  const displayLedger = [...ledgerWithBalance].reverse();

  // Net Balance: Credits (paid) - Debits (billed)
  // Positive = Overpaid / In Credit (Guthaben)
  // Negative = Balance Due (Rückstand)
  const netBalance = totalCredits - totalDebits;
  const isOverpaid = netBalance > 0.001;
  const isDue = netBalance < -0.001;

  const primaryLease = person.renters[0]?.lease;
  const primaryRent = primaryLease
    ? Number(primaryLease.rentCold) + (primaryLease.components?.reduce((s, c) => s + Number(c.amount), 0) ?? 0)
    : undefined;
  const oldestOpenCharge = allCharges.find((c) => {
    const paid = c.payments.reduce((s, p) => s + Number(p.amount), 0);
    return Number(c.amount) - paid > 0.001;
  }) ?? allCharges[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" render={<Link href="/persons" />}>
            <ArrowLeft className="size-4" />
            {t("persons.title")}
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {person.firstName} {person.lastName}
            </h1>
            {person.renters.length > 0 && (
              <Badge
                variant={isOverpaid ? "default" : isDue ? "destructive" : "secondary"}
                className={
                  isOverpaid
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : isDue
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : ""
                }
              >
                {isOverpaid
                  ? `+${money(netBalance, locale)} · ${t("persons.inCredit")}`
                  : isDue
                  ? `${money(netBalance, locale)} · ${t("persons.balanceDue")}`
                  : `${money(0, locale)} · ${t("persons.settled")}`}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-sm text-muted-foreground">
            <Badge variant="outline">{t(`personType.${person.type}`)}</Badge>
            {person.email && (
              <span className="flex items-center gap-1">
                <Mail className="size-3.5" /> {person.email}
              </span>
            )}
            {person.phone && (
              <span className="flex items-center gap-1">
                <Phone className="size-3.5" /> {person.phone}
              </span>
            )}
          </div>
          {person.note && <p className="max-w-xl pt-2 text-sm">{person.note}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {person.renters.length > 0 && (
            <WhatsAppReminderButton
              tenantName={`${person.firstName} ${person.lastName}`}
              phoneNumber={person.phone}
              unitLabel={primaryLease?.unit.label}
              propertyName={primaryLease?.unit.building.property.name}
              rentAmount={primaryRent}
              balanceDue={totalOpenAmount > 0.001 ? totalOpenAmount : undefined}
              buttonText="Send WhatsApp Reminder"
            />
          )}
          {oldestOpenCharge && accountOpts.length > 0 && (
            <PaymentDialog
              chargeId={oldestOpenCharge.id}
              defaultAmount={totalOpenAmount > 0.001 ? totalOpenAmount : 0}
              accounts={accountOpts}
              trigger={
                <Button size="sm" variant="outline" className="gap-1.5 cursor-pointer">
                  <Wallet className="size-4 text-emerald-600" />
                  <span>{t("finances.recordPayment")}</span>
                </Button>
              }
            />
          )}
          {personLeaseOpts.length > 0 && <ChargeDialog leases={personLeaseOpts} />}
          <PersonDialog
            customDefs={customDefs}
            person={{
              id: person.id,
              firstName: person.firstName,
              lastName: person.lastName,
              email: person.email,
              phone: person.phone,
              type: person.type,
              note: person.note,
              custom: customValues,
            }}
          />
        </div>
      </div>

      {/* Financial Health & Credit/Debit Summary */}
      {person.renters.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("persons.totalDebits")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-foreground">
                {money(totalDebits, locale)}
              </div>
              <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
                <TrendingDown className="size-3 text-muted-foreground" />
                {allCharges.length} {t("finances.charge")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("persons.totalCredits")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {money(totalCredits, locale)}
              </div>
              <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
                <TrendingUp className="size-3 text-emerald-600" />
                {t("finances.paid")}
              </p>
            </CardContent>
          </Card>

          <Card className={isOverpaid ? "border-emerald-500/40 bg-emerald-500/5" : isDue ? "border-amber-500/40 bg-amber-500/5" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("persons.netBalance")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold tabular-nums ${
                  isOverpaid
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isDue
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground"
                }`}
              >
                {isOverpaid ? `+${money(netBalance, locale)}` : money(netBalance, locale)}
              </div>
              <p className="text-xs font-medium pt-1">
                {isOverpaid ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> {t("persons.inCredit")}
                  </span>
                ) : isDue ? (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="size-3" /> {t("persons.balanceDue")}
                  </span>
                ) : (
                  <span className="text-muted-foreground">{t("persons.settled")}</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("finances.open")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-foreground">
                {money(totalOpenAmount, locale)}
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                {overdueCount > 0 ? (
                  <span className="text-destructive font-medium">
                    {overdueCount} {t("finances.statusOVERDUE")}
                  </span>
                ) : (
                  <span>{t("dashboard.allGood")}</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Credit & Debit Ledger / Statement of Account */}
      {person.renters.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">{t("persons.financialLedger")}</CardTitle>
              <CardDescription>{t("persons.ledgerSubtitle")}</CardDescription>
            </div>
            {personLeaseOpts.length > 0 && (
              <div className="flex items-center gap-2">
                <ChargeDialog leases={personLeaseOpts} />
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {displayLedger.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">{t("persons.noLedgerEntries")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("persons.ledgerDate")}</TableHead>
                    <TableHead>{t("persons.ledgerType")}</TableHead>
                    <TableHead>{t("persons.ledgerReference")}</TableHead>
                    <TableHead className="text-right">{t("persons.ledgerDebit")}</TableHead>
                    <TableHead className="text-right">{t("persons.ledgerCredit")}</TableHead>
                    <TableHead className="text-right">{t("persons.ledgerRunning")}</TableHead>
                    <TableHead className="w-20 text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayLedger.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-sm font-medium whitespace-nowrap">
                        {date(row.date, locale)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            row.type === "CREDIT"
                              ? "default"
                              : row.isOverdue
                              ? "destructive"
                              : row.isOpen
                              ? "outline"
                              : "secondary"
                          }
                          className={row.type === "CREDIT" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                        >
                          {row.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{row.title}</div>
                        {row.reference && (
                          <div className="text-xs text-muted-foreground">{row.reference}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium">
                        {row.debit ? money(row.debit, locale) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {row.credit ? money(row.credit, locale) : "—"}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums text-sm font-semibold ${
                          row.runningBalance > 0.001
                            ? "text-emerald-600 dark:text-emerald-400"
                            : row.runningBalance < -0.001
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {row.runningBalance > 0.001
                          ? `+${money(row.runningBalance, locale)}`
                          : money(row.runningBalance, locale)}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.isOpen && row.chargeId && (
                          <div className="flex justify-end">
                            <PaymentDialog
                              chargeId={row.chargeId}
                              defaultAmount={row.openAmount ?? 0}
                              accounts={accountOpts}
                            />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Leases */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("persons.tenancies")}</CardTitle>
          <LeaseDialog units={unitOpts} presetPersonId={person.id} customDefs={leaseDefs} triggerLabel={t("leases.new")} />
        </CardHeader>
        <CardContent className="space-y-2">
          {person.renters.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("persons.noTenancies")}</p>
          ) : (
            person.renters.map((r) => (
              <Link
                key={r.id}
                href={`/leases/${r.leaseId}`}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted"
              >
                <span className="font-medium">
                  {r.lease.unit.building.property.name} · {r.lease.unit.label}
                </span>
                <span className="text-muted-foreground">
                  {money(Number(r.lease.rentCold), locale)} · {date(r.lease.startDate, locale)}
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {/* Eigentum */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("persons.ownerships")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {person.owners.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("persons.noOwnerships")}</p>
          ) : (
            person.owners.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span className="font-medium">
                  {o.unit.building.property.name} · {o.unit.label}
                </span>
                <span className="text-muted-foreground">
                  {t("weg.share")}: {o.share}‰ · MEA {o.unit.mea ?? "—"}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {customDefs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("customFields.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {customDefs.map((d) => (
              <div key={d.key} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{d.label}</span>
                <span>{customValues[d.key] || t("common.none")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

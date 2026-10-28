import { ArrowLeft, Percent, Wrench, Receipt, ArrowUpRight, Users, Phone, Mail } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { money, date } from "@/lib/format";
import { computeMgmtFee, type FeeType } from "@/lib/fee";
import { buildAreaStatement, areaTimeWeights, VACANCY_ID } from "@/lib/allocation/area-time";
import { AreaAllocationDialog } from "@/components/area-dialogs";
import { deleteAreaAllocation } from "@/server/actions/area";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhatsAppReminderButton } from "@/components/whatsapp-reminder-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PropertyDialog,
  BuildingDialog,
  UnitDialog,
} from "@/components/entity-dialogs";
import { CostDialog } from "@/components/cost-dialog";
import { DeleteButton } from "@/components/delete-button";
import { deleteProperty, deleteBuilding, deleteUnit } from "@/server/actions/objects";
import { deleteCost } from "@/server/actions/costs";

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ areaYear?: string }>;
}) {
  const { id } = await params;
  const { areaYear: areaYearParam } = await searchParams;
  const user = await requireUser();
  const t = await getTranslations();
  const locale = await getLocale();

  const property = await prisma.property.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      buildings: {
        orderBy: { createdAt: "asc" },
        include: { units: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  if (!property) notFound();

  // Verwalterhonorar & aktive Mieter: Basis aus Einheitenzahl + aktiver Sollmiete berechnen
  const now = new Date();
  const activeLeases = await prisma.lease.findMany({
    where: {
      tenantId: user.tenantId,
      unit: { building: { propertyId: id } },
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    include: {
      components: { select: { amount: true } },
      unit: { select: { id: true, label: true, building: { select: { name: true } } } },
      renters: { include: { person: true } },
      charges: {
        include: { payments: { select: { amount: true } } },
        orderBy: { dueDate: "desc" },
      },
    },
  });
  const [customDefs, unitDefs, costEntries, tickets] = await Promise.all([
    prisma.customFieldDef.findMany({
      where: { tenantId: user.tenantId, entity: "PROPERTY" },
      orderBy: { createdAt: "asc" },
      select: { key: true, label: true },
    }),
    prisma.customFieldDef.findMany({
      where: { tenantId: user.tenantId, entity: "UNIT" },
      orderBy: { createdAt: "asc" },
      select: { key: true, label: true },
    }),
    prisma.costEntry.findMany({
      where: { tenantId: user.tenantId, propertyId: id },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    }),
    prisma.ticket.findMany({
      where: {
        tenantId: user.tenantId,
        OR: [{ propertyId: id }, { unit: { building: { propertyId: id } } }],
      },
      include: { unit: true, contractor: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);
  const customValues = (property.custom as Record<string, string>) ?? {};

  const unitCount = property.buildings.reduce((a, b) => a + b.units.length, 0);
  const monthlyRentSum = activeLeases.reduce(
    (a, l) => a + Number(l.rentCold) + l.components.reduce((s, c) => s + Number(c.amount), 0),
    0,
  );
  const mgmtFee = computeMgmtFee(
    { feeType: property.feeType as FeeType, feeValue: Number(property.feeValue) },
    { unitCount, monthlyRentSum },
  );

  const tenantRows = activeLeases.flatMap((l) => {
    const warmRent = Number(l.rentCold) + l.components.reduce((s, c) => s + Number(c.amount), 0);
    let totalBilled = 0;
    let totalPaid = 0;
    let nextDueDate: Date | null = null;
    for (const c of l.charges) {
      const chargeAmt = Number(c.amount);
      totalBilled += chargeAmt;
      const paid = c.payments.reduce((acc, p) => acc + Number(p.amount), 0);
      totalPaid += paid;
      if (chargeAmt - paid > 0.001 && (!nextDueDate || c.dueDate < nextDueDate)) {
        nextDueDate = c.dueDate;
      }
    }
    const balance = totalPaid - totalBilled;
    const openAmount = Math.max(0, totalBilled - totalPaid);

    return l.renters.map((r) => ({
      leaseId: l.id,
      unitId: l.unit.id,
      unitLabel: l.unit.label,
      buildingName: l.unit.building.name,
      personId: r.person.id,
      name: `${r.person.firstName} ${r.person.lastName}`,
      phone: r.person.phone,
      email: r.person.email,
      warmRent,
      balance,
      openAmount,
      isOverpaid: balance > 0.001,
      isDue: balance < -0.001,
      nextDueDate,
    }));
  });

  const activeLeaseByUnitId = new Map(activeLeases.map((l) => [l.unit.id, l]));

  // Area model (commercial): sub-areas + area-day billing for the selected year.
  const currentYear = now.getUTCFullYear();
  const parsedYear = Number(areaYearParam);
  const areaYear = parsedYear >= 2000 && parsedYear <= 2100 ? parsedYear : currentYear;
  const areaYears = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2];
  const areaData = property.areaModel
    ? await (async () => {
        const [allocations, propLeases, areaCosts, persons] = await Promise.all([
          prisma.areaAllocation.findMany({
            where: { tenantId: user.tenantId, propertyId: id },
            include: { lease: { include: { renters: { include: { person: true } } } }, person: true },
            orderBy: [{ outdoor: "asc" }, { from: "asc" }],
          }),
          prisma.lease.findMany({
            where: { tenantId: user.tenantId, unit: { building: { propertyId: id } } },
            include: { renters: { include: { person: true } } },
          }),
          prisma.costEntry.findMany({ where: { tenantId: user.tenantId, propertyId: id, year: areaYear } }),
          prisma.person.findMany({
            where: { tenantId: user.tenantId },
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
            select: { id: true, firstName: true, lastName: true },
          }),
        ]);
        const total = Number(property.totalArea ?? 0);
        const name = (a: (typeof allocations)[number]) =>
          a.label ||
          (a.person ? `${a.person.firstName} ${a.person.lastName}` : "") ||
          (a.lease ? a.lease.renters.map((r) => `${r.person.firstName} ${r.person.lastName}`).join(", ") : "") ||
          t("areaModel.vacancy");
        const slices = allocations.map((a) => ({
          id: a.id,
          area: Number(a.area),
          from: a.from,
          to: a.to,
          outdoor: a.outdoor,
        }));
        const stmt = buildAreaStatement(
          slices,
          total,
          areaCosts.map((c) => ({ id: c.id, amount: Number(c.amount), umlagefaehig: c.umlagefaehig })),
          new Date(Date.UTC(areaYear, 0, 1)),
          new Date(Date.UTC(areaYear, 11, 31)),
        );
        const w = areaTimeWeights(slices, total, new Date(Date.UTC(areaYear, 0, 1)), new Date(Date.UTC(areaYear, 11, 31)));
        const activePool = allocations
          .filter((a) => !a.outdoor && a.from <= now && (!a.to || a.to >= now))
          .reduce((s, a) => s + Number(a.area), 0);
        const leaseOpts = propLeases.map((l) => ({
          value: l.id,
          label: `${l.renters.map((r) => `${r.person.firstName} ${r.person.lastName}`).join(", ") || l.id}`,
        }));
        const personOpts = persons.map((pp) => ({ value: pp.id, label: `${pp.firstName} ${pp.lastName}` }));
        const nameById = new Map(allocations.map((a) => [a.id, name(a)]));
        return { allocations, total, stmt, w, activePool, leaseOpts, personOpts, nameById };
      })()
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" render={<Link href="/properties" />}>
            <ArrowLeft className="size-4" />
            {t("properties.title")}
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{property.name}</h1>
          <p className="text-sm text-muted-foreground">
            {property.street}, {property.zip} {property.city}
          </p>
          <div className="flex gap-2 pt-1">
            <Badge variant="outline">{t(`propertyType.${property.type}`)}</Badge>
            <Badge variant={property.management === "WEG" ? "secondary" : "outline"}>
              {t(`managementType.${property.management}`)}
            </Badge>
          </div>
        </div>
        <div className="flex gap-1">
          <PropertyDialog
            customDefs={customDefs}
            property={{
              id: property.id,
              name: property.name,
              street: property.street,
              zip: property.zip,
              city: property.city,
              type: property.type,
              management: property.management,
              meaTotal: property.meaTotal,
              feeType: property.feeType,
              feeValue: String(property.feeValue),
              areaModel: property.areaModel,
              totalArea: property.totalArea != null ? String(property.totalArea) : undefined,
              custom: customValues,
            }}
          />
          <DeleteButton action={deleteProperty} id={property.id} />
        </div>
      </div>

      {/* Verwalterhonorar & Active Tenant Reminders Overview */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Percent className="size-4 text-emerald-600" />
              {t("fee.title")}
            </CardTitle>
            <span className="text-xs text-muted-foreground">{t(`feeType.${property.feeType}`)}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {money(mgmtFee, locale)} <span className="text-sm font-normal text-muted-foreground">/ {t("fee.perMonth")}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              {unitCount} {t("properties.units")} · {activeLeases.length} active leases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="size-4 text-emerald-600" />
              Active Tenancies & Reminders
            </CardTitle>
            <span className="text-xs text-muted-foreground">Direct WhatsApp</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {tenantRows.length} Tenants
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Monthly rent roll: {money(monthlyRentSum, locale)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Tenants & WhatsApp Rent Reminders Table */}
      <Card className="border-emerald-500/25 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4 text-emerald-600" />
              {t("leases.tenant")} & WhatsApp Rent Reminders
            </CardTitle>
            <CardDescription>
              {tenantRows.length} active tenancies · Click to instantly open WhatsApp with pre-filled rent reminder text
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" render={<Link href="/leases" />}>
            <span>{t("leases.title")}</span>
            <ArrowUpRight className="size-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {tenantRows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t("leases.empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("leases.tenant")}</TableHead>
                  <TableHead>{t("leases.unit")}</TableHead>
                  <TableHead className="text-right">{t("leases.warmRent")}</TableHead>
                  <TableHead>{t("leases.status")}</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantRows.map((tr) => (
                  <TableRow key={`${tr.leaseId}-${tr.personId}`}>
                    <TableCell>
                      <div className="font-semibold text-sm">
                        <Link href={`/persons/${tr.personId}`} className="hover:underline">
                          {tr.name}
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 pt-0.5">
                        {tr.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="size-3 text-emerald-600" /> {tr.phone}
                          </span>
                        )}
                        {tr.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="size-3 text-muted-foreground" /> {tr.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{tr.unitLabel}</div>
                      <div className="text-xs text-muted-foreground">{tr.buildingName}</div>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {money(tr.warmRent, locale)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={tr.isOverpaid ? "default" : tr.isDue ? "destructive" : "secondary"}
                        className={
                          tr.isOverpaid
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : tr.isDue
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : ""
                        }
                      >
                        {tr.isOverpaid
                          ? `+${money(tr.balance, locale)} · In Credit`
                          : tr.isDue
                          ? `${money(tr.balance, locale)} · Due`
                          : "Settled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <WhatsAppReminderButton
                        tenantName={tr.name}
                        phoneNumber={tr.phone}
                        unitLabel={tr.unitLabel}
                        propertyName={property.name}
                        rentAmount={tr.warmRent}
                        dueDate={tr.nextDueDate ? date(tr.nextDueDate, locale) : undefined}
                        balanceDue={tr.openAmount > 0.001 ? tr.openAmount : undefined}
                        buttonText="Send Rent Reminder via WhatsApp"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {areaData && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">{t("areaModel.title")}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("areaModel.pool")}: {areaData.total.toFixed(2)} m² ·{" "}
                {t("units.occupied")}: {areaData.activePool.toFixed(2)} m² ·{" "}
                {t("areaModel.vacancy")}: {Math.max(0, areaData.total - areaData.activePool).toFixed(2)} m²{" "}
                {areaData.activePool <= areaData.total + 0.01 ? "✓" : "✗"}
              </p>
            </div>
            <AreaAllocationDialog propertyId={property.id} leases={areaData.leaseOpts} persons={areaData.personOpts} />
          </CardHeader>
          <CardContent className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("areaModel.label")}</TableHead>
                  <TableHead className="text-right">{t("areaModel.area")}</TableHead>
                  <TableHead className="text-right">{t("areaModel.pricePerSqm")}</TableHead>
                  <TableHead>{t("areaModel.period")}</TableHead>
                  <TableHead className="w-16 text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areaData.allocations.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {areaData.nameById.get(a.id)}
                      {a.outdoor && <Badge variant="outline" className="ml-2">{t("areaModel.outdoor")}</Badge>}
                    </TableCell>
                    <TableCell className="text-right">{Number(a.area).toFixed(2)} m²</TableCell>
                    <TableCell className="text-right">
                      {a.pricePerSqm != null ? money(Number(a.pricePerSqm), locale) : t("common.none")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {date(a.from, locale)} – {a.to ? date(a.to, locale) : "…"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <AreaAllocationDialog
                          propertyId={property.id}
                          leases={areaData.leaseOpts}
                          persons={areaData.personOpts}
                          allocation={{
                            id: a.id,
                            leaseId: a.leaseId,
                            personId: a.personId,
                            label: a.label,
                            area: String(a.area),
                            pricePerSqm: a.pricePerSqm != null ? String(a.pricePerSqm) : null,
                            outdoor: a.outdoor,
                            from: a.from,
                            to: a.to,
                          }}
                        />
                        <DeleteButton action={deleteAreaAllocation} id={a.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{t("areaModel.statement", { year: areaYear })}</div>
                <div className="flex gap-1">
                  {areaYears.map((y) => (
                    <Button
                      key={y}
                      size="sm"
                      variant={y === areaYear ? "default" : "outline"}
                      render={<Link href={`/properties/${property.id}?areaYear=${y}`} />}
                    >
                      {y}
                    </Button>
                  ))}
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("areaModel.label")}</TableHead>
                    <TableHead className="text-right">{t("areaModel.weight")}</TableHead>
                    <TableHead className="text-right">{t("statements.allocated")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areaData.stmt.lines.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.id === VACANCY_ID ? t("areaModel.vacancy") : areaData.nameById.get(l.id) ?? l.id}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{l.weight.toFixed(2)} m²</TableCell>
                      <TableCell className="text-right">{money(l.allocated, locale)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-medium">{t("statements.total")}</TableCell>
                    <TableCell />
                    <TableCell className="text-right font-medium">{money(areaData.stmt.totalUmlage, locale)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Property Utility Bills & Collective Expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="size-4 text-emerald-600" />
              {t("properties.utilityAndCosts")}
            </CardTitle>
            <CardDescription>{t("properties.utilitySubtitle")}</CardDescription>
          </div>
          <CostDialog propertyId={property.id} year={currentYear} />
        </CardHeader>
        <CardContent className="p-0">
          {costEntries.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t("statements.noCosts")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("fields.type")}</TableHead>
                  <TableHead>{t("statements.year")}</TableHead>
                  <TableHead>{t("statements.method")}</TableHead>
                  <TableHead>{t("statements.umlagefaehig")}</TableHead>
                  <TableHead>{t("rentComponent.note")}</TableHead>
                  <TableHead className="text-right">{t("fields.amount")}</TableHead>
                  <TableHead className="w-16 text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costEntries.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell className="font-medium">
                      {t(`costType.${cost.type}`)}
                    </TableCell>
                    <TableCell>{cost.year}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t(`allocationMethod.${cost.method}`)}</Badge>
                    </TableCell>
                    <TableCell>
                      {cost.umlagefaehig ? (
                        <span className="text-xs text-emerald-600 font-medium">{t("common.yes")}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("common.no")}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-xs truncate">
                      {cost.note || "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {money(Number(cost.amount), locale)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <DeleteButton action={deleteCost} id={cost.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Property Maintenance & Active Tickets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="size-4 text-emerald-600" />
              {t("properties.recentTickets")}
            </CardTitle>
            <CardDescription>{tickets.length} {t("tickets.title")}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" render={<Link href="/tickets" />}>
            <span>{t("common.all")}</span>
            <ArrowUpRight className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t("properties.noRecentTickets")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("fields.label")}</TableHead>
                  <TableHead>{t("units.title")}</TableHead>
                  <TableHead>{t("tickets.category")}</TableHead>
                  <TableHead>{t("tickets.priority")}</TableHead>
                  <TableHead>{t("tickets.status")}</TableHead>
                  <TableHead>{t("contractors.title")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((tkt) => (
                  <TableRow key={tkt.id}>
                    <TableCell className="font-medium">
                      <Link href="/tickets" className="hover:underline">
                        {tkt.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {tkt.unit ? tkt.unit.label : t("common.all")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{t(`ticketCategory.${tkt.category}`)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tkt.priority === "HOCH"
                            ? "destructive"
                            : tkt.priority === "MITTEL"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {t(`ticketPriority.${tkt.priority}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tkt.status === "ERLEDIGT" ? "secondary" : "outline"}>
                        {t(`ticketStatus.${tkt.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {tkt.contractor ? tkt.contractor.name : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("properties.buildings")}</h2>
        <BuildingDialog propertyId={property.id} />
      </div>

      {property.buildings.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("buildings.empty")}</p>
      ) : (
        property.buildings.map((b) => (
          <Card key={b.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{b.name}</CardTitle>
              <div className="flex items-center gap-1">
                <UnitDialog buildingId={b.id} customDefs={unitDefs} />
                <BuildingDialog propertyId={property.id} building={{ id: b.id, name: b.name }} />
                <DeleteButton action={deleteBuilding} id={b.id} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {b.units.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">{t("units.empty")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("fields.label")}</TableHead>
                      <TableHead>{t("leases.tenant")}</TableHead>
                      <TableHead>{t("fields.type")}</TableHead>
                      <TableHead className="text-right">{t("fields.area")}</TableHead>
                      <TableHead className="text-right">{t("fields.rooms")}</TableHead>
                      <TableHead className="text-right">MEA</TableHead>
                      <TableHead className="w-28 text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {b.units.map((u) => {
                      const activeL = activeLeaseByUnitId.get(u.id);
                      const firstRenter = activeL?.renters[0];
                      const warmRent = activeL
                        ? Number(activeL.rentCold) + activeL.components.reduce((s, c) => s + Number(c.amount), 0)
                        : undefined;

                      return (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">
                            <Link href={`/units/${u.id}`} className="hover:underline">
                              {u.label}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {firstRenter ? (
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/persons/${firstRenter.person.id}`}
                                  className="text-xs font-semibold hover:underline"
                                >
                                  {firstRenter.person.firstName} {firstRenter.person.lastName}
                                </Link>
                                <WhatsAppReminderButton
                                  tenantName={`${firstRenter.person.firstName} ${firstRenter.person.lastName}`}
                                  phoneNumber={firstRenter.person.phone}
                                  unitLabel={u.label}
                                  propertyName={property.name}
                                  rentAmount={warmRent}
                                  compact={true}
                                  buttonSize="icon"
                                  buttonVariant="ghost"
                                />
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">{t("leasing.vacancy")}</span>
                            )}
                          </TableCell>
                          <TableCell>{t(`unitType.${u.type}`)}</TableCell>
                          <TableCell className="text-right">{String(u.area)}</TableCell>
                          <TableCell className="text-right">
                            {u.rooms ? String(u.rooms) : t("common.none")}
                          </TableCell>
                          <TableCell className="text-right">{u.mea ?? t("common.none")}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <UnitDialog
                                buildingId={b.id}
                                customDefs={unitDefs}
                                unit={{
                                  id: u.id,
                                  label: u.label,
                                  type: u.type,
                                  area: String(u.area),
                                  rooms: u.rooms ? String(u.rooms) : undefined,
                                  mea: u.mea != null ? String(u.mea) : undefined,
                                  custom: (u.custom as Record<string, string>) ?? {},
                                }}
                              />
                              <DeleteButton action={deleteUnit} id={u.id} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

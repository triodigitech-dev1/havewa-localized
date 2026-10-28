/* eslint-disable @typescript-eslint/no-explicit-any */
// In-Memory Mock Prisma implementation for environments without reachable PostgreSQL.
// Seeded with representative demo data (matching prisma/seed.ts) so the app is fully functional out of the box.


export function createMockPrisma() {
  const now = new Date();

  // --- Seed Data ---
  const tenants: any[] = [
    {
      id: "tenant-demo-1",
      name: "Localea",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      aiProvider: null,
      aiBaseUrl: null,
      aiApiKey: null,
      aiModel: null,
      smtpHost: null,
      smtpPort: null,
      smtpUser: null,
      smtpPassword: null,
      smtpFrom: null,
      smtpSecure: false,
      brandColor: "#0F5132",
      logoKey: null,
      subdomain: "kilimani",
      customDomain: "rental.triotek.co.ke",
      isDemo: true,
    },
  ];

  // Pre-seeded users matching demo credentials (admin@localea.app / admin, mieter@localea.app / mieter, etc.)
  const users: any[] = [
    {
      id: "user-admin",
      tenantId: "tenant-demo-1",
      email: "admin@localea.app",
      name: "System Administrator",
      passwordHash: "$2b$10$yGeNbgAixnWEJ3dk0TWqqOfQSZgVy6OzDAGhqaaielXD4.pz.XHku",
      role: "ADMIN",
      locale: "en",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "user-localea-admin-alias",
      tenantId: "tenant-demo-1",
      email: "admin@localea.com",
      name: "Admin",
      passwordHash: "$2b$10$yGeNbgAixnWEJ3dk0TWqqOfQSZgVy6OzDAGhqaaielXD4.pz.XHku",
      role: "ADMIN",
      locale: "en",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "user-tenant",
      tenantId: "tenant-demo-1",
      email: "tenant@localea.app",
      name: "Jane Resident",
      passwordHash: "$2b$10$Vr2FRDINm7VUFzq.NQOTCOkDqCXOOVxwjY94O960WPaz2TP6YFW.O",
      role: "MIETER",
      locale: "en",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "user-owner",
      tenantId: "tenant-demo-1",
      email: "owner@localea.app",
      name: "Arthur Landlord",
      passwordHash: "$2b$10$QPzoOgtmbGJ5NmrBU1OCd.X72USK3bCVBi4/rkXns2Q9wZFJVS9f6",
      role: "EIGENTUEMER",
      locale: "en",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "user-mieter",
      tenantId: "tenant-demo-1",
      email: "mieter@localea.app",
      name: "Erika Mustermann",
      passwordHash: "$2b$10$Vr2FRDINm7VUFzq.NQOTCOkDqCXOOVxwjY94O960WPaz2TP6YFW.O",
      role: "MIETER",
      locale: "en",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "user-eigentuemer",
      tenantId: "tenant-demo-1",
      email: "eigentuemer@localea.app",
      name: "Klaus Eigner",
      passwordHash: "$2b$10$QPzoOgtmbGJ5NmrBU1OCd.X72USK3bCVBi4/rkXns2Q9wZFJVS9f6",
      role: "EIGENTUEMER",
      locale: "en",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
  ];

  const persons: any[] = [
    {
      id: "person-erika",
      tenantId: "tenant-demo-1",
      firstName: "Erika",
      lastName: "Mustermann",
      email: "erika@example.de",
      phone: "030 112233",
      type: "MIETER",
      note: null,
      custom: {},
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "person-max",
      tenantId: "tenant-demo-1",
      firstName: "Max",
      lastName: "Schneider",
      email: "max@example.de",
      phone: "030 1234567",
      type: "MIETER",
      note: null,
      custom: {},
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "person-klaus",
      tenantId: "tenant-demo-1",
      firstName: "Klaus",
      lastName: "Eigner",
      email: "klaus@example.de",
      phone: "089 987654",
      type: "EIGENTUEMER",
      note: null,
      custom: {},
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "person-petra",
      tenantId: "tenant-demo-1",
      firstName: "Petra",
      lastName: "Sucher",
      email: "p.sucher@example.de",
      phone: "040 1234567",
      type: "INTERESSENT",
      note: "Sucht ~300 m² Lager-/Gewerbefläche ab Q4 2026",
      custom: {},
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
  ];

  const properties: any[] = [
    {
      id: "prop-linden",
      tenantId: "tenant-demo-1",
      name: "Wohnanlage Lindenstraße",
      street: "Lindenstraße 12",
      zip: "10115",
      city: "Berlin",
      type: "WOHNEN",
      management: "MIET",
      meaTotal: 1000,
      feeType: "PAUSCHAL",
      feeValue: 0,
      custom: {},
      areaModel: false,
      totalArea: null,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "prop-parkblick",
      tenantId: "tenant-demo-1",
      name: "WEG Parkblick",
      street: "Am Park 5",
      zip: "80331",
      city: "München",
      type: "WOHNEN",
      management: "WEG",
      meaTotal: 1000,
      feeType: "PAUSCHAL",
      feeValue: 0,
      custom: {},
      areaModel: false,
      totalArea: null,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "prop-nordkai",
      tenantId: "tenant-demo-1",
      name: "Gewerbepark Nordkai",
      street: "Am Kai 7",
      zip: "20457",
      city: "Hamburg",
      type: "GEWERBE",
      management: "MIET",
      meaTotal: 1000,
      feeType: "PAUSCHAL",
      feeValue: 0,
      custom: {},
      areaModel: true,
      totalArea: 1000,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
  ];

  const buildings: any[] = [
    {
      id: "bld-1",
      tenantId: "tenant-demo-1",
      name: "Haus A",
      propertyId: "prop-linden",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "bld-2",
      tenantId: "tenant-demo-1",
      name: "Hauptgebäude",
      propertyId: "prop-parkblick",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
  ];

  const units: any[] = [
    {
      id: "unit-1",
      tenantId: "tenant-demo-1",
      label: "EG links",
      type: "WOHNUNG",
      area: 62.5,
      rooms: 2,
      mea: null,
      buildingId: "bld-1",
      custom: {},
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "unit-2",
      tenantId: "tenant-demo-1",
      label: "EG rechts",
      type: "WOHNUNG",
      area: 74.0,
      rooms: 3,
      mea: null,
      buildingId: "bld-1",
      custom: {},
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "unit-3",
      tenantId: "tenant-demo-1",
      label: "1. OG links",
      type: "WOHNUNG",
      area: 62.5,
      rooms: 2,
      mea: null,
      buildingId: "bld-1",
      custom: {},
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "unit-4",
      tenantId: "tenant-demo-1",
      label: "Stellplatz 1",
      type: "STELLPLATZ",
      area: 12.0,
      rooms: null,
      mea: null,
      buildingId: "bld-1",
      custom: {},
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "unit-5",
      tenantId: "tenant-demo-1",
      label: "Whg 1",
      type: "WOHNUNG",
      area: 88.0,
      rooms: 3,
      mea: 340,
      buildingId: "bld-2",
      custom: {},
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "unit-6",
      tenantId: "tenant-demo-1",
      label: "Whg 2",
      type: "WOHNUNG",
      area: 95.0,
      rooms: 4,
      mea: 360,
      buildingId: "bld-2",
      custom: {},
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "unit-7",
      tenantId: "tenant-demo-1",
      label: "Whg 3",
      type: "WOHNUNG",
      area: 78.0,
      rooms: 3,
      mea: 300,
      buildingId: "bld-2",
      custom: {},
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
  ];

  const leases: any[] = [
    {
      id: "lease-1",
      tenantId: "tenant-demo-1",
      unitId: "unit-1",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: null,
      rentCold: 780.0,
      personCount: 2,
      noticePeriodM: 3,
      custom: {},
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "lease-2",
      tenantId: "tenant-demo-1",
      unitId: "unit-2",
      startDate: new Date("2023-06-01T00:00:00Z"),
      endDate: null,
      rentCold: 910.0,
      personCount: 3,
      noticePeriodM: 3,
      custom: {},
      createdAt: new Date("2023-06-01T00:00:00Z"),
    },
  ];

  const renters: any[] = [
    {
      id: "renter-1",
      tenantId: "tenant-demo-1",
      personId: "person-erika",
      leaseId: "lease-1",
    },
    {
      id: "renter-2",
      tenantId: "tenant-demo-1",
      personId: "person-max",
      leaseId: "lease-2",
    },
  ];

  const rentComponents: any[] = [
    {
      id: "rc-1",
      tenantId: "tenant-demo-1",
      leaseId: "lease-1",
      type: "NEBENKOSTEN",
      amount: 120.0,
      note: null,
    },
    {
      id: "rc-2",
      tenantId: "tenant-demo-1",
      leaseId: "lease-1",
      type: "HEIZKOSTEN",
      amount: 90.0,
      note: null,
    },
    {
      id: "rc-3",
      tenantId: "tenant-demo-1",
      leaseId: "lease-2",
      type: "NEBENKOSTEN",
      amount: 150.0,
      note: null,
    },
    {
      id: "rc-4",
      tenantId: "tenant-demo-1",
      leaseId: "lease-2",
      type: "HEIZKOSTEN",
      amount: 110.0,
      note: null,
    },
  ];

  const deposits: any[] = [
    {
      id: "dep-1",
      tenantId: "tenant-demo-1",
      leaseId: "lease-1",
      type: "BAR",
      amount: 2340.0,
      accountId: null,
      interestRate: null,
      receivedDate: new Date("2024-01-05T00:00:00Z"),
      returnedDate: null,
      note: null,
    },
  ];

  const owners: any[] = [
    {
      id: "own-1",
      tenantId: "tenant-demo-1",
      personId: "person-klaus",
      unitId: "unit-5",
      share: 1000,
    },
  ];

  const meters: any[] = [
    {
      id: "m-1",
      tenantId: "tenant-demo-1",
      unitId: "unit-1",
      type: "WAERME",
      serialNo: "WAERME-1000",
      createdAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      id: "m-2",
      tenantId: "tenant-demo-1",
      unitId: "unit-1",
      type: "WASSER_WARM",
      serialNo: "WASSER_WARM-1000",
      createdAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      id: "m-3",
      tenantId: "tenant-demo-1",
      unitId: "unit-2",
      type: "WAERME",
      serialNo: "WAERME-1001",
      createdAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      id: "m-4",
      tenantId: "tenant-demo-1",
      unitId: "unit-2",
      type: "WASSER_WARM",
      serialNo: "WASSER_WARM-1001",
      createdAt: new Date("2025-01-01T00:00:00Z"),
    },
  ];

  const meterReadings: any[] = [
    {
      id: "mr-1",
      tenantId: "tenant-demo-1",
      meterId: "m-1",
      date: new Date("2025-01-01T00:00:00Z"),
      value: 1200,
      createdAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      id: "mr-2",
      tenantId: "tenant-demo-1",
      meterId: "m-1",
      date: new Date("2025-12-31T00:00:00Z"),
      value: 2100,
      createdAt: new Date("2025-12-31T00:00:00Z"),
    },
    {
      id: "mr-3",
      tenantId: "tenant-demo-1",
      meterId: "m-2",
      date: new Date("2025-01-01T00:00:00Z"),
      value: 40,
      createdAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      id: "mr-4",
      tenantId: "tenant-demo-1",
      meterId: "m-2",
      date: new Date("2025-12-31T00:00:00Z"),
      value: 70,
      createdAt: new Date("2025-12-31T00:00:00Z"),
    },
    {
      id: "mr-5",
      tenantId: "tenant-demo-1",
      meterId: "m-3",
      date: new Date("2025-01-01T00:00:00Z"),
      value: 1200,
      createdAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      id: "mr-6",
      tenantId: "tenant-demo-1",
      meterId: "m-3",
      date: new Date("2025-12-31T00:00:00Z"),
      value: 2500,
      createdAt: new Date("2025-12-31T00:00:00Z"),
    },
    {
      id: "mr-7",
      tenantId: "tenant-demo-1",
      meterId: "m-4",
      date: new Date("2025-01-01T00:00:00Z"),
      value: 40,
      createdAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      id: "mr-8",
      tenantId: "tenant-demo-1",
      meterId: "m-4",
      date: new Date("2025-12-31T00:00:00Z"),
      value: 90,
      createdAt: new Date("2025-12-31T00:00:00Z"),
    },
  ];

  const currentYear = now.getUTCFullYear();
  const costEntries: any[] = [
    { id: "c-1", tenantId: "tenant-demo-1", propertyId: "prop-linden", year: currentYear - 1, type: "HEIZUNG", amount: 8400, method: "CONSUMPTION", umlagefaehig: true, consumptionSharePct: 70, note: null, createdAt: now },
    { id: "c-2", tenantId: "tenant-demo-1", propertyId: "prop-linden", year: currentYear - 1, type: "WASSER", amount: 2100, method: "PERSONS", umlagefaehig: true, consumptionSharePct: null, note: null, createdAt: now },
    { id: "c-3", tenantId: "tenant-demo-1", propertyId: "prop-linden", year: currentYear - 1, type: "MUELL", amount: 1200, method: "UNITS", umlagefaehig: true, consumptionSharePct: null, note: null, createdAt: now },
    { id: "c-4", tenantId: "tenant-demo-1", propertyId: "prop-linden", year: currentYear - 1, type: "GRUNDSTEUER", amount: 1800, method: "AREA", umlagefaehig: true, consumptionSharePct: null, note: null, createdAt: now },
    { id: "c-5", tenantId: "tenant-demo-1", propertyId: "prop-linden", year: currentYear - 1, type: "VERSICHERUNG", amount: 1400, method: "AREA", umlagefaehig: true, consumptionSharePct: null, note: null, createdAt: now },
    { id: "c-6", tenantId: "tenant-demo-1", propertyId: "prop-linden", year: currentYear - 1, type: "HAUSWART", amount: 2400, method: "AREA", umlagefaehig: false, consumptionSharePct: null, note: null, createdAt: now },
    { id: "c-7", tenantId: "tenant-demo-1", propertyId: "prop-linden", year: currentYear, type: "HEIZUNG", amount: 8600, method: "CONSUMPTION", umlagefaehig: true, consumptionSharePct: 70, note: null, createdAt: now },
    { id: "c-8", tenantId: "tenant-demo-1", propertyId: "prop-linden", year: currentYear, type: "WASSER", amount: 2200, method: "PERSONS", umlagefaehig: true, consumptionSharePct: null, note: null, createdAt: now },
    { id: "c-9", tenantId: "tenant-demo-1", propertyId: "prop-parkblick", year: currentYear, type: "HAUSWART", amount: 6000, method: "MEA", umlagefaehig: true, consumptionSharePct: null, note: null, createdAt: now },
    { id: "c-10", tenantId: "tenant-demo-1", propertyId: "prop-parkblick", year: currentYear, type: "VERSICHERUNG", amount: 4200, method: "MEA", umlagefaehig: true, consumptionSharePct: null, note: null, createdAt: now },
    { id: "c-11", tenantId: "tenant-demo-1", propertyId: "prop-parkblick", year: currentYear, type: "GARTENPFLEGE", amount: 2400, method: "MEA", umlagefaehig: true, consumptionSharePct: null, note: null, createdAt: now },
    { id: "c-12", tenantId: "tenant-demo-1", propertyId: "prop-nordkai", year: currentYear, type: "VERSICHERUNG", amount: 6000, method: "AREA", umlagefaehig: true, consumptionSharePct: null, note: null, createdAt: now },
    { id: "c-13", tenantId: "tenant-demo-1", propertyId: "prop-nordkai", year: currentYear, type: "HAUSWART", amount: 6000, method: "AREA", umlagefaehig: true, consumptionSharePct: null, note: null, createdAt: now },
  ];

  const accounts: any[] = [
    {
      id: "acc-1",
      tenantId: "tenant-demo-1",
      name: "Mietkonto",
      type: "BANK",
      iban: "DE02120300000000202051",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "acc-2",
      tenantId: "tenant-demo-1",
      name: "Kautionskonto",
      type: "KAUTION",
      iban: "DE02120300000000202052",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
  ];

  const thisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const prevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const twoMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));

  const charges: any[] = [
    {
      id: "chg-1",
      tenantId: "tenant-demo-1",
      leaseId: "lease-1",
      areaAllocationId: null,
      type: "MIETE",
      period: prevMonth,
      dueDate: new Date(prevMonth.getTime() + 3 * 864e5),
      amount: 990.0,
      description: "Miete Vormonat",
      createdAt: prevMonth,
    },
    {
      id: "chg-2",
      tenantId: "tenant-demo-1",
      leaseId: "lease-1",
      areaAllocationId: null,
      type: "MIETE",
      period: thisMonth,
      dueDate: new Date(thisMonth.getTime() + 3 * 864e5),
      amount: 990.0,
      description: "Miete laufender Monat",
      createdAt: thisMonth,
    },
    {
      id: "chg-3",
      tenantId: "tenant-demo-1",
      leaseId: "lease-1",
      areaAllocationId: null,
      type: "NEBENKOSTEN",
      period: twoMonthsAgo,
      dueDate: new Date(twoMonthsAgo.getTime() + 15 * 864e5),
      amount: 210.0,
      description: "NK-Nachzahlung",
      createdAt: twoMonthsAgo,
    },
  ];

  const payments: any[] = [
    {
      id: "pay-1",
      tenantId: "tenant-demo-1",
      accountId: "acc-1",
      chargeId: "chg-1",
      date: new Date(prevMonth.getTime() + 2 * 864e5),
      amount: 990.0,
      direction: "EINGANG",
      reference: "Miete Vormonat",
      createdAt: prevMonth,
    },
  ];

  const dunningNotices: any[] = [
    {
      id: "dun-1",
      tenantId: "tenant-demo-1",
      chargeId: "chg-3",
      level: 1,
      date: new Date(twoMonthsAgo.getTime() + 20 * 864e5),
      fee: 5.0,
      note: "1. Mahnung",
    },
  ];

  const sepaMandates: any[] = [
    {
      id: "mnd-1",
      tenantId: "tenant-demo-1",
      personId: "person-erika",
      iban: "DE02100100100006820101",
      mandateRef: "MND-0001",
      signedDate: new Date("2024-01-10T00:00:00Z"),
      active: true,
      createdAt: new Date("2024-01-10T00:00:00Z"),
    },
  ];

  const contractors: any[] = [
    {
      id: "ctr-1",
      tenantId: "tenant-demo-1",
      name: "Sanitär Berg GmbH",
      trade: "Sanitär/Heizung",
      email: "service@berg-shk.de",
      phone: "030 555123",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
  ];

  const tickets: any[] = [
    {
      id: "tkt-1",
      tenantId: "tenant-demo-1",
      propertyId: "prop-linden",
      unitId: "unit-1",
      contractorId: "ctr-1",
      assigneeId: "user-admin",
      reporterId: "user-mieter",
      title: "Heizung wird nicht warm",
      description: "Thermostat prüfen",
      category: "SCHADEN",
      status: "IN_ARBEIT",
      priority: "HOCH",
      dueDate: new Date(now.getTime() + 2 * 864e5),
      reminderDate: null,
      timeSpentMin: 45,
      createdAt: new Date(now.getTime() - 2 * 864e5),
    },
    {
      id: "tkt-2",
      tenantId: "tenant-demo-1",
      propertyId: "prop-linden",
      unitId: null,
      contractorId: null,
      assigneeId: null,
      reporterId: null,
      title: "Treppenhauslicht defekt",
      description: "Leuchtmittel im 1. OG flackert",
      category: "STOERUNG",
      status: "OFFEN",
      priority: "MITTEL",
      dueDate: new Date(now.getTime() + 7 * 864e5),
      reminderDate: null,
      timeSpentMin: 0,
      createdAt: new Date(now.getTime() - 1 * 864e5),
    },
  ];

  const maintenanceContracts: any[] = [
    {
      id: "maint-1",
      tenantId: "tenant-demo-1",
      propertyId: "prop-linden",
      contractorId: "ctr-1",
      title: "Heizungswartung jährlich",
      intervalMonths: 12,
      nextDue: new Date(now.getTime() + 14 * 864e5),
      note: "Standardwartung gemäß Hersteller",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
  ];

  const economicPlans: any[] = [
    {
      id: "ep-1",
      tenantId: "tenant-demo-1",
      propertyId: "prop-parkblick",
      year: currentYear,
      totalAmount: 36000,
      note: `Wirtschaftsplan ${currentYear}`,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
  ];

  const reserves: any[] = [
    {
      id: "res-1",
      tenantId: "tenant-demo-1",
      propertyId: "prop-parkblick",
      name: "Erhaltungsrücklage",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
  ];

  const reserveTransactions: any[] = [
    {
      id: "rt-1",
      tenantId: "tenant-demo-1",
      reserveId: "res-1",
      date: new Date(currentYear, 0, 31),
      amount: 12000,
      note: "Zuführung Jahresanfang",
    },
    {
      id: "rt-2",
      tenantId: "tenant-demo-1",
      reserveId: "res-1",
      date: new Date(currentYear, 4, 20),
      amount: -3500,
      note: "Dachreparatur",
    },
  ];

  const meetings: any[] = [
    {
      id: "mtg-1",
      tenantId: "tenant-demo-1",
      propertyId: "prop-parkblick",
      title: `Ordentliche Eigentümerversammlung ${currentYear}`,
      date: new Date(now.getTime() + 10 * 864e5),
      location: "Gemeinschaftsraum, Am Park 5",
      status: "GEPLANT",
      protocol: null,
      createdAt: now,
    },
  ];

  const agendaItems: any[] = [
    {
      id: "ag-1",
      tenantId: "tenant-demo-1",
      meetingId: "mtg-1",
      position: 1,
      title: "Begrüßung und Feststellung der Beschlussfähigkeit",
      description: null,
    },
    {
      id: "ag-2",
      tenantId: "tenant-demo-1",
      meetingId: "mtg-1",
      position: 2,
      title: "Genehmigung der Jahresabrechnung",
      description: null,
    },
  ];

  const resolutions: any[] = [
    {
      id: "resl-1",
      tenantId: "tenant-demo-1",
      propertyId: "prop-parkblick",
      meetingId: "mtg-1",
      number: 1,
      title: "Genehmigung Jahresabrechnung",
      text: "Die Jahresabrechnung wird genehmigt.",
      date: new Date(now.getTime() + 10 * 864e5),
      result: "ANGENOMMEN",
      votesYes: 3,
      votesNo: 0,
      votesAbstain: 0,
      createdAt: now,
    },
  ];

  const appointments: any[] = [
    {
      id: "apt-1",
      tenantId: "tenant-demo-1",
      title: "Wohnungsübergabe EG rechts",
      type: "BESICHTIGUNG",
      start: new Date(now.getTime() + 2 * 864e5),
      end: new Date(now.getTime() + 2 * 864e5 + 3600000),
      location: "Lindenstraße 12",
      note: "Übergabeprotokoll mitbringen",
      propertyId: "prop-linden",
      createdAt: now,
    },
    {
      id: "apt-2",
      tenantId: "tenant-demo-1",
      title: "Eigentümerversammlung Parkblick",
      type: "VERSAMMLUNG",
      start: new Date(now.getTime() + 10 * 864e5),
      end: null,
      location: "Am Park 5",
      note: null,
      propertyId: "prop-parkblick",
      createdAt: now,
    },
  ];

  const tasks: any[] = [
    {
      id: "tsk-1",
      tenantId: "tenant-demo-1",
      title: "Nebenkostenabrechnung versenden",
      dueDate: new Date(now.getTime() + 5 * 864e5),
      done: false,
      createdAt: now,
    },
    {
      id: "tsk-2",
      tenantId: "tenant-demo-1",
      title: "Angebote Fassadensanierung einholen",
      dueDate: new Date(now.getTime() + 15 * 864e5),
      done: false,
      createdAt: now,
    },
  ];

  const documents: any[] = [
    {
      id: "doc-1",
      tenantId: "tenant-demo-1",
      propertyId: "prop-linden",
      unitId: "unit-1",
      personId: "person-erika",
      name: "Mietvertrag Mustermann.pdf",
      category: "VERTRAG",
      mime: "application/pdf",
      size: 1024,
      storageKey: "seed-vertrag.pdf",
      eInvoice: false,
      invoiceNo: null,
      invoiceTotal: null,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "doc-2",
      tenantId: "tenant-demo-1",
      propertyId: "prop-linden",
      unitId: null,
      personId: null,
      name: "Heizkostenrechnung 2025 (ZUGFeRD).xml",
      category: "ERECHNUNG",
      mime: "application/xml",
      size: 1536,
      storageKey: "seed-erechnung.xml",
      eInvoice: true,
      invoiceNo: "RE-2026-0042",
      invoiceTotal: 8400.0,
      createdAt: new Date("2026-01-14T00:00:00Z"),
    },
    {
      id: "doc-3",
      tenantId: "tenant-demo-1",
      propertyId: "prop-parkblick",
      unitId: null,
      personId: null,
      name: "Protokoll ETV 2025.pdf",
      category: "PROTOKOLL",
      mime: "application/pdf",
      size: 1024,
      storageKey: "seed-protokoll.pdf",
      eInvoice: false,
      invoiceNo: null,
      invoiceTotal: null,
      createdAt: new Date("2025-07-22T00:00:00Z"),
    },
  ];

  const emailMessages: any[] = [
    {
      id: "em-1",
      tenantId: "tenant-demo-1",
      toAddress: "erika@example.de",
      cc: null,
      bcc: null,
      subject: "Ihre Betriebskostenabrechnung",
      body: "Sehr geehrte Frau Mustermann,\nanbei Ihre Abrechnung …",
      status: "GESENDET",
      error: null,
      sentAt: new Date(now.getTime() - 864e5),
      createdAt: new Date(now.getTime() - 864e5),
    },
  ];

  const auditLogs: any[] = [
    {
      id: "log-1",
      tenantId: "tenant-demo-1",
      userId: "user-admin",
      userName: "Admin",
      action: "CREATE",
      entity: "Property",
      entityId: "prop-linden",
      summary: "Wohnanlage Lindenstraße angelegt",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
  ];

  const areaAllocations: any[] = [
    {
      id: "area-1",
      tenantId: "tenant-demo-1",
      propertyId: "prop-nordkai",
      leaseId: null,
      personId: null,
      label: "Logistik A GmbH",
      area: 300,
      pricePerSqm: 7.5,
      outdoor: false,
      from: new Date("2026-01-01T00:00:00Z"),
      to: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
    },
    {
      id: "area-2",
      tenantId: "tenant-demo-1",
      propertyId: "prop-nordkai",
      leaseId: null,
      personId: null,
      label: "TechStart UG",
      area: 200,
      pricePerSqm: 9,
      outdoor: false,
      from: new Date("2026-07-01T00:00:00Z"),
      to: null,
      createdAt: new Date("2026-07-01T00:00:00Z"),
    },
    {
      id: "area-3",
      tenantId: "tenant-demo-1",
      propertyId: "prop-nordkai",
      leaseId: null,
      personId: null,
      label: "Lager C (befristet)",
      area: 150,
      pricePerSqm: 6,
      outdoor: false,
      from: new Date("2026-01-01T00:00:00Z"),
      to: new Date("2026-09-30T00:00:00Z"),
      createdAt: new Date("2026-01-01T00:00:00Z"),
    },
    {
      id: "area-4",
      tenantId: "tenant-demo-1",
      propertyId: "prop-nordkai",
      leaseId: null,
      personId: null,
      label: "Außenstellplätze",
      area: 40,
      pricePerSqm: 5,
      outdoor: true,
      from: new Date("2026-01-01T00:00:00Z"),
      to: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
    },
  ];

  const insurances: any[] = [
    {
      id: "ins-1",
      tenantId: "tenant-demo-1",
      propertyId: "prop-linden",
      type: "GEBAEUDE",
      insurer: "Allianz",
      policyNo: "POL-99212",
      premium: 1400.0,
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: null,
      note: null,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
  ];

  const propertyTaxes: any[] = [
    {
      id: "ptax-1",
      tenantId: "tenant-demo-1",
      propertyId: "prop-linden",
      aktenzeichen: "12/345/67890",
      grundsteuerwert: 380000.0,
      messbetrag: 117.8,
      hebesatz: 550.0,
      note: "Grundsteuer B",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
  ];

  const customFieldDefs: any[] = [];
  const notifications: any[] = [];
  const apiTokens: any[] = [];
  const templates: any[] = [
    {
      id: "tmpl-1",
      tenantId: "tenant-demo-1",
      category: "ANSCHREIBEN",
      name: "Willkommensschreiben",
      subject: "Willkommen in Ihrem neuen Zuhause",
      body: "Guten Tag {{mieter.name}},\nherzlich willkommen in der Liegenschaft {{objekt.name}}!",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
  ];

  // Collection map: Prisma model name (lowercase) -> table array
  const tables: Record<string, any[]> = {
    tenant: tenants,
    user: users,
    person: persons,
    property: properties,
    building: buildings,
    unit: units,
    lease: leases,
    renter: renters,
    rentcomponent: rentComponents,
    deposit: deposits,
    owner: owners,
    meter: meters,
    meterreading: meterReadings,
    costentry: costEntries,
    account: accounts,
    charge: charges,
    payment: payments,
    dunningnotice: dunningNotices,
    sepamandate: sepaMandates,
    contractor: contractors,
    ticket: tickets,
    maintenancecontract: maintenanceContracts,
    economicplan: economicPlans,
    reserve: reserves,
    reservetransaction: reserveTransactions,
    meeting: meetings,
    agendaitem: agendaItems,
    resolution: resolutions,
    appointment: appointments,
    task: tasks,
    document: documents,
    emailmessage: emailMessages,
    auditlog: auditLogs,
    areaallocation: areaAllocations,
    insurance: insurances,
    propertytax: propertyTaxes,
    customfielddef: customFieldDefs,
    notification: notifications,
    apitoken: apiTokens,
    template: templates,
  };

  function getTable(modelName: string): any[] {
    const key = modelName.toLowerCase();
    if (!tables[key]) tables[key] = [];
    return tables[key];
  }

  // --- Filtering Engine ---
  function matchFilter(item: any, filter: any, modelName: string): boolean {
    if (!filter) return true;
    for (const [key, val] of Object.entries(filter)) {
      if (key === "OR" && Array.isArray(val)) {
        if (!val.some((cond) => matchFilter(item, cond, modelName))) return false;
        continue;
      }
      if (key === "AND" && Array.isArray(val)) {
        if (!val.every((cond) => matchFilter(item, cond, modelName))) return false;
        continue;
      }
      if (key === "NOT") {
        if (Array.isArray(val)) {
          if (val.some((cond) => matchFilter(item, cond, modelName))) return false;
        } else if (matchFilter(item, val, modelName)) {
          return false;
        }
        continue;
      }

      const itemVal = item[key];

      if (val === null || val === undefined) {
        if (itemVal !== null && itemVal !== undefined) return false;
        continue;
      }

      if (typeof val === "object" && !(val instanceof Date)) {
        const v = val as any;
        // Operators object, e.g. { gte: ..., lte: ..., not: ..., in: ..., contains: ... }
        if ("not" in v) {
          if (itemVal === v.not) return false;
        }
        if ("in" in v && Array.isArray(v.in)) {
          if (!v.in.includes(itemVal)) return false;
        }
        if ("notIn" in v && Array.isArray(v.notIn)) {
          if (v.notIn.includes(itemVal)) return false;
        }
        if ("equals" in v) {
          if (itemVal !== v.equals) return false;
        }
        if ("contains" in v) {
          const str = String(itemVal ?? "");
          const sub = String(v.contains ?? "");
          const mode = v.mode === "insensitive" ? "i" : "";
          if (mode === "i") {
            if (!str.toLowerCase().includes(sub.toLowerCase())) return false;
          } else {
            if (!str.includes(sub)) return false;
          }
        }
        if ("gt" in v) {
          const a = itemVal instanceof Date ? itemVal.getTime() : itemVal;
          const b = v.gt instanceof Date ? v.gt.getTime() : v.gt;
          if (!(a > b)) return false;
        }
        if ("gte" in v) {
          const a = itemVal instanceof Date ? itemVal.getTime() : itemVal;
          const b = v.gte instanceof Date ? v.gte.getTime() : v.gte;
          if (!(a >= b)) return false;
        }
        if ("lt" in v) {
          const a = itemVal instanceof Date ? itemVal.getTime() : itemVal;
          const b = v.lt instanceof Date ? v.lt.getTime() : v.lt;
          if (!(a < b)) return false;
        }
        if ("lte" in v) {
          const a = itemVal instanceof Date ? itemVal.getTime() : itemVal;
          const b = v.lte instanceof Date ? v.lte.getTime() : v.lte;
          if (!(a <= b)) return false;
        }

        // Relation filter, e.g. building: { propertyId: ... } or unit: { building: { propertyId: ... } }
        // or renters: { some: { person: ... } }
        if ("some" in v) {
          const related = resolveRelation(item, key, modelName);
          if (!Array.isArray(related) || !related.some((r) => matchFilter(r, v.some, key))) return false;
        } else if ("none" in v) {
          const related = resolveRelation(item, key, modelName);
          if (Array.isArray(related) && related.some((r) => matchFilter(r, v.none, key))) return false;
        } else if (!("gt" in v || "gte" in v || "lt" in v || "lte" in v || "contains" in v || "in" in v || "notIn" in v || "not" in v || "equals" in v)) {
          // Nested relation object
          const related = resolveRelation(item, key, modelName);
          if (!related || !matchFilter(related, v, key)) return false;
        }
        continue;
      }

      // Exact match
      if (val instanceof Date) {
        const itemDate = itemVal instanceof Date ? itemVal.getTime() : new Date(itemVal).getTime();
        if (itemDate !== val.getTime()) return false;
      } else if (itemVal !== val) {
        return false;
      }
    }
    return true;
  }

  // --- Relation Resolution ---
  function resolveRelation(item: any, relName: string, fromModel: string): any {
    const rawFrom = fromModel.toLowerCase();
    const from = rawFrom.endsWith("ies")
      ? rawFrom.slice(0, -3) + "y"
      : rawFrom.endsWith("s") && !rawFrom.endsWith("ss")
      ? rawFrom.slice(0, -1)
      : rawFrom;
    const rel = relName.toLowerCase();

    if (rel === "tenant") return getTable("tenant").find((t) => t.id === item.tenantId);
    if (rel === "property") {
      if (item.propertyId) return getTable("property").find((p) => p.id === item.propertyId);
      if (from === "unit") {
        const bld = getTable("building").find((b) => b.id === item.buildingId);
        return bld ? getTable("property").find((p) => p.id === bld.propertyId) : null;
      }
      return null;
    }
    if (rel === "building") return getTable("building").find((b) => b.id === item.buildingId);
    if (rel === "buildings") return getTable("building").filter((b) => b.propertyId === item.id);
    if (rel === "unit") return getTable("unit").find((u) => u.id === item.unitId);
    if (rel === "units") {
      if (from === "building") return getTable("unit").filter((u) => u.buildingId === item.id);
      if (from === "property") {
        const bldIds = getTable("building").filter((b) => b.propertyId === item.id).map((b) => b.id);
        return getTable("unit").filter((u) => bldIds.includes(u.buildingId));
      }
      return [];
    }
    if (rel === "lease") return getTable("lease").find((l) => l.id === item.leaseId);
    if (rel === "leases") return getTable("lease").filter((l) => l.unitId === item.id);
    if (rel === "renter" || rel === "renters") return getTable("renter").filter((r) => r.leaseId === item.id);
    if (rel === "person") return getTable("person").find((p) => p.id === item.personId);
    if (rel === "persons") return getTable("person").filter((p) => p.tenantId === item.id);
    if (rel === "user" || rel === "assignee" || rel === "reporter") {
      const uid = rel === "assignee" ? item.assigneeId : rel === "reporter" ? item.reporterId : item.userId;
      return getTable("user").find((u) => u.id === uid);
    }
    if (rel === "components") return getTable("rentcomponent").filter((c) => c.leaseId === item.id);
    if (rel === "deposit") return getTable("deposit").find((d) => d.leaseId === item.id);
    if (rel === "adjustments") return [];
    if (rel === "account") return getTable("account").find((a) => a.id === item.accountId);
    if (rel === "charge") return getTable("charge").find((c) => c.id === item.chargeId);
    if (rel === "charges") return getTable("charge").filter((c) => c.leaseId === item.id || c.areaAllocationId === item.id);
    if (rel === "payments") return getTable("payment").filter((p) => p.chargeId === item.id);
    if (rel === "dunnings") return getTable("dunningnotice").filter((d) => d.chargeId === item.id);
    if (rel === "contractor") return getTable("contractor").find((c) => c.id === item.contractorId);
    if (rel === "tickets") return getTable("ticket").filter((t) => t.propertyId === item.id || t.unitId === item.id);
    if (rel === "meters") return getTable("meter").filter((m) => m.unitId === item.id);
    if (rel === "readings") return getTable("meterreading").filter((r) => r.meterId === item.id);
    if (rel === "costentries") return getTable("costentry").filter((c) => c.propertyId === item.id);
    if (rel === "agendaitems") return getTable("agendaitem").filter((a) => a.meetingId === item.id);
    if (rel === "resolutions") return getTable("resolution").filter((r) => r.propertyId === item.id || r.meetingId === item.id);
    if (rel === "meetings") return getTable("meeting").filter((m) => m.propertyId === item.id);
    if (rel === "economicplans") return getTable("economicplan").filter((e) => e.propertyId === item.id);
    if (rel === "reserves") return getTable("reserve").filter((r) => r.propertyId === item.id);
    if (rel === "transactions") return getTable("reservetransaction").filter((t) => t.reserveId === item.id);
    if (rel === "areaallocations") return getTable("areaallocation").filter((a) => a.propertyId === item.id);
    if (rel === "propertytax") return getTable("propertytax").find((t) => t.propertyId === item.id);
    if (rel === "insurances") return getTable("insurance").filter((i) => i.propertyId === item.id);
    if (rel === "documents") return getTable("document").filter((d) => d.propertyId === item.id || d.unitId === item.id);
    if (rel === "attachments") return getTable("emailmessage").filter((e) => e.id === item.emailId);
    if (rel === "owners") return getTable("owner").filter((o) => o.personId === item.id || o.unitId === item.id);

    return null;
  }

  // --- Population (include / select) ---
  function populateItem(item: any, args: any, modelName: string): any {
    if (!item) return null;
    if (Array.isArray(item)) {
      return item.map((it) => populateItem(it, args, modelName));
    }
    const res = { ...item };

    if (args?.include) {
      for (const [relKey, relConfig] of Object.entries(args.include)) {
        if (!relConfig) continue;
        if (relKey === "_count") {
          const selectObj = (relConfig as any)?.select || {};
          res._count = {};
          for (const countKey of Object.keys(selectObj)) {
            const relData = resolveRelation(item, countKey, modelName);
            res._count[countKey] = Array.isArray(relData) ? relData.length : 0;
          }
          continue;
        }

        let related = resolveRelation(item, relKey, modelName);
        if (Array.isArray(related)) {
          // If relConfig is an object with where/orderBy/include
          if (typeof relConfig === "object" && relConfig !== null) {
            if ((relConfig as any).where) {
              related = related.filter((r) => matchFilter(r, (relConfig as any).where, relKey));
            }
            if ((relConfig as any).orderBy) {
              sortItems(related, (relConfig as any).orderBy);
            }
            if ((relConfig as any).take) {
              related = related.slice(0, (relConfig as any).take);
            }
            related = related.map((r: any) => populateItem(r, relConfig, relKey));
          }
          res[relKey] = related;
        } else if (related && typeof relConfig === "object") {
          res[relKey] = populateItem(related, relConfig, relKey);
        } else {
          res[relKey] = related;
        }
      }
    }

    if (args?.select) {
      const selected: any = {};
      for (const [key, sel] of Object.entries(args.select)) {
        if (!sel) continue;
        if (key === "_count") {
          const selectObj = (sel as any)?.select || {};
          selected._count = {};
          for (const countKey of Object.keys(selectObj)) {
            const relData = resolveRelation(item, countKey, modelName);
            selected._count[countKey] = Array.isArray(relData) ? relData.length : 0;
          }
        } else if (key in res) {
          if (typeof sel === "object" && sel !== null && res[key] !== null && res[key] !== undefined) {
            selected[key] = populateItem(res[key], sel, key);
          } else {
            selected[key] = res[key];
          }
        } else {
          // Might be relation
          let related = resolveRelation(item, key, modelName);
          if (Array.isArray(related)) {
            if (typeof sel === "object" && sel !== null) {
              if ((sel as any).where) {
                related = related.filter((r) => matchFilter(r, (sel as any).where, key));
              }
              if ((sel as any).orderBy) {
                sortItems(related, (sel as any).orderBy);
              }
              if ((sel as any).take) {
                related = related.slice(0, (sel as any).take);
              }
              related = related.map((r: any) => populateItem(r, sel, key));
            }
            selected[key] = related;
          } else if (related && typeof sel === "object") {
            selected[key] = populateItem(related, sel, key);
          } else {
            selected[key] = related;
          }
        }
      }
      return selected;
    }

    return res;
  }

  function sortItems(list: any[], orderBy: any) {
    if (!orderBy) return;
    const orders = Array.isArray(orderBy) ? orderBy : [orderBy];
    list.sort((a, b) => {
      for (const ord of orders) {
        for (const [k, dir] of Object.entries(ord)) {
          const va = a[k] instanceof Date ? a[k].getTime() : a[k];
          const vb = b[k] instanceof Date ? b[k].getTime() : b[k];
          if (va < vb) return dir === "desc" ? 1 : -1;
          if (va > vb) return dir === "desc" ? -1 : 1;
        }
      }
      return 0;
    });
  }

  // --- Generic Model Handler ---
  function createModelProxy(modelName: string) {
    return {
      findMany: async (args?: any) => {
        let list = [...getTable(modelName)];
        if (args?.where) list = list.filter((it) => matchFilter(it, args.where, modelName));
        if (args?.orderBy) sortItems(list, args.orderBy);
        if (args?.skip) list = list.slice(args.skip);
        if (args?.take) list = list.slice(0, args.take);
        return list.map((it) => populateItem(it, args, modelName));
      },

      findFirst: async (args?: any) => {
        let list = [...getTable(modelName)];
        if (args?.where) list = list.filter((it) => matchFilter(it, args.where, modelName));
        if (args?.orderBy) sortItems(list, args.orderBy);
        const item = list[0] ?? null;
        return item ? populateItem(item, args, modelName) : null;
      },

      findUnique: async (args?: any) => {
        let list = [...getTable(modelName)];
        if (args?.where) list = list.filter((it) => matchFilter(it, args.where, modelName));
        const item = list[0] ?? null;
        return item ? populateItem(item, args, modelName) : null;
      },

      count: async (args?: any) => {
        let list = [...getTable(modelName)];
        if (args?.where) list = list.filter((it) => matchFilter(it, args.where, modelName));
        return list.length;
      },

      create: async (args: any) => {
        const id = args.data?.id || `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const newItem = {
          id,
          createdAt: new Date(),
          ...args.data,
        };

        // Handle nested users creation when tenant is created (e.g., during setupSystem)
        if (modelName === "tenant" && args.data?.users?.create) {
          const u = args.data.users.create;
          const uId = u.id || `user_${Date.now()}`;
          const normalizedEmail = String(u.email || "").toLowerCase().trim();
          getTable("user").push({
            id: uId,
            tenantId: id,
            email: normalizedEmail,
            name: u.name,
            passwordHash: u.passwordHash,
            role: u.role || "ADMIN",
            locale: u.locale || "en",
            createdAt: new Date(),
          });
          delete newItem.users;

          // Re-link sample properties and units to this new tenant
          for (const prop of getTable("property")) {
            prop.tenantId = id;
          }
          for (const bld of getTable("building")) {
            bld.tenantId = id;
          }
          for (const unt of getTable("unit")) {
            unt.tenantId = id;
          }
          for (const lse of getTable("lease")) {
            lse.tenantId = id;
          }
        }

        if (modelName === "user" && newItem.email) {
          newItem.email = String(newItem.email).toLowerCase().trim();
        }

        getTable(modelName).push(newItem);
        return populateItem(newItem, args, modelName);
      },

      createMany: async (args: any) => {
        const items = Array.isArray(args.data) ? args.data : [args.data];
        let count = 0;
        for (const item of items) {
          const id = item.id || `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          getTable(modelName).push({ id, createdAt: new Date(), ...item });
          count++;
        }
        return { count };
      },

      update: async (args: any) => {
        const table = getTable(modelName);
        const idx = table.findIndex((it) => matchFilter(it, args.where, modelName));
        if (idx >= 0) {
          table[idx] = { ...table[idx], ...args.data };
          return populateItem(table[idx], args, modelName);
        }
        return null;
      },

      updateMany: async (args: any) => {
        const table = getTable(modelName);
        let count = 0;
        for (let i = 0; i < table.length; i++) {
          if (matchFilter(table[i], args.where, modelName)) {
            table[i] = { ...table[i], ...args.data };
            count++;
          }
        }
        return { count };
      },

      delete: async (args: any) => {
        const table = getTable(modelName);
        const idx = table.findIndex((it) => matchFilter(it, args.where, modelName));
        if (idx >= 0) {
          const deleted = table.splice(idx, 1)[0];
          return deleted;
        }
        return {};
      },

      deleteMany: async (args: any) => {
        const table = getTable(modelName);
        const before = table.length;
        const remaining = table.filter((it) => !matchFilter(it, args.where, modelName));
        tables[modelName.toLowerCase()] = remaining;
        return { count: before - remaining.length };
      },

      upsert: async (args: any) => {
        const table = getTable(modelName);
        const idx = table.findIndex((it) => matchFilter(it, args.where, modelName));
        if (idx >= 0) {
          table[idx] = { ...table[idx], ...args.update };
          return populateItem(table[idx], args, modelName);
        }
        const id = args.create?.id || `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const newItem = { id, createdAt: new Date(), ...args.create };
        table.push(newItem);
        return populateItem(newItem, args, modelName);
      },

      aggregate: async (_args?: any) => {
        return { _count: { _all: getTable(modelName).length } };
      },
    };
  }

  // --- Dynamic Model Proxy ---
  return new Proxy(
    {
      $connect: async () => {},
      $disconnect: async () => {},
      $transaction: async (arg: any) => {
        if (typeof arg === "function") {
          return await arg(createMockPrisma());
        }
        if (Array.isArray(arg)) {
          return Promise.all(arg);
        }
        return arg;
      },
      $queryRaw: async () => [],
      $executeRaw: async () => 0,
    },
    {
      get(target: any, prop: string) {
        if (prop in target) return target[prop];
        return createModelProxy(prop);
      },
    }
  );
}

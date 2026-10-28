import { authenticateBearer, Principal } from "@/lib/api-auth";
import * as data from "@/lib/api-data";
import { listEntities, apiCreate, apiUpdate, apiDelete } from "@/lib/api-write";
import { listOperations, runOperation, OPERATION_NAMES } from "@/lib/api-ops";

// MCP Server (Model Context Protocol) via Streamable HTTP / JSON-RPC.
// Auth: Bearer Token (personal API token). The agent (Claude, ChatGPT,
// Cursor, etc.) specifies "Authorization: Bearer <token>".
// Stateless: each POST request is self-contained, returned as application/json.

const PROTOCOL = "2024-11-05";

type ToolDef = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  run: (p: Principal, args: Record<string, unknown>) => Promise<unknown>;
};

const str = { type: "string" };
const rec = { type: "object", additionalProperties: true };
const entityEnum = {
  type: "string",
  enum: [
    "property", "building", "unit", "person", "lease", "rentComponent",
    "deposit", "charge", "payment", "meter", "meterReading", "meeting",
    "agendaItem", "resolution", "economicPlan", "reserve", "reserveTransaction",
    "appointment", "task", "contractor", "maintenanceContract", "insurance",
    "propertyTax", "template", "customFieldDef", "user",
  ],
};

function obj(properties: Record<string, unknown>, required: string[] = []) {
  return { type: "object", properties, required };
}

const TOOLS: ToolDef[] = [
  {
    name: "list_properties",
    description: "List all properties belonging to the current organization/tenant.",
    inputSchema: obj({}),
    run: (p) => data.listProperties(p.tenantId),
  },
  {
    name: "get_property",
    description: "Retrieve a property with its buildings and units (detailed overview).",
    inputSchema: obj({ id: str }, ["id"]),
    run: (p, a) => data.getProperty(p.tenantId, String(a.id)),
  },
  {
    name: "list_units",
    description: "List all units (apartments, commercial spaces, parking, storage) with property, area, and rooms.",
    inputSchema: obj({}),
    run: (p) => data.listUnits(p.tenantId),
  },
  {
    name: "list_persons",
    description: "List all people/contacts (tenants, owners, prospects, contractors, brokers, banks).",
    inputSchema: obj({}),
    run: (p) => data.listPersons(p.tenantId),
  },
  {
    name: "list_leases",
    description: "List all rental leases with property, unit, tenant, base rent, and terms.",
    inputSchema: obj({}),
    run: (p) => data.listLeases(p.tenantId),
  },
  {
    name: "list_tickets",
    description: "List all maintenance and repair tickets with status, priority, and assigned parties.",
    inputSchema: obj({}),
    run: (p) => data.listTickets(p.tenantId),
  },
  {
    name: "list_open_items",
    description: "List outstanding overdue charges with balance, due date, and dunning status.",
    inputSchema: obj({}),
    run: (p) => data.listOpenItems(p.tenantId),
  },
  {
    name: "list_owners",
    description: "List all unit ownership shares and owner assignments.",
    inputSchema: obj({}),
    run: (p) => data.listOwners(p.tenantId),
  },
  {
    name: "list_meters",
    description: "List all meters (electricity, water, gas, heating) with unit, property, and latest reading.",
    inputSchema: obj({}),
    run: (p) => data.listMeters(p.tenantId),
  },
  {
    name: "list_accounts",
    description: "List all financial accounts (operating bank, deposit escrow, reserve fund) with balances.",
    inputSchema: obj({}),
    run: (p) => data.listAccounts(p.tenantId),
  },
  {
    name: "list_charges",
    description: "List all rent charges and receivables with due dates and payment status.",
    inputSchema: obj({}),
    run: (p) => data.listCharges(p.tenantId),
  },
  {
    name: "list_payments",
    description: "List all incoming and outgoing payments with amounts, dates, and references.",
    inputSchema: obj({}),
    run: (p) => data.listPayments(p.tenantId),
  },
  {
    name: "list_documents",
    description: "List all documents (leases, invoices, protocols, statements) with categories.",
    inputSchema: obj({}),
    run: (p) => data.listDocuments(p.tenantId),
  },
  {
    name: "list_meetings",
    description: "List all owner meetings with date, status, location, agenda items, and resolutions.",
    inputSchema: obj({}),
    run: (p) => data.listMeetings(p.tenantId),
  },
  {
    name: "list_resolutions",
    description: "List book of resolutions: all HOA resolutions per property with resolution number and votes.",
    inputSchema: obj({}),
    run: (p) => data.listResolutions(p.tenantId),
  },
  {
    name: "list_economic_plans",
    description: "List annual HOA economic plans per property/year with total and monthly assessments.",
    inputSchema: obj({}),
    run: (p) => data.listEconomicPlans(p.tenantId),
  },
  {
    name: "list_reserves",
    description: "List reserve funds per property with current balance and transactions.",
    inputSchema: obj({}),
    run: (p) => data.listReserves(p.tenantId),
  },
  {
    name: "list_appointments",
    description: "List all calendar appointments (viewings, meetings, maintenance, deadlines) with dates and locations.",
    inputSchema: obj({}),
    run: (p) => data.listAppointments(p.tenantId),
  },
  {
    name: "list_tasks",
    description: "List all tasks and reminders with due dates and completion status.",
    inputSchema: obj({}),
    run: (p) => data.listTasks(p.tenantId),
  },
  {
    name: "list_contractors",
    description: "List all contractors and service providers with trade and contact details.",
    inputSchema: obj({}),
    run: (p) => data.listContractors(p.tenantId),
  },
  {
    name: "list_maintenance_contracts",
    description: "List all recurring maintenance contracts with service interval, next due date, and vendor.",
    inputSchema: obj({}),
    run: (p) => data.listMaintenanceContracts(p.tenantId),
  },
  {
    name: "list_insurances",
    description: "List all insurance policies per property with policy type, carrier, and annual premium.",
    inputSchema: obj({}),
    run: (p) => data.listInsurances(p.tenantId),
  },
  {
    name: "list_property_taxes",
    description: "List property tax assessments per property.",
    inputSchema: obj({}),
    run: (p) => data.listPropertyTaxes(p.tenantId),
  },
  {
    name: "create_task",
    description: "Create a new task / reminder. dueDate optional formatted as YYYY-MM-DD.",
    inputSchema: obj({ title: str, dueDate: str }, ["title"]),
    run: (p, a) => data.createTask(p.tenantId, { title: String(a.title), dueDate: a.dueDate ? String(a.dueDate) : undefined }),
  },
  {
    name: "list_entities",
    description:
      "Schema discovery: all writable entities with their fields and relations. Call first to inspect exact field schemas.",
    inputSchema: obj({}),
    run: async () => listEntities(),
  },
  {
    name: "create_record",
    description:
      "Create any entity record (property, unit, person, lease, charge, payment, meeting, resolution, insurance, etc.).",
    inputSchema: obj({ entity: entityEnum, data: rec }, ["entity", "data"]),
    run: (p, a) => apiCreate(p, String(a.entity), (a.data as Record<string, unknown>) ?? {}),
  },
  {
    name: "update_record",
    description: "Update an existing entity record. entity + id + data fields to modify.",
    inputSchema: obj({ entity: entityEnum, id: str, data: rec }, ["entity", "id", "data"]),
    run: (p, a) => apiUpdate(p, String(a.entity), String(a.id), (a.data as Record<string, unknown>) ?? {}),
  },
  {
    name: "delete_record",
    description: "Delete an entity record by ID. Scoped strictly to the tenant.",
    inputSchema: obj({ entity: entityEnum, id: str }, ["entity", "id"]),
    run: (p, a) => apiDelete(p, String(a.entity), String(a.id)),
  },
  {
    name: "list_operations",
    description:
      "Available workflow operations: charge generation run, dunning run, apply rent adjustment, advance maintenance, etc.",
    inputSchema: obj({}),
    run: async () => listOperations(),
  },
  {
    name: "run_operation",
    description:
      "Execute a named workflow operation. operation = name from list_operations, args = parameters object.",
    inputSchema: obj({ operation: { type: "string", enum: OPERATION_NAMES }, args: rec }, ["operation"]),
    run: (p, a) => runOperation(p, String(a.operation), (a.args as Record<string, unknown>) ?? {}),
  },
  {
    name: "create_ticket",
    description: "Create a new maintenance / repair ticket.",
    inputSchema: obj(
      { title: str, description: str, propertyId: str, priority: { type: "string", enum: ["NIEDRIG", "MITTEL", "HOCH"] } },
      ["title"],
    ),
    run: (p, a) =>
      data.createTicket(p.tenantId, {
        title: String(a.title),
        description: a.description ? String(a.description) : undefined,
        propertyId: a.propertyId ? String(a.propertyId) : undefined,
        priority: a.priority ? String(a.priority) : undefined,
      }),
  },
  {
    name: "create_person",
    description: "Create a new contact / person record.",
    inputSchema: obj(
      { firstName: str, lastName: str, email: str, phone: str, type: str },
      ["firstName", "lastName"],
    ),
    run: (p, a) =>
      data.createPerson(p.tenantId, {
        firstName: String(a.firstName),
        lastName: String(a.lastName),
        email: a.email ? String(a.email) : undefined,
        phone: a.phone ? String(a.phone) : undefined,
        type: a.type ? String(a.type) : undefined,
      }),
  },
];

const rpc = (id: unknown, result: unknown) => Response.json({ jsonrpc: "2.0", id, result });
const rpcError = (id: unknown, code: number, message: string) =>
  Response.json({ jsonrpc: "2.0", id, error: { code, message } });

export async function POST(req: Request) {
  const principal = await authenticateBearer(req);
  if (!principal) {
    return Response.json(
      { jsonrpc: "2.0", id: null, error: { code: -32001, message: "Unauthorized" } },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || body.jsonrpc !== "2.0") return rpcError(null, -32600, "Invalid Request");
  const { id, method, params } = body;

  // Notifications (no response expected)
  if (typeof method === "string" && method.startsWith("notifications/")) {
    return new Response(null, { status: 202 });
  }

  switch (method) {
    case "initialize":
      return rpc(id, {
        protocolVersion: params?.protocolVersion ?? PROTOCOL,
        capabilities: { tools: {} },
        serverInfo: { name: "Localea", version: "1.0.0" },
      });
    case "ping":
      return rpc(id, {});
    case "tools/list":
      return rpc(id, {
        tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
      });
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${params?.name}`);
      try {
        const result = await tool.run(principal, params?.arguments ?? {});
        return rpc(id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] });
      } catch (e) {
        return rpc(id, {
          content: [{ type: "text", text: `Error: ${e instanceof Error ? e.message : "unknown error"}` }],
          isError: true,
        });
      }
    }
    default:
      return rpcError(id, -32601, `Method not supported: ${method}`);
  }
}

// Clients checking GET (SSE stream)
export function GET() {
  return new Response("MCP: please use POST with JSON-RPC.", { status: 405 });
}

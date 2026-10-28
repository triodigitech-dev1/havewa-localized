// OpenAPI 3.1 description of the Localea Rental Management REST API. Public reference.

const listOp = (tag: string, summary: string) => ({
  tags: [tag],
  summary,
  security: [{ bearerAuth: [] }],
  responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } },
});

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Localea API",
    version: "1.0.0",
    description:
      "REST API for Localea Rental Management. Authentication via Bearer token " +
      "(personal access token from settings). All data is scoped to the tenant.",
  },
  servers: [{ url: "/" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", description: "Personal API token (Settings → API & Integration Tokens)" },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/api/v1/me": {
      get: { tags: ["General"], summary: "Current user profile & portfolio metrics", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } } },
    },
    "/api/v1/properties": { get: listOp("Properties", "List all properties") },
    "/api/v1/properties/{id}": {
      get: {
        tags: ["Properties"],
        summary: "Retrieve property details with buildings and units",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
    },
    "/api/v1/units": { get: listOp("Units", "List all units") },
    "/api/v1/meters": { get: listOp("Units", "List meters with latest readings") },
    "/api/v1/owners": { get: listOp("Units", "List unit owner associations") },
    "/api/v1/leases": { get: listOp("Leases", "List rental leases") },
    "/api/v1/open-items": { get: listOp("Finances", "List open overdue balances") },
    "/api/v1/accounts": { get: listOp("Finances", "List financial accounts with balances") },
    "/api/v1/charges": { get: listOp("Finances", "List posted charges") },
    "/api/v1/payments": { get: listOp("Finances", "List payment transactions") },
    "/api/v1/documents": { get: listOp("Documents", "List stored documents") },
    "/api/v1/meetings": { get: listOp("Meetings", "List HOA owner meetings") },
    "/api/v1/resolutions": { get: listOp("Meetings", "List book of resolutions") },
    "/api/v1/economic-plans": { get: listOp("HOA", "List annual economic plans") },
    "/api/v1/reserves": { get: listOp("HOA", "List reserve funds with balances") },
    "/api/v1/appointments": { get: listOp("Calendar", "List scheduled calendar appointments") },
    "/api/v1/contractors": { get: listOp("Maintenance", "List maintenance contractors and trades") },
    "/api/v1/maintenance-contracts": { get: listOp("Maintenance", "List recurring maintenance contracts") },
    "/api/v1/insurances": { get: listOp("Policies", "List property insurance policies") },
    "/api/v1/property-taxes": { get: listOp("Policies", "List property tax assessments") },
    "/api/v1/operations": {
      get: {
        tags: ["Operations"],
        summary: "Available workflow operations (beyond CRUD)",
        description:
          "Rent roll charge run, dunning run, apply rent adjustment, advance maintenance, time logging, " +
          "camt.053 bank statement import, outbox email sending, document upload. " +
          "Execute via POST /api/v1/operations/{name} with parameters in request body.",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } },
      },
    },
    "/api/v1/operations/{name}": {
      post: {
        tags: ["Operations"],
        summary: "Execute named workflow operation",
        description: "name e.g. run_charge_generation, run_dunning, apply_adjustment, send_email, import_camt, upload_document …",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "name", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", additionalProperties: true } } } },
        responses: { "200": { description: "OK" }, "400": { description: "Bad request" }, "403": { description: "Forbidden" }, "404": { description: "Not found" } },
      },
    },
    "/api/v1/records": {
      get: {
        tags: ["Records"],
        summary: "Schema discovery: writable entities & field definitions",
        description:
          "Generic persistence API. Returns all entities with field names, types, and relations. " +
          "Create: POST /api/v1/records/{entity}. Update: PATCH /api/v1/records/{entity}/{id}. Delete: DELETE …",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } },
      },
    },
    "/api/v1/records/{entity}": {
      post: {
        tags: ["Records"],
        summary: "Create entity record (generic)",
        description: "entity e.g. property, unit, person, lease, charge, payment, meeting, resolution, insurance, user …",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "entity", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", additionalProperties: true } } } },
        responses: { "201": { description: "Created" }, "400": { description: "Bad request" }, "403": { description: "Forbidden" } },
      },
    },
    "/api/v1/records/{entity}/{id}": {
      patch: {
        tags: ["Records"],
        summary: "Update entity record (generic)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "entity", in: "path", required: true, schema: { type: "string" } },
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", additionalProperties: true } } } },
        responses: { "200": { description: "OK" }, "404": { description: "Not found" }, "405": { description: "Record is immutable" } },
      },
      delete: {
        tags: ["Records"],
        summary: "Delete entity record (generic)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "entity", in: "path", required: true, schema: { type: "string" } },
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
    },
    "/api/v1/tasks": {
      get: listOp("Tasks", "List all tasks"),
      post: {
        tags: ["Tasks"],
        summary: "Create a task",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: { title: { type: "string" }, dueDate: { type: "string", format: "date" } },
              },
            },
          },
        },
        responses: { "201": { description: "Created" }, "400": { description: "Bad request" } },
      },
    },
    "/api/v1/persons": {
      get: listOp("People", "List contacts and people"),
      post: {
        tags: ["People"],
        summary: "Create a contact / person",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["firstName", "lastName"],
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  type: { type: "string", enum: ["MIETER", "EIGENTUEMER", "INTERESSENT", "HANDWERKER", "MAKLER", "BANK", "SONSTIGE"] },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Created" }, "400": { description: "Bad request" } },
      },
    },
    "/api/v1/tickets": {
      get: listOp("Maintenance", "List maintenance tickets"),
      post: {
        tags: ["Maintenance"],
        summary: "Create a maintenance ticket",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  propertyId: { type: "string" },
                  priority: { type: "string", enum: ["NIEDRIG", "MITTEL", "HOCH"] },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Created" }, "400": { description: "Bad request" } },
      },
    },
  },
};

export function GET() {
  return Response.json(spec);
}

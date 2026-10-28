# Localea — Rental & Property Management

_🇬🇧 English · 🇩🇪 [Deutsch](README.de.md)_

Complete property-management platform for **residential and commercial rentals**, leases, accounting, tenant/owner portals, maintenance, and multi-currency (KES, EUR, USD) operations.
Multi-tenant, role-based access control (RBAC), bilingual (EN/DE).

👉 **[Complete Deployment & Setup Guide (VPS, Cloud & Local)](SETUP.md)**

---

## 🌟 Key Features

- **Properties & Units**: Buildings, residential & commercial units, meter readings, allocation keys, and dynamic floor area models.
- **Tenants & Leases**: Lease contracts, rent indexation, stepped rent, deposit holding accounts with interest calculation, and notice tracking.
- **Finances & Billing**: Automated monthly rent charges, multi-currency invoicing (KES/EUR/USD), payment allocation, open-item tracking, and 3-stage dunning.
- **Multi-Tenancy (Model 2)**: Dynamic subdomain routing (`<subdomain>.rental.triotek.co.ke`) and custom domain mapping (`manage.company.com`).
- **Interactive Setup CLI**: Configure environment, database, subdomain, and initial administrator with `npm run setup:cli`.
- **Service-Charge & Operating Cost Statements**: Allocation engine (BetrKV, area-time models, heating degree-days, custom allocation rules).
- **Maintenance & Contractor Dispatch**: Ticket lifecycle with status workflows, priority escalation, contractor assignment, and cost tracking.
- **Document Management**: Centralized filing, invoice attachment, automatic recognition, and direct export.
- **Self-Service Portals**: Dedicated portals for tenants, property owners, and contractors (`/portal`) with role-based routing.
- **AI Assistant & MCP Server**: Embedded AI helper plus full [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server (`/api/mcp`) allowing external AI agents (Claude, ChatGPT, etc.) to query and operate the portfolio via secure per-user API tokens.
- **Accounting & Integrations**: SEPA & DATEV export format, bank statement import (`camt.053`), CSV imports/exports for all entities, and OpenAPI 3.1 specification (`/api-reference`).

---

## 💻 Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling & UI**: Tailwind CSS, shadcn/ui design components, Lucide icons, Motion animations
- **Database**: PostgreSQL (Prisma ORM) with in-memory resilient fallback
- **Authentication**: Auth.js (NextAuth v5) with credentials, Google OAuth, and optional OIDC/SSO
- **Internationalization**: `next-intl` (English & German)
- **API Spec**: OpenAPI 3.1 + Scalar API Reference (`/api-reference`)

---

## 🚀 Quick Setup with Localea CLI

Instead of Docker or manual file editing, Localea includes an interactive setup CLI:

```bash
# 1. Install dependencies
npm install

# 2. Run interactive onboarding wizard
npm run setup:cli

# 3. Start application
npm run dev      # For development
# OR
npm run build && npm start   # For production
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Pre-Configured Demo Logins

If running in Guided Demo Tour mode:
| Role | Email | Password | Access Area |
|---|---|---|---|
| **Administrator** | `admin@localea.app` | `admin` | Manager app (`/dashboard`) |
| **Tenant** | `mieter@localea.app` | `mieter` | Resident portal (`/portal`) |
| **Owner** | `eigentuemer@localea.app` | `eigentuemer` | Owner portal (`/portal`) |

---

## 🚢 Production Deployment Options

Full step-by-step instructions for all environments are documented in **[SETUP.md](SETUP.md)**:

1. **VPS / Linux Server (Ubuntu/Debian)**:
   - Systemd background service (`localea.service`)
   - Caddy reverse proxy with automatic HTTPS and wildcard TLS for `*.rental.triotek.co.ke`
2. **Cloud Platforms**:
   - Google Cloud Run, AWS ECS, Render, Railway
3. **Multi-Tenancy CLI Commands**:
   - `npm run cli setup` — Provision new organization & subdomain
   - `npm run cli tenant:list` — List active organizations and domain mappings
   - `npm run cli demo:toggle <subdomain>` — Switch between Guided Tour and live database

---

## 🤖 REST API & MCP Integration (AI Agents)

Localea includes full programmatic integration capabilities:
- **Interactive API Documentation**: Explore and test API endpoints at `/api-reference`.
- **OpenAPI 3.1 Spec**: Available at `/api/v1/openapi.json`.
- **MCP Server (Model Context Protocol)**: Located at `/api/mcp`. Easily connect Claude Desktop, Cursor, or ChatGPT to query and execute tasks in real time.

Configure in your MCP client:
```json
{
  "mcpServers": {
    "localea": {
      "url": "https://rental.triotek.co.ke/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_TOKEN"
      }
    }
  }
}
```

---

## 📄 License & Ownership

© 2026 Localea Rental Management. All rights reserved.

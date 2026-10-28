# 01. User Onboarding, Roles & Authentication Guide

This guide details the onboarding workflow, user credential administration, role-based access control (RBAC), self-service tenant/owner portal provisioning, and programmatic access via API/MCP tokens in Localea.

---

## 1. Multi-Tenant Architecture & Workspace Setup

Localea is built on a strict multi-tenant schema where every operational record (properties, units, leases, charges, payments, tickets) belongs to a designated `tenantId`.

- When a new installation is launched, a default property management tenant workspace is initialized.
- System administrators manage branding, default currency (KES / EUR), and SMTP mail server configurations in `/settings`.

### Role Hierarchy & Capabilities

| Role (`UserRole`) | Permissions | Typical Audience |
| :--- | :--- | :--- |
| **`ADMIN`** | Full access to tenant configuration, user provisioning, database seeding, API keys, and branding. | Portfolio Directors, Senior Partners, IT Admins. |
| **`VERWALTER`** | Read and write access to properties, units, leases, charges, dunning, maintenance tickets, and meetings. | Property Managers, Leasing Agents. |
| **`BUCHHALTUNG`** | Read/write access to financial accounts, charges, payments, bank imports, SEPA files, and DATEV exports. | Financial Officers, Accountants, Bookkeepers. |
| **`BEIRAT`** | Read-only audit access across properties, statements, and meeting protocols. | Condominium Advisory Board Members. |
| **`EIGENTUEMER`** | Restricted portal access to owned units, WEG annual statements, meeting minutes, and Hausgeld charges. | Condominium Unit Owners. |
| **`MIETER`** | Restricted self-service portal access to active tenancy, payment receipts, open balances, and maintenance tickets. | Residential & Commercial Tenants. |
| **`HANDWERKER`** | Contractor portal access for viewing assigned repair work orders and updating completion statuses. | Electricians, Plumbers, HVAC Technicians. |

---

## 2. Onboarding Staff Users

1. Navigate to **Settings** (`/settings`) → **Users** tab.
2. Click **Add User** (`newUser`).
3. Complete the required fields:
   - **Name**: Full name of staff member.
   - **Email**: Corporate login email address (must be unique across the tenant workspace).
   - **Role**: Select `ADMIN`, `VERWALTER`, or `BUCHHALTUNG`.
   - **Password**: Temporary password (users can change their password under their profile).
4. Save the user. Authentication is enforced via NextAuth with bcrypt password hashing.

---

## 3. Onboarding Tenant & Owner Portals

Localea allows tenants and condominium owners to access a dedicated self-service portal (`/portal`) without having access to the management back office.

### Step-by-Step Portal Provisioning

1. **Create the Person Record First**:
   - Navigate to **People** (`/persons`).
   - Create a person with contact details (e.g. John Doe, `john.doe@example.com`, type: `MIETER`).
2. **Execute Lease or Unit Ownership Assignment**:
   - Assign the person as a tenant on a lease (`/leases`) or as an owner on a WEG unit (`/units`).
3. **Provision the Portal Login**:
   - Navigate to **Settings** (`/settings`) → **Users**.
   - Create a new user with:
     - Role: `MIETER` (or `EIGENTUEMER`).
     - **Linked Person (`linkedPerson`)**: Select the person created in Step 1.
     - Password: Set initial secure access credential.
4. **Tenant Login**:
   - The tenant signs in at `/login`.
   - The system inspects their role (`requirePortal()`) and automatically directs them to the tenant portal view (`/portal`), where they can:
     - View active lease details (base rent, utility advance, gross rent).
     - Inspect payment history, current balance status (Credit / Arrears), and account statement.
     - Submit maintenance tickets with photo descriptions directly to property managers.

---

## 4. API & Model Context Protocol (MCP) Access

For automated external integrations, scripts, or AI agents:
1. Navigate to **Settings** → **API & MCP** tab.
2. Click **Create Personal Access Token**.
3. Set a label (e.g. `Accounting-Automation-Agent`) and copy the generated bearer token.
4. Use this token in HTTP Authorization headers:
   ```bash
   curl -H "Authorization: Bearer <TOKEN>" https://your-localea-domain/api/persons
   ```
5. Or configure Claude Desktop / MCP AI clients using the configuration snippet provided in the UI.

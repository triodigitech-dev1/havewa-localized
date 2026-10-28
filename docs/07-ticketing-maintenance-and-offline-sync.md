# 07. Ticketing, Maintenance & Offline Inspections Guide

This guide details facility management and maintenance operations in Localea: ticket logging, contractor dispatch, recurring maintenance contracts (Wartungsverträge), tenant portal reporting, and mobile Progressive Web App (PWA) offline sync for field inspections.

---

## 1. Ticket Lifecycle & Categorization

Maintenance requests in Localea are managed through the centralized **Tickets** module (`/tickets`).

### Ticket Schema & Attributes

| Attribute | Options / Format | Description |
| :--- | :--- | :--- |
| **Category (`TicketCategory`)** | `PLUMBING`, `HEATING`, `ELECTRICAL`, `STRUCTURAL`, `PEST_CONTROL`, `KEYS_LOCKS`, `GENERAL` | Classifies the technical domain for contractor assignment and cost reporting. |
| **Priority (`TicketPriority`)** | `LOW`, `MEDIUM`, `HIGH`, `EMERGENCY` | Determines resolution SLA and escalation routing (e.g. burst pipes are flagged `EMERGENCY`). |
| **Status (`TicketStatus`)** | `OPEN`, `IN_PROGRESS`, `WAITING_FOR_PARTS`, `RESOLVED`, `CANCELLED` | Real-time progression tracking. |
| **Location Scope** | Property $\rightarrow$ Building $\rightarrow$ Unit | Identifies the physical repair location. |
| **Reporter** | Staff user, Tenant (`MIETER`), or Condominium Owner (`EIGENTUEMER`) | Source of the problem report. |

---

## 2. Creating & Logging a Maintenance Ticket

### Method A: Property Manager / Staff Intake
1. Navigate to **Tickets** (`/tickets`) and click **New Ticket**.
2. Select the **Property**, **Building**, and specific **Unit** (or leave unit empty for common area building issues like stairwell lighting or main entry gates).
3. Provide a clear **Title** (e.g. "Heating Failure in Living Room - Radiator Cold").
4. Select category (`HEATING`) and priority (`HIGH`).
5. Enter detailed notes and attach photographic evidence or inspection documents.
6. Click **Create Ticket**.

### Method B: Self-Service Tenant Portal Submission
1. A tenant logs into their portal (`/portal`).
2. Clicks **Report Issue / Maintenance**.
3. Selects their apartment unit and problem category.
4. Types the description and uploads a smartphone photo.
5. Upon submission, the ticket is instantly visible on the property manager's dashboard with reporter details attached.

---

## 3. Contractor (Handwerker) Assignment & Work Orders

Once a ticket is created, property managers dispatch qualified contractors:

1. Open the Ticket detail page.
2. Under **Contractor Assignment**, select an approved contractor from your vendor directory (`/contractors`):
   - Plumbing specialists, Master electricians, HVAC technicians, Locksmiths.
3. Click **Generate Work Order (Handwerkerauftrag)**:
   - Localea generates a formatted work order with the building address, tenant contact details for appointment coordination, access instructions, and scope of work.
   - Send the order via email or dispatch directly to the contractor portal.
4. **Tracking Cost Estimates vs. Final Invoices**:
   - Record the contractor's initial quote (Kostenvoranschlag).
   - Once repairs are completed, log the contractor's final invoice (`invoiceAmount`, invoice number, and completion date).
   - The cost can be linked directly as an operating expense (apportionable maintenance vs. non-apportionable landlord maintenance).

---

## 4. Recurring Maintenance Contracts (Wartungsverträge)

Statutory safety regulations require periodic servicing of building equipment. Localea tracks recurring service contracts:

1. Navigate to **Maintenance Contracts** (`/maintenance`).
2. Click **New Contract**:
   - **Contractor / Service Provider**: e.g. "Otis Elevator Services", "Viessmann Heating Tech".
   - **Covered Asset**: Elevator system, heating boiler, fire extinguisher inspection, smoke detector checks.
   - **Interval**: Monthly, Quarterly, Semi-Annual, or Annual.
   - **Annual Contract Cost**: Contractual yearly fee.
   - **Next Service Due Date**: Calendar trigger date.
3. The dashboard alerts property managers 30 days prior to contract renewals and scheduled inspection dates.

---

## 5. Offline Field Inspections via Progressive Web App (PWA)

Property managers often perform property walk-throughs and unit handovers in basements, underground garages, or remote areas with poor mobile signal.

Localea is built as a complete Progressive Web App (PWA):

1. **Install the App**:
   - Open Localea in Chrome or Safari on an iPad, iPhone, or Android tablet.
   - Click **Install / Add to Home Screen**.
2. **Offline Data Caching**:
   - The Service Worker caches portfolio properties, units, tenant rosters, and active tickets locally in IndexedDB storage.
3. **Field Operations Without Signal**:
   - You can review property blueprints, inspect unit details, and draft new tickets or inspection notes while completely offline.
4. **Automatic Background Sync**:
   - When your device reconnects to Wi-Fi or cellular network, the Localea offline synchronization engine (`/api/offline-sync`) securely transmits all queued tickets, updates, and photos to the central database without data loss.

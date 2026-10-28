# 06. Communication, WhatsApp Reminders, Dunning & Statements

Effective tenant communication ensures timely rental collections, lowers delinquency rates, and maintains professional documentation. Localea provides instant 1-click WhatsApp messaging, multi-stage automated dunning (Mahnwesen), email broadcast capabilities, and official PDF statements.

---

## 1. One-Click WhatsApp Rent Reminders & Messaging

Localea integrates direct WhatsApp dispatch across property dashboards, tenant directories, lease overviews, and open charge tables. It automatically constructs international phone links (`https://wa.me/<phone>?text=...`) with pre-composed, personalized rent reminder templates.

### The Landlord / Property Manager Workflow

1. **Locate the Tenant**:
   - In the **Property Dashboard** (`/properties/[id]`), scroll to the **Active Tenants & WhatsApp Rent Reminders** card.
   - Or open **People** (`/persons/[id]`), **Leases** (`/leases`), or **Finances** (`/finances`).
2. **Click the WhatsApp Button**:
   - Next to the tenant's name or open charge, click **"Send Rent Reminder via WhatsApp"** (or the green WhatsApp icon).
3. **Instant App Launch**:
   - Your browser immediately launches the WhatsApp application (desktop app or WhatsApp Web on computer, or WhatsApp mobile app on phone).
4. **Pre-Filled Message**:
   - It drops you directly into the conversation with that specific tenant, with the reminder already pre-typed in the message input box:
     > *"Hi John, just a reminder that rent for Apt 4B at Riverside Residences of KES 65,000.00 is due on 01/11/2026. Outstanding Balance: KES 65,000.00. Please let us know once paid or share the confirmation slip. Thank you!"*
5. **Press Send**:
   - You review the message, adjust if desired, and simply press the green **Send** button inside WhatsApp.

### Quick Edit & Missing Phone Number Handling
- If a tenant does not have an international phone number saved on file, clicking the WhatsApp button opens an inline prompt allowing you to input their phone number or customize the reminder text on the fly before launching WhatsApp.
- International formats (e.g. `+254 712 345678` or local format `0712345678`) are automatically normalized to E.164 standard formatting without punctuation or leading zeros (`254712345678`).

---

## 2. Multi-Stage Dunning Process (Mahnwesen)

When tenants fall into arrears beyond contractual due dates, Localea provides a structured three-tier statutory dunning workflow accessible at `/dunning`.

### The 3 Dunning Escalation Tiers

| Stage | Trigger Interval | Default Fee | Action & Tone |
| :--- | :--- | :--- | :--- |
| **Tier 1: Zahlungserinnerung (Friendly Reminder)** | 5 – 10 days past due date | KES 0.00 / €0.00 | Polite notification advising the tenant that their monthly rent has not been credited. |
| **Tier 2: 1. Mahnung (First Formal Warning)** | 14 – 20 days past due date | KES 500.00 / €5.00 | Formal payment demand setting a fixed payment deadline (e.g. 7 days) and assessing a statutory dunning fee. |
| **Tier 3: 2. Mahnung / Letzte Mahnung (Final Legal Notice)** | 30+ days past due date | KES 1,500.00 / €15.00 | Strict legal warning threatening legal enforcement (Mahnbescheid) or tenancy termination (§ 543 / § 569 BGB) if arrears exceed 2 months' cold rent. |

### Executing a Dunning Run

1. Navigate to **Dunning** (`/dunning`).
2. The system scans all open charges where `dueDate < Today` and computes total arrears per tenant.
3. Review the candidate list. For each delinquent tenant, you can:
   - Inspect their chronological ledger and outstanding charges.
   - Advance their dunning level from 1 to 2 or 3.
   - Click **Generate Dunning Letter** to produce a printable PDF letter with statutory formal wording.
   - Click **Send Dunning Email** to deliver the notice directly via the configured tenant SMTP server.
   - Click **Send WhatsApp Reminder** for instant direct mobile follow-up.

---

## 3. Email Messaging & Broadcast Center

Localea includes an integrated email client and template engine (`/email` and `/templates`):

### Template Mail Merge Variables
You can construct reusable communication templates using dynamic tokens:
- `{{recipientName}}`: Full name of tenant or owner.
- `{{unitLabel}}`: Unit identifier (e.g. "Apt 302", "Shop 1B").
- `{{propertyName}}`: Property name.
- `{{monthlyRent}}`: Current contractual warm rent amount.
- `{{balanceDue}}`: Current net account arrears balance.
- `{{dueDate}}`: Next upcoming payment deadline.

### Bulk Property Broadcasts
To announce maintenance work, boiler servicing, or community notices to all occupants of a property:
1. Open **Email** (`/email`).
2. Select the recipient group:
   - **All Active Tenants in Property** (e.g. "Riverside Residences").
   - **WEG Owners Only**.
   - **Tenants with Outstanding Balances Only**.
3. Select an email template or write your message.
4. Preview the rendered text with sample merge data.
5. Click **Send Broadcast**: emails are sent in parallel via your configured SMTP host with full audit logging in `/audit`.

---

## 4. Tenant Account Statements (Saldenbestätigung)

Tenants, accountants, or tax advisors often request proof of rent payments or account balances:

1. Open the Person detail page (`/persons/[id]`).
2. Click **Print Statement** (`/print/statement?personId=...`).
3. Localea generates a clean, branded PDF document containing:
   - Property management corporate header and logo.
   - Tenant name, address, and lease unit reference.
   - Statement date and period.
   - Itemized debit and credit journal showing dates, descriptions, charges, payments, and running balance.
   - Concluding confirmation of whether the account is settled, in credit (Guthaben), or has an open balance due.

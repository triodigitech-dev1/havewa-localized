# 04. Finances, Credit/Debit Ledger & Payments Guide

This guide details Localea's accounting engine: double-entry tenant ledgers, automated charge generation, payment recording, credit/overpayment (Guthaben) tracking, CAMT.053 XML banking imports, SEPA direct debits, and DATEV exports.

---

## 1. Accounting Principles: Debits, Credits & Running Balances

Localea tracks tenant finances on a person-level and lease-level ledger (Mietkonto / Saldenblatt):

$$\text{Net Balance} = \sum \text{Credits (Payments Received)} - \sum \text{Debits (Charges Billed)}$$

### Financial Status States

| State | Condition | Meaning | Visual Indicator |
| :--- | :--- | :--- | :--- |
| **In Credit / Overpaid (Guthaben)** | $\text{Net Balance} > 0.00$ | The tenant has paid more than the total charges billed. A credit balance is held on their account. | **Emerald Badge** (`+KES 2,500.00 In credit`) |
| **Settled (Ausgeglichen)** | $\text{Net Balance} = 0.00$ | All billed charges have been paid in full with zero balance remaining. | **Secondary Badge** (`KES 0.00 Settled`) |
| **Balance Due / Arrears (Rückstand)** | $\text{Net Balance} < 0.00$ | The tenant has unpaid open charges or is in arrears. Subject to dunning follow-up. | **Amber / Red Badge** (`-KES 14,000.00 Due`) |

---

## 2. Monthly Automated Charge Generation (Sollstellung)

At the beginning of each billing cycle (or in advance):

1. Navigate to **Finances** (`/finances`).
2. Click **Generate Charges** (`generateCharges`).
3. Select the target month (e.g. `2026-11`).
4. The system automatically inspects all active leases for that month and:
   - Computes the gross rent: $\text{Base Cold Rent} + \sum \text{Rent Components}$.
   - Creates a `Charge` record with `type: MIETE`, `period: 2026-11-01`, and `dueDate: 2026-11-03`.
   - Idempotent: If charges for that month already exist for a lease, it skips them to prevent duplicate billing.
   - For commercial assets utilizing the Area Model, it automatically generates sub-area charges based on active area square meters and rates.

### Manual / Ad-hoc Charges
To bill a tenant for an unscheduled cost (e.g. key replacement fee, damages repair, annual utility settlement balance):
1. Click **Charge (manual)** in Finances or on the Person detail page.
2. Select the lease, charge type (`MIETE`, `NEBENKOSTEN`, `HAUSGELD`, `SONSTIGES`), amount, period, and due date.

---

## 3. Recording Payments

Payments can be recorded against specific charges or directly onto tenant accounts:

### Method A: Inline Recording on the Person Ledger
1. Open the Person detail page (`/persons/[id]`).
2. In the **Credit & Debit Ledger** table, locate the open charge row.
3. Click the **Record Payment** wallet icon (`Wallet`).
4. Enter the received payment details:
   - **Date**: Value date when funds arrived in the bank account.
   - **Amount**: Defaults to the open balance, but can be adjusted for partial payments or overpayments.
   - **Account**: Target bank account (e.g. Main Operating Bank Account).
   - **Reference**: Bank transaction memo or transaction code (e.g. `Miete Nov 2026 - M-Pesa Ref QX892`).
5. Upon saving:
   - A `Payment` record is created.
   - The open balance is updated in real time.
   - If the payment exceeds the charge amount, the excess immediately flows into the tenant's **Guthaben (Credit Balance)**.

### Method B: Recording from Finances Overview
1. Open **Finances** (`/finances`).
2. Under **Open Items**, click the **Record Payment** icon next to any open or partial charge.

---

## 4. Person Credit & Debit Ledger (Mietkonto)

On the Person detail page (`/persons/[id]`), property managers have access to a complete chronological statement:

1. **Top Metric Cards**:
   - **Total Debits (Billed)**: Sum of all contractual rent charges and fees billed to this tenant.
   - **Total Credits (Paid)**: Sum of all payments received from this tenant.
   - **Account Balance**: Current net position (+ for credit/overpayment, - for amount due).
   - **Open / Overdue**: Unpaid charges requiring immediate action.
2. **Itemized Transaction Journal**:
   - Every Charge (Soll) appears with date, description, and debit amount.
   - Every Payment (Haben) appears with bank receipt date, memo, and credit amount.
   - The **Running Balance** column tracks cumulative balance after each transaction.

---

## 5. Automated Bank Import (CAMT.053 XML)

Instead of manually typing bank statements, Localea supports automated electronic bank statement ingestion:

1. In **Finances**, click **Import camt.053**.
2. Select your bank's `.xml` file (standard ISO 20022 CAMT.053 format).
3. Select the target deposit bank account.
4. Click **Import**:
   - The engine parses all incoming credit entries (`CRDT`).
   - It automatically extracts payment amounts, booking dates, and remittance information (`Ustrd`).
   - It performs intelligent matching against open charges by matching tenant names, unit numbers, and exact due amounts.
   - Matches are booked automatically; non-matches are stored as unallocated incoming payments for one-click manual reconciliation.

---

## 6. Banking & Accounting Exports

- **SEPA Direct Debit (pain.008 XML)**: Generate automated direct debit transaction files for bank transmission to collect rent from tenants with signed SEPA mandates.
- **DATEV Export**: Export all monthly charges and bank payment journals in DATEV-compliant CSV format for your tax advisor and official financial accounting software.
- **Open Items CSV**: Export a real-time list of all debtors, outstanding receivables, and overpayments for executive reporting.
